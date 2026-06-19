-- ============================================================
-- Starter search_keywords data
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- Brand names and common shorthand buyers search for, mapped to the
-- most relevant existing category (preferred) or industry (when the
-- brand spans many categories). Safe to re-run — skips terms that
-- already exist.
-- ============================================================

insert into public.search_keywords (term, category_id, industry_id)
select v.term, c.id, i.id
from (values
  -- ── Brands — span many categories, mapped at the industry level ──────────
  ('Caterpillar',   null,                         'construction'),
  ('Komatsu',       null,                         'construction'),
  ('Volvo',         null,                         'construction'),
  ('Halliburton',   null,                         'oil_gas'),
  ('Schlumberger',  null,                         'oil_gas'),
  ('Baker Hughes',  null,                         'oil_gas'),
  ('Weatherford',   null,                         'oil_gas'),
  ('Cummins',       null,                         'trucks_trailers'),
  ('Case IH',       null,                         'agriculture'),
  ('New Holland',   null,                         'agriculture'),

  -- ── Brands — tied to one product line, mapped at the category level ─────
  ('John Deere',    'Tractors',                   null),
  ('Kenworth',       'Trucks',                      null),
  ('Peterbilt',      'Trucks',                      null),
  ('Freightliner',   'Trucks',                      null),
  ('Liebherr',       'Cranes',                      null),
  ('Terex',          'Cranes',                      null),
  ('Manitowoc',      'Cranes',                      null),
  ('Bobcat',         'Skid Steer Loaders',          null),
  ('JCB',            'Backhoe Loaders',             null),
  ('Hitachi',        'Excavators',                  null),
  ('Sandvik',        'Crushers',                    null),
  ('Metso',          'Crushers',                    null),
  ('NOV',            'Drilling Rigs',               null),
  ('Cameron',        'Wellhead Equipment',          null),

  -- ── Nicknames / shorthand ─────────────────────────────────────────────────
  ('dozer',          'Crawler Dozers',              null),
  ('rig',            'Drilling Rigs',               null),
  ('excavator',      'Excavators',                  null),
  ('BOP',            'Wellhead Equipment',          null),
  ('frac tank',      'Separators & Tanks',          null),
  ('man lift',       'Aerial Lifts & Telehandlers', null)
) as v(term, category_name, industry_slug)
left join public.categories c on c.name = v.category_name
left join public.industries i on i.slug = v.industry_slug
where not exists (
  select 1 from public.search_keywords sk where sk.term = v.term
);
