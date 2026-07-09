-- Paperclip agent system: recommendations, activity log, AI scoring fields

CREATE TABLE IF NOT EXISTS public.agent_recommendations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name         text NOT NULL,
  entity_type        text NOT NULL,
  entity_id          uuid NOT NULL,
  recommended_action text NOT NULL,
  confidence_score   numeric(5, 2),
  reasoning          text,
  flag_comment       text,
  status             text NOT NULL DEFAULT 'pending',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name  text NOT NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  outcome     text,
  summary     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS ai_verification_score numeric(5, 2),
  ADD COLUMN IF NOT EXISTS ai_verification_notes text,
  ADD COLUMN IF NOT EXISTS ai_recommended_action text;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS quality_score numeric(4, 2),
  ADD COLUMN IF NOT EXISTS quality_classification text,
  ADD COLUMN IF NOT EXISTS quality_reasoning text;

CREATE INDEX IF NOT EXISTS agent_recommendations_entity_idx
  ON public.agent_recommendations (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS agent_recommendations_status_idx
  ON public.agent_recommendations (status);

CREATE INDEX IF NOT EXISTS agent_activity_log_entity_idx
  ON public.agent_activity_log (entity_id);

CREATE INDEX IF NOT EXISTS agent_activity_log_created_idx
  ON public.agent_activity_log (created_at DESC);

ALTER TABLE public.agent_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full agent_recommendations access" ON public.agent_recommendations;
CREATE POLICY "Admins have full agent_recommendations access"
  ON public.agent_recommendations FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full agent_activity_log access" ON public.agent_activity_log;
CREATE POLICY "Admins have full agent_activity_log access"
  ON public.agent_activity_log FOR ALL USING (public.is_admin());
