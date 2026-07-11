-- Transactional email audit log + listing removal reason for admin removals

CREATE TABLE IF NOT EXISTS public.email_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email     text NOT NULL,
  template_type       text NOT NULL,
  related_entity_type text,
  related_entity_id   uuid,
  status              text NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message       text,
  sent_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_log_template_type_idx
  ON public.email_log (template_type);

CREATE INDEX IF NOT EXISTS email_log_related_entity_idx
  ON public.email_log (related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS email_log_sent_at_idx
  ON public.email_log (sent_at DESC);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read email_log" ON public.email_log;
CREATE POLICY "Admins can read email_log"
  ON public.email_log FOR SELECT USING (public.is_admin());

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS removal_reason text;
