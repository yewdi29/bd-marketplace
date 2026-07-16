-- Phase 3 (step 1 of 2): add 'expired' to org_member_status
--
-- Postgres requires new enum values to be committed before use in the same
-- session. Run this file FIRST, then run add_org_invite_expired_and_ownership_transfer.sql.
--
-- In Supabase SQL editor: run this block alone, wait for success, then run step 2.

ALTER TYPE public.org_member_status ADD VALUE IF NOT EXISTS 'expired';
