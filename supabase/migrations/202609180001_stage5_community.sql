-- Etapa 5: cuentas opcionales, favoritos sincronizados y contribuciones moderadas.
--
-- La búsqueda continúa siendo pública. Las filas personales solo son visibles
-- para su propietario y las contribuciones nunca se publican sin moderación.

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 40),
  avatar_key text not null default 'explorer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  restroom_id uuid not null references public.restrooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restroom_id)
);

create table if not exists public.restroom_reports (
  id uuid primary key default gen_random_uuid(),
  restroom_id uuid not null references public.restrooms(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  report_type text not null check (report_type in (
    'could_use', 'closed', 'purchase_required', 'pass_required',
    'wrong_location', 'missing_paper', 'cleanliness'
  )),
  observation_at timestamptz not null,
  details text check (details is null or char_length(details) <= 800),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 800),
  constraint restroom_reports_observation_window check (
    observation_at <= submitted_at + interval '5 minutes'
    and observation_at >= submitted_at - interval '1 year'
  ),
  constraint restroom_reports_review_state check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  )
);

create table if not exists public.restroom_reviews (
  id uuid primary key default gen_random_uuid(),
  restroom_id uuid not null references public.restrooms(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  cleanliness smallint not null check (cleanliness between 1 and 5),
  observation_at timestamptz not null,
  comment text check (comment is null or char_length(comment) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 800),
  constraint restroom_reviews_observation_window check (
    observation_at <= submitted_at + interval '5 minutes'
    and observation_at >= submitted_at - interval '1 year'
  ),
  constraint restroom_reviews_review_state check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  )
);

