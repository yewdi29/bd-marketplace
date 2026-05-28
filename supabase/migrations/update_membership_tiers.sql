-- ============================================================
-- Add new membership tier values to the membership_plan enum
-- ============================================================
-- Postgres enums are append-only; existing rows keep their value.
-- 'free' and 'premium' remain valid until migrated.

alter type membership_plan add value if not exists 'starter';
alter type membership_plan add value if not exists 'pro';
alter type membership_plan add value if not exists 'max';
