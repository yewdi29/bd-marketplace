-- Lead discard status + deal fields for lead conversion and manual close-out

ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'discarded';

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buyer_message text;

-- Allow manual commission_earned entry at close (was generated from price × rate)
ALTER TABLE public.deals DROP COLUMN IF EXISTS commission_earned;
ALTER TABLE public.deals ADD COLUMN commission_earned numeric;

CREATE INDEX IF NOT EXISTS deals_lead_idx ON public.deals (lead_id);
