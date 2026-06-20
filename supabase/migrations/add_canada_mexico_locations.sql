-- ============================================================
-- Add Canada (provinces) and Mexico to location taxonomy
-- Run in Supabase SQL Editor after add_location_taxonomy.sql
-- ============================================================

insert into public.countries (name, slug, iso_code) values
  ('Canada', 'canada', 'CA'),
  ('Mexico', 'mexico', 'MX')
on conflict (slug) do update set
  name = excluded.name,
  iso_code = excluded.iso_code;

-- ── Canada: single pass-through region, provinces as states ───
do $$
declare
  v_country_id uuid;
  v_region_id  uuid;
begin
  select id into v_country_id from public.countries where slug = 'canada';

  insert into public.regions (country_id, name, slug) values
    (v_country_id, 'Canada', 'canada')
  on conflict (country_id, slug) do update set name = excluded.name
  returning id into v_region_id;

  insert into public.states (region_id, name, code, latitude, longitude) values
    (v_region_id, 'Alberta',                   'AB', 53.933333, -116.576504),
    (v_region_id, 'British Columbia',          'BC', 53.726669, -127.647621),
    (v_region_id, 'Manitoba',                  'MB', 53.760861,  -98.813873),
    (v_region_id, 'New Brunswick',             'NB', 46.565316,  -66.461914),
    (v_region_id, 'Newfoundland and Labrador', 'NL', 53.135509,  -57.660435),
    (v_region_id, 'Nova Scotia',               'NS', 44.682007,  -63.744311),
    (v_region_id, 'Ontario',                   'ON', 51.253775,  -85.323212),
    (v_region_id, 'Prince Edward Island',      'PE', 46.510712,  -63.416814),
    (v_region_id, 'Quebec',                    'QC', 52.939915,  -73.549080),
    (v_region_id, 'Saskatchewan',              'SK', 52.939915, -106.450864),
    (v_region_id, 'Northwest Territories',     'NT', 64.825546, -124.845734),
    (v_region_id, 'Nunavut',                   'NU', 70.299771,  -83.107577),
    (v_region_id, 'Yukon',                     'YT', 64.282327, -135.000000)
  on conflict (region_id, name) do nothing;
end $$;
