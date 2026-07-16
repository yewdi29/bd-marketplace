-- Optional Owner-granted permission toggles for manager rows (default false).

alter table public.org_members
  add column if not exists can_see_all_locations boolean not null default false,
  add column if not exists can_access_billing boolean not null default false,
  add column if not exists can_edit_company_info boolean not null default false,
  add column if not exists can_manage_managers_org_wide boolean not null default false;

-- Managers need locations unless they can see all locations org-wide.
alter table public.org_members
  drop constraint if exists org_members_role_team_tag_check;

alter table public.org_members
  add constraint org_members_role_team_tag_check check (
    (role = 'owner' and team_tag is null)
    or (
      role = 'manager'
      and (
        can_see_all_locations = true
        or (team_tag is not null and cardinality(team_tag) > 0)
      )
    )
  );

-- ── Listing visibility: can_see_all_locations bypass ───────────────────────

drop policy if exists "Org managers can view accessible org listings" on public.listings;
drop policy if exists "Org managers can update accessible org listings" on public.listings;
drop policy if exists "Org managers can delete accessible org listings" on public.listings;

drop function if exists public.manager_can_access_org_listing(uuid, uuid);

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
      and (
        mgr.can_see_all_locations = true
        or exists (
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
      )
  );
$$;

create policy "Org managers can view accessible org listings"
  on public.listings for select
  using (
    organization_id is not null
    and posted_by_user_id is not null
    and public.manager_can_access_org_listing(organization_id, posted_by_user_id)
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

-- ── Company profile edit for permitted managers ─────────────────────────────

create or replace function public.manager_can_edit_company_info(p_org_id uuid)
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
      and om.can_edit_company_info = true
  );
$$;

drop policy if exists "Org managers with profile edit can update organization" on public.organizations;
create policy "Org managers with profile edit can update organization"
  on public.organizations for update
  using (public.manager_can_edit_company_info(id))
  with check (public.manager_can_edit_company_info(id));

-- ── Manager invite/remove: org-wide scope expansion ─────────────────────────

drop policy if exists "Managers invite managers in their team" on public.org_members;
create policy "Managers invite managers in their team"
  on public.org_members for insert
  with check (
    role = 'manager'
    and exists (
      select 1
      from public.org_members mgr
      where mgr.user_id = auth.uid()
        and mgr.organization_id = org_members.organization_id
        and mgr.role = 'manager'
        and mgr.status = 'active'
        and (
          mgr.can_manage_managers_org_wide = true
          or (
            org_members.can_see_all_locations = true
            or (
              org_members.team_tag is not null
              and cardinality(org_members.team_tag) > 0
              and org_members.team_tag <@ mgr.team_tag
            )
          )
        )
    )
  );

drop policy if exists "Managers remove managers in their team" on public.org_members;
create policy "Managers remove managers in their team"
  on public.org_members for delete
  using (
    role = 'manager'
    and exists (
      select 1
      from public.org_members mgr
      where mgr.user_id = auth.uid()
        and mgr.organization_id = org_members.organization_id
        and mgr.role = 'manager'
        and mgr.status = 'active'
        and (
          mgr.can_manage_managers_org_wide = true
          or (
            org_members.team_tag is not null
            and org_members.team_tag && mgr.team_tag
          )
        )
    )
  );
