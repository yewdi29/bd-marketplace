-- ============================================================
-- search_keywords — manually-curated brand names, nicknames, and
-- common search terms that aren't formal category/industry names
-- but buyers search for anyway (e.g. "Caterpillar", "dozer").
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- Empty by default — populated later via manual inserts as needed.
-- Each row maps a term to the category and/or industry it should
-- surface in the navbar search dropdown.
-- ============================================================

create table if not exists public.search_keywords (
  id          uuid primary key default uuid_generate_v4(),
  term        text not null,
  category_id uuid references public.categories(id) on delete cascade,
  industry_id uuid references public.industries(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists search_keywords_term_idx on public.search_keywords (term);

-- ── RLS — public reference data, read-only from the browser ──
alter table public.search_keywords enable row level security;

drop policy if exists "Anyone can view search_keywords" on public.search_keywords;
create policy "Anyone can view search_keywords" on public.search_keywords for select using (true);
