-- Etapa 1: modelo operativo para Baño Radar.
--
-- Esta migración presupone que public.restrooms_seed ya existe y conserva los
-- 30 candidatos de investigación originales. Es segura al repetirse: la
-- importación usa seed_id y no actualiza filas existentes, de modo que una
-- corrección manual no se pierde.

create table if not exists public.restrooms (
  id uuid primary key default gen_random_uuid(),
  seed_id bigint unique,
  name text not null,
  complex_id text,
  zone text not null check (zone in ('national_mall', 'downtown')),
  venue_type text,

  address text,
  city text not null default 'Washington',
  region text not null default 'DC',
  country text not null default 'US',
  entrance_latitude double precision,
  entrance_longitude double precision,
  location_precision text not null default 'unknown'
    check (location_precision in ('entrance', 'venue', 'landmark', 'unknown')),
  geocode_source_url text,
  geocoded_at timestamptz,

  entrance_notes text,
  floor text,
  indoor_instructions text,
  entrance_verified_at timestamptz,

  access_type text not null default 'unknown'
    check (access_type in ('public', 'venue_visitors', 'customers', 'permission_required', 'private', 'unknown')),
  requires_purchase boolean,
  requires_ticket boolean,
  fee_usd numeric(8, 2) check (fee_usd is null or fee_usd >= 0),
  security_screening text,

  timezone text not null default 'America/New_York',
  venue_hours_text text,
  restroom_weekly_hours jsonb,
  hours_basis text not null default 'unknown'
    check (hours_basis in ('restroom', 'venue_inferred', 'unknown')),
  last_entry_minutes_before_close integer
    check (last_entry_minutes_before_close is null or last_entry_minutes_before_close >= 0),
  hours_verified_at timestamptz,

  wheelchair_access text not null default 'unknown'
    check (wheelchair_access in ('yes', 'limited', 'no', 'unknown')),
  changing_table boolean,
  family_restroom boolean,
  gender_neutral boolean,

  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  operational_status text not null default 'unknown'
    check (operational_status in ('unknown', 'operating', 'temporarily_closed', 'permanently_closed')),
  temporary_closure_until date,
  operational_checked_at timestamptz,

  evidence_status text not null
    check (evidence_status in ('official_restroom', 'community_restroom', 'venue_only')),
  researched_at date,
  field_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint restrooms_coordinates_together check (
    (entrance_latitude is null and entrance_longitude is null)
    or (
      entrance_latitude between -90 and 90
      and entrance_longitude between -180 and 180
    )
  ),
  constraint restrooms_weekly_hours_object check (
    restroom_weekly_hours is null or jsonb_typeof(restroom_weekly_hours) = 'object'
  )
);

create table if not exists public.restroom_sources (
  id uuid primary key default gen_random_uuid(),
  restroom_id uuid not null references public.restrooms(id) on delete cascade,
  url text not null,
  publisher text,
  source_kind text not null check (source_kind in ('operator', 'government', 'community', 'other')),
  claim_scope text not null check (claim_scope in ('address', 'restroom_existence', 'access', 'hours', 'amenities', 'location')),
  summary text not null,
  source_published_at date,
  source_updated_at date,
  retrieved_at date not null,
  verification_method text not null check (verification_method in ('web', 'operator_contact', 'field_visit')),
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  unique (restroom_id, url, claim_scope)
);

create table if not exists public.restroom_schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  restroom_id uuid not null references public.restrooms(id) on delete cascade,
  local_date date not null,
  closed boolean not null default false,
  intervals jsonb,
  source_id uuid references public.restroom_sources(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restroom_schedule_exceptions_intervals_array check (
    intervals is null or jsonb_typeof(intervals) = 'array'
  ),
  unique (restroom_id, local_date)
);

create index if not exists restrooms_publication_zone_idx
  on public.restrooms (publication_status, zone);
create index if not exists restroom_sources_restroom_id_idx
  on public.restroom_sources (restroom_id);
create index if not exists restroom_schedule_exceptions_restroom_date_idx
  on public.restroom_schedule_exceptions (restroom_id, local_date);

