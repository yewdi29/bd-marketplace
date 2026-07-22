-- Inquiry verification: tier trust label + AI content-risk scan (one row per lead/inquiry)

create type public.inquiry_trust_label as enum ('verified_member', 'unverified_free');

create table public.inquiry_verifications (
  id                      uuid primary key default uuid_generate_v4(),
  inquiry_id              uuid not null unique references public.leads(id) on delete cascade,
  buyer_tier_at_submission text not null,
  trust_label             public.inquiry_trust_label not null,
  content_risk_score      integer not null check (content_risk_score >= 0 and content_risk_score <= 100),
  content_risk_flags      jsonb not null default '[]'::jsonb,
  agent_reasoning         text not null,
  created_at              timestamptz not null default now()
);

create index inquiry_verifications_inquiry_id_idx on public.inquiry_verifications (inquiry_id);

comment on table public.inquiry_verifications is
  'Snapshot of buyer trust tier and AI content-risk evaluation at inquiry submission time.';

alter table public.inquiry_verifications enable row level security;

-- Admin-only via service role / rigburrito; no public policies

comment on column public.leads.buyer_id is
  'Authenticated buyer user id — required for new listing inquiries (enforced in API).';
