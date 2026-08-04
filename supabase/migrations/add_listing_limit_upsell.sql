-- Track first time a user hits their active-listing tier cap, and whether
-- the ~24h upsell email has been sent for that limit-hit.

alter table public.users
  add column if not exists listing_limit_reached_at timestamptz,
  add column if not exists listing_limit_upsell_sent_at timestamptz;

comment on column public.users.listing_limit_reached_at is
  'Set once the first time the user hits their membership active-listing limit; not updated on later blocked attempts.';

comment on column public.users.listing_limit_upsell_sent_at is
  'Set when the listing-limit upsell email is sent for the current limit-hit window.';
