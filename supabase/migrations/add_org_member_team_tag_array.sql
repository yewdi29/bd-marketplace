-- Manager locations: single team_tag text → text[] (multi-location assignment).
-- Existing single values become single-element arrays — access parity preserved.
--
-- Policies and functions that reference team_tag must be dropped before the
-- column type change, then recreated afterward.

-- ── 1. Drop dependent policies ───────────────────────────────────────────────

drop policy if exists "Org managers can view accessible org listings" on public.listings;
drop policy if exists "Org managers can insert org listings" on public.listings;
drop policy if exists "Org managers can update accessible org listings" on public.listings;
drop policy if exists "Org managers can delete accessible org listings" on public.listings;

drop policy if exists "Managers invite managers in their team" on public.org_members;
drop policy if exists "Managers remove managers in their team" on public.org_members;

-- ── 2. Drop dependent functions and index ───────────────────────────────────

drop function if exists public.manager_can_access_org_listing(uuid, uuid);
drop function if exists public.is_active_org_manager(uuid, text);

drop index if exists public.org_members_org_role_tag_idx;

-- ── 3. Alter column type ────────────────────────────────────────────────────

alter table public.org_members
  drop constraint if exists org_members_role_team_tag_check;

alter table public.org_members
  alter column team_tag type text[] using (
    case
      when team_tag is null then null::text[]
      else array[team_tag::text]
    end
  );

alter table public.org_members
  add constraint org_members_role_team_tag_check check (
    (role = 'owner' and team_tag is null)
    or (role = 'manager' and team_tag is not null and cardinality(team_tag) > 0)
  );

-- GIN index supports array overlap (&&) used in RLS
create index org_members_team_tag_gin_idx
  on public.org_members using gin (team_tag)
  where team_tag is not null;

-- ── 4. Recreate helper functions ────────────────────────────────────────────

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
      and (
        p_team_tag is null
        or p_team_tag = any(om.team_tag)
      )
  );
$$;

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
              and poster.team_tag && mgr.team_tag
            )
          )
      )
  );
$$;

-- ── 5. Recreate org_members policies ────────────────────────────────────────

create policy "Managers invite managers in their team"
  on public.org_members for insert
  with check (
    role = 'manager'
    and team_tag is not null
    and cardinality(team_tag) > 0
    and team_tag <@ (
      select mgr.team_tag
      from public.org_members mgr
      where mgr.user_id = auth.uid()
        and mgr.organization_id = org_members.organization_id
        and mgr.role = 'manager'
        and mgr.status = 'active'
      limit 1
    )
  );

create policy "Managers remove managers in their team"
  on public.org_members for delete
  using (
    role = 'manager'
    and team_tag is not null
    and exists (
      select 1
      from public.org_members mgr
      where mgr.user_id = auth.uid()
        and mgr.organization_id = org_members.organization_id
        and mgr.role = 'manager'
        and mgr.status = 'active'
        and org_members.team_tag && mgr.team_tag
    )
  );

-- ── 6. Recreate listings manager policies ───────────────────────────────────

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
