alter table public.listings add column if not exists specs jsonb;
create index if not exists listings_specs_gin on public.listings using gin(specs);
create index if not exists listings_tags_gin on public.listings using gin(tags);
