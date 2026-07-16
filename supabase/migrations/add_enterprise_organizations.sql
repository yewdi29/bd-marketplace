-- ============================================================
-- Enterprise / Teams — Phase 1
-- organizations, org_members, seat_change_log
-- listings + deals extensions, RLS, integrity constraints
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

create type public.org_member_role as enum ('owner', 'manager');
create type public.org_member_status as enum ('invited', 'active');
create type public.org_preferred_payment_method as enum ('card', 'ach');
create type public.seat_change_type as enum ('add', 'remove');
create type public.seat_change_status as enum ('pending', 'confirmed', 'failed');
create type public.deal_type as enum ('equipment', 'enterprise');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

create table public.organizations (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  logo_url                  text,
  description               text,
  stripe_customer_id        text,
  stripe_subscription_id    text,
  base_seat_count           integer not null default 5
    check (base_seat_count > 0),
  preferred_payment_method  public.org_preferred_payment_method,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index organizations_name_idx on public.organizations (name);

-- ============================================================
-- ORG MEMBERS
-- ============================================================

create table public.org_members (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid references public.users(id) on delete set null,
  role              public.org_member_role not null,
  team_tag          text,
  is_primary_owner  boolean not null default false,
  status            public.org_member_status not null default 'invited',
  invited_email     text,
  invite_token      text unique,
  invite_expires_at timestamptz,
  joined_at         timestamptz,
  created_at        timestamptz not null default now(),

  constraint org_members_role_team_tag_check check (
    (role = 'owner' and team_tag is null)
    or (role = 'manager' and team_tag is not null)
  ),
  constraint org_members_primary_owner_role_check check (
    is_primary_owner = false or role = 'owner'
  ),
  constraint org_members_active_requires_user_check check (
    status = 'invited' or user_id is not null
  ),
  constraint org_members_invited_requires_email_check check (
    status = 'active' or invited_email is not null
  )
);

-- Exactly one primary owner per organization
create unique index org_members_one_primary_owner_idx
  on public.org_members (organization_id)
  where is_primary_owner = true;

create index org_members_organization_idx on public.org_members (organization_id);
create index org_members_user_idx on public.org_members (user_id)
  where user_id is not null;
create index org_members_invited_email_idx on public.org_members (invited_email)
  where invited_email is not null;
create index org_members_org_role_tag_idx
  on public.org_members (organization_id, role, team_tag);

-- One active membership row per user per org
create unique index org_members_one_user_per_org_idx
  on public.org_members (organization_id, user_id)
  where user_id is not null;

-- ============================================================
-- SEAT CHANGE LOG (written in Phase 2; schema only for now)
-- ============================================================

create table public.seat_change_log (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  change_type         public.seat_change_type not null,
  seat_count_before   integer not null check (seat_count_before >= 0),
  seat_count_after    integer not null check (seat_count_after >= 0),
  prorated_amount     numeric(15, 2),
  stripe_invoice_id   text,
  payment_method_used public.org_preferred_payment_method,
  status              public.seat_change_status not null default 'pending',
  created_at          timestamptz not null default now()
);

create index seat_change_log_organization_idx
  on public.seat_change_log (organization_id, created_at desc);

-- ============================================================
-- LISTINGS — org attribution columns
-- ============================================================

alter table public.listings
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists posted_by_user_id uuid references public.users(id) on delete set null;

create index if not exists listings_organization_idx
  on public.listings (organization_id)
  where organization_id is not null;

create index if not exists listings_posted_by_user_idx
  on public.listings (posted_by_user_id)
  where posted_by_user_id is not null;

-- Org listings must record who posted them
alter table public.listings
  add constraint listings_org_requires_poster_check check (
    organization_id is null or posted_by_user_id is not null
  );

-- ============================================================
-- DEALS — enterprise deal type (existing equipment deals unchanged)
-- ============================================================

alter table public.deals
  add column if not exists deal_type public.deal_type not null default 'equipment',
  add column if not exists enterprise_metadata jsonb;

create index if not exists deals_deal_type_idx on public.deals (deal_type);

-- ============================================================
-- UPDATED_AT TRIGGER — organizations
-- ============================================================

create or replace function public.set_organizations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_organizations_updated_at();

-- ============================================================
-- RLS HELPER FUNCTIONS (security definer — avoids policy recursion)
-- ============================================================

create or replace function public.user_belongs_to_org(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.status in ('active', 'invited')
  );
$$;

create or replace function public.is_active_org_owner(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
      and om.status = 'active'
  );
$$;

create or replace function public.is_active_org_manager(
  p_org_id uuid,
  p_team_tag text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.role = 'manager'
      and om.status = 'active'
      and (p_team_tag is null or om.team_tag = p_team_tag)
  );
$$;

-- Manager listing access:
--   (a) same team_tag as poster (when poster is a manager), OR
--   (b) poster is an org owner (visible org-wide to all managers)
create or replace function public.manager_can_access_org_listing(
  p_organization_id uuid,
  p_posted_by_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members mgr
    where mgr.user_id = auth.uid()
      and mgr.organization_id = p_organization_id
      and mgr.role = 'manager'
      and mgr.status = 'active'
      and exists (
        select 1
        from public.org_members poster
        where poster.organization_id = p_organization_id
          and poster.user_id = p_posted_by_user_id
          and poster.status = 'active'
          and (
            poster.role = 'owner'
            or (
              poster.role = 'manager'
              and poster.team_tag is not distinct from mgr.team_tag
            )
          )
      )
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY — organizations
-- ============================================================

alter table public.organizations enable row level security;

create policy "Admins have full organization access"
  on public.organizations for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Org members can view their organization"
  on public.organizations for select
  using (public.user_belongs_to_org(id));

create policy "Org owners can update their organization"
  on public.organizations for update
  using (public.is_active_org_owner(id))
  with check (public.is_active_org_owner(id));

-- ============================================================
-- ROW LEVEL SECURITY — org_members
-- ============================================================

alter table public.org_members enable row level security;

create policy "Admins have full org member access"
  on public.org_members for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Org members can view org roster"
  on public.org_members for select
  using (public.user_belongs_to_org(organization_id));

create policy "Org owners manage all members"
  on public.org_members for all
  using (public.is_active_org_owner(organization_id))
  with check (public.is_active_org_owner(organization_id));

create policy "Managers invite managers in their team"
  on public.org_members for insert
  with check (
    role = 'manager'
    and team_tag is not null
    and public.is_active_org_manager(organization_id, team_tag)
  );

create policy "Managers remove managers in their team"
  on public.org_members for delete
  using (
    role = 'manager'
    and team_tag is not null
    and public.is_active_org_manager(organization_id, team_tag)
  );

-- ============================================================
-- ROW LEVEL SECURITY — seat_change_log
-- ============================================================

alter table public.seat_change_log enable row level security;

create policy "Admins have full seat change log access"
  on public.seat_change_log for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Org owners can view seat change log"
  on public.seat_change_log for select
  using (public.is_active_org_owner(organization_id));

-- ============================================================
-- ROW LEVEL SECURITY — listings (enterprise access model)
-- Solo sellers keep existing seller_id policies unchanged.
-- ============================================================

create policy "Org owners can view org listings"
  on public.listings for select
  using (
    organization_id is not null
    and public.is_active_org_owner(organization_id)
  );

create policy "Org owners can insert org listings"
  on public.listings for insert
  with check (
    organization_id is not null
    and posted_by_user_id = auth.uid()
    and public.is_active_org_owner(organization_id)
  );

create policy "Org owners can update org listings"
  on public.listings for update
  using (
    organization_id is not null
    and public.is_active_org_owner(organization_id)
  )
  with check (
    organization_id is not null
    and public.is_active_org_owner(organization_id)
  );

create policy "Org owners can delete org listings"
  on public.listings for delete
  using (
    organization_id is not null
    and public.is_active_org_owner(organization_id)
  );

create policy "Org managers can view accessible org listings"
  on public.listings for select
  using (
    organization_id is not null
    and posted_by_user_id is not null
    and public.manager_can_access_org_listing(organization_id, posted_by_user_id)
  );

create policy "Org managers can insert org listings"
  on public.listings for insert
  with check (
    organization_id is not null
    and posted_by_user_id = auth.uid()
    and public.is_active_org_manager(organization_id)
  );

create policy "Org managers can update accessible org listings"
  on public.listings for update
  using (
    organization_id is not null
    and posted_by_user_id is not null
    and public.manager_can_access_org_listing(organization_id, posted_by_user_id)
  )
  with check (
    organization_id is not null
    and posted_by_user_id is not null
    and public.manager_can_access_org_listing(organization_id, posted_by_user_id)
  );

create policy "Org managers can delete accessible org listings"
  on public.listings for delete
  using (
    organization_id is not null
    and posted_by_user_id is not null
    and public.manager_can_access_org_listing(organization_id, posted_by_user_id)
  );