-- No se crean políticas de lectura todavía. RLS queda activado antes de que la
-- aplicación reciba una clave publicable, por lo que los borradores no quedan
-- expuestos accidentalmente.
alter table public.restrooms enable row level security;
alter table public.restroom_sources enable row level security;
alter table public.restroom_schedule_exceptions enable row level security;

-- Importación inicial: transforma campos vacíos en NULL y conserva la
-- incertidumbre de acceso, horario y comodidades. No asigna coordenadas ni
-- publica registros. Repetir la migración no duplica ni sobrescribe filas.
insert into public.restrooms (
  seed_id, name, complex_id, zone, address, location_precision,
  entrance_notes, access_type, requires_purchase, requires_ticket,
  venue_hours_text, hours_basis, publication_status, evidence_status, researched_at
)
select
  seed.id,
  seed.name,
  case when seed.id in (9, 10) then 'national-gallery-of-art' else null end,
  seed.zone,
  nullif(seed.address, ''),
  case
    when seed.address_precision in ('entrance', 'venue', 'landmark') then seed.address_precision
    else 'unknown'
  end,
  nullif(seed.entrance_notes, ''),
  case seed.access_policy
    when 'public_restroom' then 'public'
    when 'museum_no_pass' then 'venue_visitors'
    when 'free_venue_access' then 'venue_visitors'
    when 'timed_pass_required' then 'venue_visitors'
    else 'unknown'
  end,
  case seed.access_policy
    when 'public_restroom' then false
    when 'museum_no_pass' then false
    when 'free_venue_access' then false
    when 'timed_pass_required' then false
    else null
  end,
  case seed.access_policy
    when 'public_restroom' then false
    when 'museum_no_pass' then false
    when 'free_venue_access' then false
    when 'timed_pass_required' then true
    else null
  end,
  nullif(seed.venue_hours_text, ''),
  case when nullif(seed.venue_hours_text, '') is null then 'unknown' else 'venue_inferred' end,
  'draft',
  seed.evidence_status,
  nullif(seed.researched_on, '')::date
from public.restrooms_seed as seed
on conflict (seed_id) do nothing;

-- Dos fuentes por candidato: la fuente de baños conserva un alcance limitado
-- a lo que la evidencia realmente respalda; la fuente del lugar respalda la
-- dirección/contexto. Las filas venue_only no afirman todavía que exista baño.
insert into public.restroom_sources (
  restroom_id, url, source_kind, claim_scope, summary, retrieved_at, verification_method
)
select
  restroom.id,
  seed.restroom_source_url,
  case
    when seed.evidence_status = 'community_restroom' then 'community'
    when seed.evidence_status = 'official_restroom' then 'operator'
    else 'other'
  end,
  case
    when seed.evidence_status in ('official_restroom', 'community_restroom') then 'restroom_existence'
    else 'address'
  end,
  'Importado desde restrooms_seed; revisar la fuente antes de convertir esta afirmación en datos publicados.',
  nullif(seed.researched_on, '')::date,
  'web'
from public.restrooms_seed as seed
join public.restrooms as restroom on restroom.seed_id = seed.id
where nullif(seed.restroom_source_url, '') is not null
on conflict (restroom_id, url, claim_scope) do nothing;

insert into public.restroom_sources (
  restroom_id, url, source_kind, claim_scope, summary, retrieved_at, verification_method
)
select
  restroom.id,
  seed.venue_source_url,
  'other',
  'address',
  'Importado desde restrooms_seed como fuente de dirección, horario o contexto del establecimiento.',
  nullif(seed.researched_on, '')::date,
  'web'
from public.restrooms_seed as seed
join public.restrooms as restroom on restroom.seed_id = seed.id
where nullif(seed.venue_source_url, '') is not null
on conflict (restroom_id, url, claim_scope) do nothing;

-- Consultas de verificación manual después de ejecutar:
-- select count(*) from public.restrooms; -- debe ser 30 al inicio
-- select seed_id, count(*) from public.restrooms group by seed_id having count(*) > 1; -- 0 filas
-- select publication_status, count(*) from public.restrooms group by publication_status; -- 30 draft