-- Resumen público sin identificadores de usuarios. Solo se actualiza mediante
-- trigger cuando una reseña cambia de estado.
create table if not exists public.restroom_review_summaries (
  restroom_id uuid primary key references public.restrooms(id) on delete cascade,
  review_count integer not null default 0 check (review_count >= 0),
  cleanliness_average numeric(3, 2) check (cleanliness_average between 1 and 5),
  latest_observation_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.badge_definitions (
  key text primary key,
  name text not null,
  description text not null,
  threshold integer not null check (threshold > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null references public.badge_definitions(key) on delete restrict,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

insert into public.badge_definitions (key, name, description, threshold)
values
  ('first_approved', 'Primer aporte', 'Primer reporte o reseña aprobado.', 1),
  ('five_corrections', 'Ojo de halcón', 'Cinco correcciones aprobadas.', 5),
  ('ten_verifications', 'Guía local', 'Diez verificaciones de acceso aprobadas.', 10)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  threshold = excluded.threshold;

create index if not exists favorites_restroom_idx on public.favorites (restroom_id);
create index if not exists restroom_reports_owner_idx on public.restroom_reports (reporter_id, submitted_at desc);
create index if not exists restroom_reports_moderation_idx on public.restroom_reports (status, submitted_at);
create index if not exists restroom_reviews_owner_idx on public.restroom_reviews (author_id, submitted_at desc);
create index if not exists restroom_reviews_moderation_idx on public.restroom_reviews (status, submitted_at);
create unique index if not exists restroom_reports_one_pending_kind_idx
  on public.restroom_reports (reporter_id, restroom_id, report_type)
  where status = 'pending';
create unique index if not exists restroom_reviews_one_pending_idx
  on public.restroom_reviews (author_id, restroom_id)
  where status = 'pending';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists set_profile_updated_at on public.profiles;
create trigger set_profile_updated_at
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

insert into public.profiles (id, display_name)
select id, nullif(trim(raw_user_meta_data ->> 'display_name'), '')
from auth.users
on conflict (id) do nothing;

create or replace function private.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('moderator', 'admin'),
    false
  );
$$;

create or replace function private.enforce_report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reporter_id is distinct from auth.uid() then
    raise exception 'reporter_id must match the authenticated user';
  end if;
  if exists (
    select 1 from public.restroom_reports
    where reporter_id = new.reporter_id
      and submitted_at > now() - interval '2 minutes'
  ) then
    raise exception 'Please wait before sending another report';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_review_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_id is distinct from auth.uid() then
    raise exception 'author_id must match the authenticated user';
  end if;
  if exists (
    select 1 from public.restroom_reviews
    where author_id = new.author_id
      and submitted_at > now() - interval '10 minutes'
  ) then
    raise exception 'Please wait before sending another review';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_report_rate_limit on public.restroom_reports;
create trigger enforce_report_rate_limit
  before insert on public.restroom_reports
  for each row execute function private.enforce_report_rate_limit();

drop trigger if exists enforce_review_rate_limit on public.restroom_reviews;
create trigger enforce_review_rate_limit
  before insert on public.restroom_reviews
  for each row execute function private.enforce_review_rate_limit();

create or replace function private.refresh_review_summary(target_restroom_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.restroom_review_summaries (
    restroom_id, review_count, cleanliness_average, latest_observation_at, updated_at
  )
  select
    target_restroom_id,
    count(*)::integer,
    round(avg(cleanliness)::numeric, 2),
    max(observation_at),
    now()
  from public.restroom_reviews
  where restroom_id = target_restroom_id and status = 'approved'
  on conflict (restroom_id) do update set
    review_count = excluded.review_count,
    cleanliness_average = excluded.cleanliness_average,
    latest_observation_at = excluded.latest_observation_at,
    updated_at = excluded.updated_at;
$$;

create or replace function private.refresh_review_summary_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_review_summary(coalesce(new.restroom_id, old.restroom_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_review_summary on public.restroom_reviews;
create trigger refresh_review_summary
  after insert or update or delete on public.restroom_reviews
  for each row execute function private.refresh_review_summary_trigger();

create or replace function private.refresh_contribution_badges(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_total integer;
  approved_corrections integer;
  approved_verifications integer;
begin
  select
    (select count(*) from public.restroom_reports where reporter_id = target_user_id and status = 'approved')
    + (select count(*) from public.restroom_reviews where author_id = target_user_id and status = 'approved')
  into approved_total;

  select count(*) into approved_corrections
  from public.restroom_reports
  where reporter_id = target_user_id
    and status = 'approved'
    and report_type <> 'could_use';

  select count(*) into approved_verifications
  from public.restroom_reports
  where reporter_id = target_user_id
    and status = 'approved'
    and report_type = 'could_use';

  if approved_total >= 1 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'first_approved') on conflict do nothing;
  end if;
  if approved_corrections >= 5 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'five_corrections') on conflict do nothing;
  end if;
  if approved_verifications >= 10 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'ten_verifications') on conflict do nothing;
  end if;
end;
$$;

create or replace function private.refresh_badges_from_contribution()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'restroom_reports' then
    perform private.refresh_contribution_badges(new.reporter_id);
  else
    perform private.refresh_contribution_badges(new.author_id);
  end if;
  return new;
end;
$$;

drop trigger if exists refresh_report_badges on public.restroom_reports;
create trigger refresh_report_badges
  after update of status on public.restroom_reports
  for each row
  when (new.status = 'approved' and old.status is distinct from new.status)
  execute function private.refresh_badges_from_contribution();

drop trigger if exists refresh_review_badges on public.restroom_reviews;
create trigger refresh_review_badges
  after update of status on public.restroom_reviews
  for each row
  when (new.status = 'approved' and old.status is distinct from new.status)
  execute function private.refresh_badges_from_contribution();

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.restroom_reports enable row level security;
alter table public.restroom_reviews enable row level security;
alter table public.restroom_review_summaries enable row level security;
alter table public.badge_definitions enable row level security;
alter table public.user_badges enable row level security;

-- Grants mínimos: una política nunca reemplaza los privilegios de tabla.
revoke all on public.restrooms, public.restroom_sources, public.restroom_schedule_exceptions
  from anon, authenticated;
grant select on public.restrooms, public.restroom_sources, public.restroom_schedule_exceptions
  to anon, authenticated;

revoke all on public.profiles, public.favorites, public.restroom_reports,
  public.restroom_reviews, public.restroom_review_summaries,
  public.badge_definitions, public.user_badges from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_key) on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.restroom_reports, public.restroom_reviews to authenticated;
grant update (status, reviewed_at, reviewed_by, resolution_note)
  on public.restroom_reports, public.restroom_reviews to authenticated;
grant select on public.restroom_review_summaries, public.badge_definitions to anon, authenticated;
grant select on public.user_badges to authenticated;

grant usage on schema private to authenticated;
revoke all on function private.is_moderator() from public;
grant execute on function private.is_moderator() to authenticated;
revoke all on function private.refresh_review_summary(uuid) from public;
revoke all on function private.refresh_contribution_badges(uuid) from public;

drop policy if exists "Public can read published restrooms" on public.restrooms;
create policy "Public can read published restrooms"
  on public.restrooms for select to anon, authenticated
  using (publication_status = 'published');

drop policy if exists "Public can read sources for published restrooms" on public.restroom_sources;
create policy "Public can read sources for published restrooms"
  on public.restroom_sources for select to anon, authenticated
  using (exists (
    select 1 from public.restrooms
    where restrooms.id = restroom_sources.restroom_id
      and restrooms.publication_status = 'published'
  ));

drop policy if exists "Public can read exceptions for published restrooms" on public.restroom_schedule_exceptions;
create policy "Public can read exceptions for published restrooms"
  on public.restroom_schedule_exceptions for select to anon, authenticated
  using (exists (
    select 1 from public.restrooms
    where restrooms.id = restroom_schedule_exceptions.restroom_id
      and restrooms.publication_status = 'published'
  ));

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites"
  on public.favorites for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own favorites" on public.favorites;
create policy "Users can add own favorites"
  on public.favorites for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own favorites" on public.favorites;
create policy "Users can remove own favorites"
  on public.favorites for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own reports" on public.restroom_reports;
create policy "Users can read own reports"
  on public.restroom_reports for select to authenticated
  using ((select auth.uid()) = reporter_id or private.is_moderator());

drop policy if exists "Users can submit own reports" on public.restroom_reports;
create policy "Users can submit own reports"
  on public.restroom_reports for insert to authenticated
  with check (
    (select auth.uid()) = reporter_id
    and status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
  );

drop policy if exists "Moderators can resolve reports" on public.restroom_reports;
create policy "Moderators can resolve reports"
  on public.restroom_reports for update to authenticated
  using (private.is_moderator())
  with check (
    private.is_moderator()
    and status in ('approved', 'rejected')
    and reviewed_by = (select auth.uid())
    and reviewed_at is not null
    and reporter_id <> (select auth.uid())
  );

drop policy if exists "Users can read own reviews" on public.restroom_reviews;
create policy "Users can read own reviews"
  on public.restroom_reviews for select to authenticated
  using ((select auth.uid()) = author_id or private.is_moderator());

drop policy if exists "Users can submit own reviews" on public.restroom_reviews;
create policy "Users can submit own reviews"
  on public.restroom_reviews for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
  );

drop policy if exists "Moderators can resolve reviews" on public.restroom_reviews;
create policy "Moderators can resolve reviews"
  on public.restroom_reviews for update to authenticated
  using (private.is_moderator())
  with check (
    private.is_moderator()
    and status in ('approved', 'rejected')
    and reviewed_by = (select auth.uid())
    and reviewed_at is not null
    and author_id <> (select auth.uid())
  );

drop policy if exists "Public can read review summaries" on public.restroom_review_summaries;
create policy "Public can read review summaries"
  on public.restroom_review_summaries for select to anon, authenticated
  using (exists (
    select 1 from public.restrooms
    where restrooms.id = restroom_review_summaries.restroom_id
      and restrooms.publication_status = 'published'
  ));

drop policy if exists "Public can read badge definitions" on public.badge_definitions;
create policy "Public can read badge definitions"
  on public.badge_definitions for select to anon, authenticated using (true);

drop policy if exists "Users can read own badges" on public.user_badges;
create policy "Users can read own badges"
  on public.user_badges for select to authenticated
  using ((select auth.uid()) = user_id);

-- Verificaciones sugeridas después de aplicar:
-- 1. anon ve solo restrooms publicados y resúmenes, nunca borradores o autores.
-- 2. usuario A no puede leer favoritos, perfil o contribuciones de usuario B.
-- 3. un usuario no puede cambiar status/reviewed_by ni aprobar su propio aporte.
-- 4. dos reportes pending iguales del mismo usuario fallan por índice único.
