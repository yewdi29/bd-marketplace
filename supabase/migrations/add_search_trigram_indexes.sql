-- ============================================================
-- Trigram indexes for fast substring search
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- ILIKE '%term%' (substring, not prefix) can't use a standard B-tree
-- index. pg_trgm + a GIN index lets Postgres use an index for these
-- queries instead of a full table scan — needed for the navbar search
-- suggestion dropdown to stay fast as these tables grow.
-- ============================================================

create extension if not exists pg_trgm;

create index if not exists categories_name_trgm_idx
  on public.categories using gin (name gin_trgm_ops);

create index if not exists industries_name_trgm_idx
  on public.industries using gin (name gin_trgm_ops);

create index if not exists search_keywords_term_trgm_idx
  on public.search_keywords using gin (term gin_trgm_ops);
