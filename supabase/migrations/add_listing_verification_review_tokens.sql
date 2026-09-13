-- Single-use, time-limited tokens for Listing Verifier admin review emails
-- (score < 55). Token is hashed at rest; raw secret lives only in the email URL.

alter table public.agent_recommendations
  add column if not exists review_token_hash text,
  add column if not exists review_token_expires_at timestamptz,
  add column if not exists review_consumed_at timestamptz;

create unique index if not exists agent_recommendations_review_token_hash_idx
  on public.agent_recommendations (review_token_hash)
  where review_token_hash is not null;

-- Agent auto-flag (55–74) has no human admin_id.
alter table public.listing_flags
  alter column admin_id drop not null;
