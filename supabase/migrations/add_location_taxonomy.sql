-- ============================================================
-- Country / Region / State taxonomy
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- Adds countries → regions → states (each scoped by FK to its parent).
-- Adding a new country later only requires inserting rows — no schema
-- changes. States carry an approximate centroid lat/lng, used as a
-- coarse distance proxy for "Closest to Me" sorting until/unless
-- listings carry their own precise coordinates (columns added below,
-- nullable, for that future case).
-- ============================================================

create table if not exists public.countries (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  slug       text not null unique,
  iso_code   text,
  created_at timestamptz not null default now()
);

create table if not exists public.regions (
  id          uuid primary key default uuid_generate_v4(),
  country_id  uuid not null references public.countries(id) on delete cascade,
  name        text not null,
  slug        text not null,
  created_at  timestamptz not null default now(),
  unique (country_id, slug)
);

create table if not exists public.states (
  id          uuid primary key default uuid_generate_v4(),
  region_id   uuid not null references public.regions(id) on delete cascade,
  name        text not null,
  code        text,                  -- 2-letter abbreviation, e.g. 'TX' — matches legacy listings.location_state
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  created_at  timestamptz not null default now(),
  unique (region_id, name)
);

create index if not exists states_code_idx on public.states (code);

insert into public.countries (name, slug, iso_code) values
  ('United States', 'united-states', 'US')
on conflict (slug) do nothing;

-- ── Seed regions + states ─────────────────────────────────────
do $$
declare
  v_country_id uuid;
  v_region_id  uuid;
