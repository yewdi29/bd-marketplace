-- Persist full listing verification agent response on activity log rows

ALTER TABLE public.agent_activity_log
  ADD COLUMN IF NOT EXISTS overall_score numeric(5, 2),
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS flag_comment text,
  ADD COLUMN IF NOT EXISTS reasoning text;
