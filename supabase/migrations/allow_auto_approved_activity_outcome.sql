-- Allow Listing Verifier auto-approve outcomes in agent_activity_log.
-- Previous check (if present) only allowed pending_review / approved / flagged / etc.

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_outcome_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_outcome_check
  CHECK (
    outcome IS NULL
    OR outcome IN (
      'pending_review',
      'approved',
      'auto_approved',
      'flagged',
      'overridden',
      'scored',
      'alerted'
    )
  );
