-- ============================================================
-- Forestry industry + categories
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → Run).
-- ============================================================

insert into public.industries (name, slug, sort_order)
values ('Forestry', 'forestry', 6)
on conflict (slug) do nothing;

do $$
declare
  v_industry_id uuid;
  v_category_id uuid;
  cat record;
begin
  select id into v_industry_id from public.industries where slug = 'forestry';
  if v_industry_id is null then
    raise exception 'Forestry industry not found — run industries insert first';
  end if;

  for cat in (
    select * from (values
      ('Harvesters'),
      ('Forwarders'),
      ('Feller Bunchers'),
      ('Skidders'),
      ('Log Loaders'),
      ('Chippers & Grinders'),
      ('Sawmill Equipment'),
      ('Mulchers'),
      ('Knuckleboom Loaders'),
      ('Forestry Trailers')
    ) as t(category_name)
  )
  loop
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
