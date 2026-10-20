-- Cities hang off states. Adding a country later is seed rows only.
-- location_city stays for "Other" free text and unmatched legacy values.

create table if not exists public.cities (
  id          uuid primary key default uuid_generate_v4(),
  state_id    uuid not null references public.states(id) on delete cascade,
  name        text not null,
  slug        text not null,
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (state_id, slug)
);

create index if not exists cities_state_id_idx on public.cities (state_id);

alter table public.listings
  add column if not exists city_id uuid references public.cities(id);

create index if not exists listings_city_id_idx on public.listings (city_id);

alter table public.cities enable row level security;

drop policy if exists "Anyone can view cities" on public.cities;
create policy "Anyone can view cities" on public.cities for select using (true);
