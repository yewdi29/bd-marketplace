-- Phase 3 (step 2 of 2): constraints + ownership transfer table
--
-- Prerequisite: run add_org_member_status_expired_enum.sql first (separate execution).

-- Expired invites may never have linked a user account
ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_active_requires_user_check;

ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_active_requires_user_check CHECK (
    status IN ('invited', 'expired') OR user_id IS NOT NULL
  );

CREATE TABLE IF NOT EXISTS public.org_ownership_transfers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_member_id      uuid NOT NULL REFERENCES public.org_members(id) ON DELETE CASCADE,
  transfer_token    text NOT NULL UNIQUE,
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at        timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_ownership_transfers_org_idx
  ON public.org_ownership_transfers (organization_id, status);

CREATE INDEX IF NOT EXISTS org_ownership_transfers_token_idx
  ON public.org_ownership_transfers (transfer_token)
  WHERE status = 'pending';

ALTER TABLE public.org_ownership_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full ownership transfer access"
  ON public.org_ownership_transfers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Org members can view ownership transfers for their org"
  ON public.org_ownership_transfers FOR SELECT
  USING (public.user_belongs_to_org(organization_id));
