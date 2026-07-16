-- Phase 4: Enterprise deal intake + Close as Enterprise
-- Relax deal_tier for enterprise deals; link closed enterprise deals to organizations.

alter table public.deals
  alter column deal_tier drop not null;

alter table public.deals
  drop constraint if exists deals_deal_tier_check;

alter table public.deals
  add constraint deals_deal_tier_check check (
    (deal_type = 'enterprise' and deal_tier is null)
    or (deal_type = 'equipment' and deal_tier in ('yellow', 'red'))
  );

alter table public.deals
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create index if not exists deals_organization_idx on public.deals (organization_id)
  where organization_id is not null;
