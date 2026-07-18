-- Enterprise Checkout migration: billing interval at close, terms acceptance audit fields

alter table public.organizations
  add column if not exists billing_interval text
    check (billing_interval is null or billing_interval in ('monthly', 'annual')),
  add column if not exists enterprise_terms_accepted_at timestamptz,
  add column if not exists enterprise_terms_version text;

comment on column public.organizations.billing_interval is
  'Billing interval selected at Close as Enterprise; used for initial Checkout Session.';
comment on column public.organizations.enterprise_terms_accepted_at is
  'When the primary Owner accepted the Enterprise Service Agreement before Checkout.';
comment on column public.organizations.enterprise_terms_version is
  'Version slug of the Enterprise Service Agreement accepted (e.g. 2026-07-placeholder-v1).';
