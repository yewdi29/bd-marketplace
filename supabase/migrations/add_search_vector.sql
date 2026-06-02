-- Migration: full-text search vector for listings
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run)
--
-- Uses a trigger instead of GENERATED ALWAYS AS because to_tsvector('english', …)
-- is STABLE, not IMMUTABLE — PostgreSQL rejects non-immutable generation expressions.

-- 1. Add the column (plain, not generated)
alter table public.listings
  add column if not exists search_vector tsvector;

-- 2. Trigger function — rebuilds the vector on every insert / update
create or replace function listings_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    to_tsvector('english',
      coalesce(new.title,        '') || ' ' ||
      coalesce(new.description,  '') || ' ' ||
      coalesce(new.category,     '') || ' ' ||
      coalesce(new.manufacturer, '') || ' ' ||
      coalesce(new.model,        '') || ' ' ||
      coalesce(array_to_string(new.tags, ' '), '')
    );
  return new;
end;
$$;

-- 3. Attach trigger (drop first so re-running is safe)
drop trigger if exists listings_search_vector_trigger on public.listings;

create trigger listings_search_vector_trigger
  before insert or update on public.listings
  for each row execute function listings_search_vector_update();

-- 4. GIN index for fast @@ queries
create index if not exists listings_search_vector_idx
  on public.listings using gin(search_vector);

-- 5. Backfill all existing rows so searches work immediately
update public.listings
set search_vector =
  to_tsvector('english',
    coalesce(title,        '') || ' ' ||
    coalesce(description,  '') || ' ' ||
    coalesce(category,     '') || ' ' ||
    coalesce(manufacturer, '') || ' ' ||
    coalesce(model,        '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  );
