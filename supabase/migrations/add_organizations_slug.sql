-- Public business-directory identity for enterprise organizations.
-- Directory cards and /sellers/[slug] resolve org profiles via this slug.

alter table public.organizations
  add column if not exists slug text;

-- Backfill from name for existing orgs (collision-safe with a short id suffix when needed).
with prepared as (
  select
    id,
    nullif(
      trim(both '-' from regexp_replace(
        regexp_replace(lower(coalesce(name, '')), '[^a-z0-9\s-]', '', 'g'),
        '\s+',
        '-',
        'g'
      )),
      ''
    ) as base_slug
  from public.organizations
  where slug is null
),
ranked as (
  select
    id,
    case
      when base_slug is null then 'org-' || substr(replace(id::text, '-', ''), 1, 8)
      else base_slug || '-' || substr(replace(id::text, '-', ''), 1, 6)
    end as slug
  from prepared
)
update public.organizations o
set slug = ranked.slug
from ranked
where o.id = ranked.id
  and o.slug is null;

alter table public.organizations
  alter column slug set not null;

create unique index if not exists organizations_slug_unique_idx
  on public.organizations (slug);
