-- Inquiry notification system: extended lead statuses, review tracking, listing flags

-- Extend lead_status enum
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'forwarded';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'denied';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'commission_opportunity';

-- Review tracking on leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Admin moderation flags on listings
CREATE TABLE IF NOT EXISTS public.listing_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  admin_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment     text NOT NULL,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_flags_listing_idx ON public.listing_flags (listing_id);
CREATE INDEX IF NOT EXISTS listing_flags_unresolved_idx
  ON public.listing_flags (listing_id)
  WHERE resolved_at IS NULL;

ALTER TABLE public.listing_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full listing_flags access" ON public.listing_flags;
CREATE POLICY "Admins have full listing_flags access"
  ON public.listing_flags FOR ALL USING (public.is_admin());
