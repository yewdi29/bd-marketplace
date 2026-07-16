-- Enterprise billing failure tracking (Phase 2)
-- Surfaces payment issues for Phase 5 command center without silent failures.

alter table public.organizations
  add column if not exists last_billing_failure_at timestamptz,
  add column if not exists last_billing_failure_message text;
