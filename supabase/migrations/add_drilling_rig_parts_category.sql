-- ============================================================
-- Add Oil & Gas category: Drilling Rig Parts
-- For major/complete-rig-adjacent components that are NOT a full
-- drilling rig unit (drawworks, brake bands, masts, engines, etc.).
-- Safe to re-run.
-- ============================================================

do $$
declare
  v_industry_id uuid;
  v_category_id uuid;
begin
  select id into v_industry_id from public.industries where slug = 'oil_gas';
  if v_industry_id is null then
    raise exception 'Oil & Gas industry not found';
  end if;

  insert into public.categories (name, slug)
  values ('Drilling Rig Parts', 'drilling-rig-parts')
  on conflict (name) do update set slug = excluded.slug
  returning id into v_category_id;

  -- on conflict (name) DO UPDATE still returns id; if somehow null, look up
  if v_category_id is null then
    select id into v_category_id from public.categories where name = 'Drilling Rig Parts';
  end if;

  insert into public.category_industries (category_id, industry_id)
  values (v_category_id, v_industry_id)
  on conflict do nothing;

  -- Reclassify known part-style listings currently under Drilling Rigs
  update public.listings l
  set
    category_id = v_category_id,
    industry_id = v_industry_id,
    category = 'drilling_rig_parts',
    updated_at = now()
  where
    l.category_id = (select id from public.categories where name = 'Drilling Rigs')
    and (
      l.title ~* 'brake band'
      or l.title ~* 'drawworks'
      or l.title ~* 'top drive'
      or l.title ~* 'traveling block'
      or l.title ~* 'crown block'
      or l.title ~* 'rotary table'
      or l.title ~* '\mmast\M'
      or l.title ~* 'rig engine'
      or l.id = 'bbc2bf1b-3b05-43f2-a5da-8f854fe9ebb0' -- Skytop N57 Brake Bands
    );
end $$;

-- Helpful search shorthand for the new category
insert into public.search_keywords (term, category_id, industry_id)
select v.term, c.id, null
from (values
  ('drawworks',    'Drilling Rig Parts'),
  ('brake bands',  'Drilling Rig Parts'),
  ('rig parts',    'Drilling Rig Parts'),
  ('mast',         'Drilling Rig Parts'),
  ('top drive',    'Drilling Rig Parts')
) as v(term, category_name)
join public.categories c on c.name = v.category_name
where not exists (
  select 1 from public.search_keywords sk where sk.term = v.term
);