begin
  select id into v_country_id from public.countries where slug = 'united-states';

  -- Southern U.S.
  insert into public.regions (country_id, name, slug) values (v_country_id, 'Southern U.S.', 'southern-us')
  on conflict (country_id, slug) do update set name = excluded.name
  returning id into v_region_id;

  insert into public.states (region_id, name, code, latitude, longitude) values
    (v_region_id, 'Texas',          'TX', 31.000000,  -99.900000),
    (v_region_id, 'Oklahoma',       'OK', 35.500000,  -97.500000),
    (v_region_id, 'Louisiana',      'LA', 31.000000,  -92.000000),
    (v_region_id, 'Arkansas',       'AR', 34.900000,  -92.400000),
    (v_region_id, 'Mississippi',    'MS', 32.700000,  -89.700000),
    (v_region_id, 'Alabama',        'AL', 32.800000,  -86.800000),
    (v_region_id, 'Tennessee',      'TN', 35.900000,  -86.400000),
    (v_region_id, 'Kentucky',       'KY', 37.500000,  -85.300000),
    (v_region_id, 'Florida',        'FL', 27.800000,  -81.700000),
    (v_region_id, 'Georgia',        'GA', 32.600000,  -83.400000),
    (v_region_id, 'South Carolina', 'SC', 33.900000,  -80.900000),
    (v_region_id, 'North Carolina', 'NC', 35.600000,  -79.400000),
    (v_region_id, 'Virginia',       'VA', 37.500000,  -78.700000),
    (v_region_id, 'West Virginia',  'WV', 38.600000,  -80.600000)
  on conflict (region_id, name) do nothing;

  -- Western U.S.
  insert into public.regions (country_id, name, slug) values (v_country_id, 'Western U.S.', 'western-us')
  on conflict (country_id, slug) do update set name = excluded.name
  returning id into v_region_id;

  insert into public.states (region_id, name, code, latitude, longitude) values
    (v_region_id, 'California', 'CA', 36.800000, -119.400000),
    (v_region_id, 'Nevada',     'NV', 39.500000, -117.000000),
    (v_region_id, 'Arizona',    'AZ', 34.000000, -111.600000),
    (v_region_id, 'New Mexico', 'NM', 34.500000, -106.100000),
    (v_region_id, 'Colorado',   'CO', 39.000000, -105.500000),
    (v_region_id, 'Utah',       'UT', 39.300000, -111.700000),
    (v_region_id, 'Wyoming',    'WY', 43.000000, -107.500000),
    (v_region_id, 'Montana',    'MT', 47.000000, -110.000000),
    (v_region_id, 'Idaho',      'ID', 44.200000, -114.500000),
    (v_region_id, 'Washington', 'WA', 47.400000, -120.500000),
    (v_region_id, 'Oregon',     'OR', 44.000000, -120.500000),
    (v_region_id, 'Alaska',     'AK', 64.000000, -150.000000),
    (v_region_id, 'Hawaii',     'HI', 20.800000, -156.300000)
  on conflict (region_id, name) do nothing;

  -- Midwestern U.S.
  insert into public.regions (country_id, name, slug) values (v_country_id, 'Midwestern U.S.', 'midwestern-us')
  on conflict (country_id, slug) do update set name = excluded.name
  returning id into v_region_id;

  insert into public.states (region_id, name, code, latitude, longitude) values
    (v_region_id, 'North Dakota', 'ND', 47.500000, -100.500000),
    (v_region_id, 'South Dakota', 'SD', 44.500000, -100.200000),
    (v_region_id, 'Nebraska',     'NE', 41.500000,  -99.700000),
    (v_region_id, 'Kansas',       'KS', 38.500000,  -98.000000),
    (v_region_id, 'Minnesota',    'MN', 46.000000,  -94.600000),
    (v_region_id, 'Iowa',         'IA', 42.000000,  -93.500000),
    (v_region_id, 'Missouri',     'MO', 38.500000,  -92.500000),
    (v_region_id, 'Wisconsin',    'WI', 44.600000,  -89.900000),
    (v_region_id, 'Illinois',     'IL', 40.000000,  -89.200000),
    (v_region_id, 'Michigan',     'MI', 44.300000,  -85.600000),
    (v_region_id, 'Indiana',      'IN', 39.900000,  -86.300000),
    (v_region_id, 'Ohio',         'OH', 40.400000,  -82.800000)
  on conflict (region_id, name) do nothing;

  -- Northeastern U.S.
  insert into public.regions (country_id, name, slug) values (v_country_id, 'Northeastern U.S.', 'northeastern-us')
  on conflict (country_id, slug) do update set name = excluded.name
  returning id into v_region_id;

  insert into public.states (region_id, name, code, latitude, longitude) values
    (v_region_id, 'Pennsylvania',         'PA', 40.900000, -77.800000),
    (v_region_id, 'New York',             'NY', 42.900000, -75.500000),
    (v_region_id, 'New Jersey',           'NJ', 40.100000, -74.700000),
    (v_region_id, 'Connecticut',          'CT', 41.600000, -72.700000),
    (v_region_id, 'Rhode Island',         'RI', 41.700000, -71.500000),
    (v_region_id, 'Massachusetts',        'MA', 42.300000, -71.800000),
    (v_region_id, 'Vermont',              'VT', 44.000000, -72.700000),
    (v_region_id, 'New Hampshire',        'NH', 43.700000, -71.600000),
    (v_region_id, 'Maine',                'ME', 45.400000, -69.000000),
    (v_region_id, 'Delaware',             'DE', 39.000000, -75.500000),
    (v_region_id, 'Maryland',             'MD', 39.000000, -76.700000),
    (v_region_id, 'District of Columbia', 'DC', 38.900000, -77.000000)
  on conflict (region_id, name) do nothing;
end $$;

-- ── Listings: add FK columns + optional precise coordinates ──
alter table public.listings
  add column if not exists country_id uuid references public.countries(id),
  add column if not exists region_id  uuid references public.regions(id),
  add column if not exists state_id   uuid references public.states(id),
  add column if not exists latitude   numeric(9,6),   -- precise per-listing coords, optional — falls
  add column if not exists longitude  numeric(9,6);   -- back to the state centroid above when null

create index if not exists listings_state_id_idx on public.listings (state_id);

-- ── Backfill from legacy location_state text (2-letter code) ──
update public.listings l
set state_id   = s.id,
    region_id  = s.region_id,
    country_id = r.country_id
from public.states s
join public.regions r on r.id = s.region_id
where l.state_id is null
  and l.location_state is not null
  and upper(trim(l.location_state)) = s.code;

-- ── RLS — public reference data, read-only from the browser ──
alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.states enable row level security;

drop policy if exists "Anyone can view countries" on public.countries;
create policy "Anyone can view countries" on public.countries for select using (true);

drop policy if exists "Anyone can view regions" on public.regions;
create policy "Anyone can view regions" on public.regions for select using (true);

drop policy if exists "Anyone can view states" on public.states;
create policy "Anyone can view states" on public.states for select using (true);
