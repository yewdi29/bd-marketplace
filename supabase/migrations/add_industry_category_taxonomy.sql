-- ============================================================
-- Industry & Category taxonomy
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- Adds: industries, categories, category_industries (many-to-many —
-- a category can belong to more than one industry, e.g. a future
-- "Loaders" category under both Construction and Mining).
-- Adds industry_id / category_id FKs to listings and backfills them
-- from the legacy `category` text column on a best-effort basis.
-- ============================================================

-- ── INDUSTRIES ──────────────────────────────────────────────
create table if not exists public.industries (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.industries (name, slug, sort_order) values
  ('Oil & Gas',         'oil_gas',         1),
  ('Construction',      'construction',    2),
  ('Mining',            'mining',          3),
  ('Agriculture',       'agriculture',     4),
  ('Trucks & Trailers', 'trucks_trailers', 5)
on conflict (slug) do nothing;

-- ── CATEGORIES ──────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- ── CATEGORY ↔ INDUSTRY join (many-to-many) ──────────────────
create table if not exists public.category_industries (
  category_id uuid not null references public.categories(id) on delete cascade,
  industry_id uuid not null references public.industries(id) on delete cascade,
  primary key (category_id, industry_id)
);

create index if not exists category_industries_industry_id_idx
  on public.category_industries (industry_id);

-- ── Seed categories + industry links ─────────────────────────
do $$
declare
  v_industry_id uuid;
  v_category_id uuid;
  cat record;
begin
  for cat in (
    select * from (values
      ('oil_gas',        'Coiled Tubing Equipment'),
      ('oil_gas',        'Drilling Rigs'),
      ('oil_gas',        'Drilling Rig Parts'),
      ('oil_gas',        'Drill Pipe & Tubulars'),
      ('oil_gas',        'Drill Bits'),
      ('oil_gas',        'Workover & Well Service Rigs'),
      ('oil_gas',        'Pumps & Pump Jacks'),
      ('oil_gas',        'Separators & Tanks'),
      ('oil_gas',        'Compressors'),
      ('oil_gas',        'Wellhead Equipment'),
      ('oil_gas',        'Pipe Racks'),
      ('oil_gas',        'Fishing & Rental Tools'),
      ('construction',   'Excavators'),
      ('construction',   'Wheel Loaders'),
      ('construction',   'Crawler Dozers'),
      ('construction',   'Backhoe Loaders'),
      ('construction',   'Skid Steer Loaders'),
      ('construction',   'Motor Graders'),
      ('construction',   'Cranes'),
      ('construction',   'Compaction Equipment'),
      ('construction',   'Aerial Lifts & Telehandlers'),
      ('construction',   'Dump Trucks'),
      ('construction',   'Asphalt & Paving Equipment'),
      ('mining',         'Haul Trucks'),
      ('mining',         'Crushers'),
      ('mining',         'Loaders & Shovels'),
      ('mining',         'Drills (Surface & Underground)'),
      ('mining',         'Underground Mining Equipment'),
      ('mining',         'Conveyors & Feeders'),
      ('mining',         'Grinding Mills'),
      ('mining',         'Screens & Vibrating Equipment'),
      ('agriculture',    'Tractors'),
      ('agriculture',    'Combines'),
      ('agriculture',    'Irrigation Equipment'),
      ('agriculture',    'Tillage Equipment'),
      ('agriculture',    'Hay & Forage Equipment'),
      ('trucks_trailers','Trucks'),
      ('trucks_trailers','Trailers'),
      ('trucks_trailers','Pickups'),
      ('trucks_trailers','Tool Trucks')
    ) as t(industry_slug, category_name)
  )
  loop
    select id into v_industry_id from public.industries where slug = cat.industry_slug;

    insert into public.categories (name, slug)
    values (
      cat.category_name,
      lower(regexp_replace(regexp_replace(cat.category_name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
    )
    on conflict (name) do update set name = excluded.name
    returning id into v_category_id;

    insert into public.category_industries (category_id, industry_id)
    values (v_category_id, v_industry_id)
    on conflict do nothing;
  end loop;
end $$;

-- ── Listings: add FK columns ──────────────────────────────────
alter table public.listings
  add column if not exists industry_id uuid references public.industries(id),
  add column if not exists category_id uuid references public.categories(id);

create index if not exists listings_industry_id_idx on public.listings (industry_id);
create index if not exists listings_category_id_idx on public.listings (category_id);

-- ── Backfill from legacy `category` text — all legacy values are
--    oilfield-specific, so every match lands in Oil & Gas. Anything
--    without a reasonable equivalent (electrical, safety, flowline,
--    other) is left null rather than force a bad match.
update public.listings l
set category_id = c.id,
    industry_id = (select id from public.industries where slug = 'oil_gas')
from public.categories c
where l.category_id is null
  and c.name = case l.category
    when 'drilling_rig'        then 'Drilling Rigs'
    when 'rig'                 then 'Drilling Rigs'
    when 'drill_pipe'          then 'Drill Pipe & Tubulars'
    when 'drill_collar'        then 'Drill Pipe & Tubulars'
    when 'tubular_goods'       then 'Drill Pipe & Tubulars'
    when 'blowout_preventer'   then 'Wellhead Equipment'
    when 'wellhead'            then 'Wellhead Equipment'
    when 'completion_equipment' then 'Wellhead Equipment'
    when 'pumping_unit'        then 'Pumps & Pump Jacks'
    when 'mud_pump'            then 'Pumps & Pump Jacks'
    when 'artificial_lift'     then 'Pumps & Pump Jacks'
    when 'coiled_tubing'       then 'Coiled Tubing Equipment'
    when 'compressor'          then 'Compressors'
    when 'separator'           then 'Separators & Tanks'
    when 'tank'                then 'Separators & Tanks'
    when 'production_equipment' then 'Separators & Tanks'
    when 'wireline'            then 'Fishing & Rental Tools'
    when 'rental_tools'        then 'Fishing & Rental Tools'
    else null
  end;

-- ── RLS — public reference data, read-only from the browser ──
alter table public.industries enable row level security;
alter table public.categories enable row level security;
alter table public.category_industries enable row level security;

drop policy if exists "Anyone can view industries" on public.industries;
create policy "Anyone can view industries" on public.industries for select using (true);

drop policy if exists "Anyone can view categories" on public.categories;
create policy "Anyone can view categories" on public.categories for select using (true);

drop policy if exists "Anyone can view category_industries" on public.category_industries;
create policy "Anyone can view category_industries" on public.category_industries for select using (true);
