-- ============================================================
-- search_queries — passive search behavior log
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- search_queries log — accumulates real search behavior for future
-- popularity-ranked suggestions, not yet used in ranking logic.
--
-- Written exclusively by /api/search-log using the service-role client,
-- so no anon/authenticated RLS policy is needed — RLS stays enabled per
-- project convention, but this table is intentionally not publicly
-- readable or writable.
-- ============================================================

create table if not exists public.search_queries (
  id                uuid primary key default uuid_generate_v4(),
  query_text        text not null,
  results_count     integer,
  clicked_result_id uuid,
  user_id           uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists search_queries_created_at_idx on public.search_queries (created_at desc);

alter table public.search_queries enable row level security;
