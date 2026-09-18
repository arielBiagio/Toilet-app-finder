-- Catálogo inicial para desarrollo y portfolio.
-- Estas coordenadas permiten probar el flujo completo de la aplicación. Las
-- filas siguen conservando field_verified_at = null para distinguirlas de una
-- verificación presencial futura.

begin;

with catalog_coordinates(seed_id, latitude, longitude) as (
  values
    (1::bigint, 38.8919589, -77.0263648),
    (2::bigint, 38.8912397, -77.0300205),
    (3::bigint, 38.8876927, -77.0172946),
    (4::bigint, 38.8880597, -77.0217497),
    (5::bigint, 38.8881222, -77.0276002),
    (6::bigint, 38.8880093, -77.0255044),
    (7::bigint, 38.8886847, -77.0197696),
    (8::bigint, 38.8910670, -77.0327040),
    (9::bigint, 38.8921980, -77.0198030),
    (10::bigint, 38.8913649, -77.0176611),
    (11::bigint, 38.8888000, -77.0502000),
    (12::bigint, 38.8894000, -77.0407000),
    (13::bigint, 38.8832000, -77.0437000),
    (14::bigint, 38.8814000, -77.0365000),
    (15::bigint, 38.8861000, -77.0442000),
    (16::bigint, 38.8897000, -77.0355000),
    (17::bigint, 38.8871000, -77.0351000),
    (18::bigint, 38.8894000, -77.0455000),
    (19::bigint, 38.8847000, -77.0186000),
    (20::bigint, 38.8881951, -77.0124762),
    (21::bigint, 38.8986914, -77.0247662),
    (22::bigint, 38.8979000, -77.0230000),
    (23::bigint, 38.9014000, -77.0315000),
    (24::bigint, 38.8951317, -77.0327997),
    (25::bigint, 38.9022279, -77.0293023),
    (26::bigint, 38.8977549, -77.0175512),
    (27::bigint, 38.8921600, -77.0220550),
    (28::bigint, 38.9017887, -77.0426039),
    (29::bigint, 38.8942317, -77.0306901),
    (30::bigint, 38.9025677, -77.0229533)
)
update public.restrooms as restroom
set
  entrance_latitude = coordinates.latitude,
  entrance_longitude = coordinates.longitude,
  geocode_source_url = 'https://www.openstreetmap.org/',
  geocoded_at = now(),
  operational_status = 'operating',
  publication_status = 'published',
  updated_at = now()
from catalog_coordinates as coordinates
where restroom.seed_id = coordinates.seed_id;

do $$
declare
  published_count integer;
begin
  select count(*) into published_count
  from public.restrooms
  where publication_status = 'published'
    and entrance_latitude is not null
    and entrance_longitude is not null;

  if published_count < 30 then
    raise exception 'Expected 30 published restrooms with coordinates, found %', published_count;
  end if;
end $$;

commit;
