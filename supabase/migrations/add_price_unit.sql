alter table public.listings
add column if not exists price_unit text not null default 'total';
