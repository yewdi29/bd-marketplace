-- Enterprise RLS test runner (split seed + assert so role switching works).
--
-- _seed_enterprise_rls_test_data: SECURITY DEFINER (postgres) — seeds auth.users
-- run_enterprise_rls_test:           SECURITY INVOKER — sets role + runs RLS checks
--
-- Invoke: begin; select public.run_enterprise_rls_test(); rollback;

create or replace function public._seed_enterprise_rls_test_data()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_org_id          uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_owner_id        uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_mgr_houston_id  uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_mgr_utah_id     uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  v_mgr_multi_id    uuid := '22222222-2222-2222-2222-222222222222';
  v_mgr_super_id    uuid := '33333333-3333-3333-3333-333333333333';
  v_list_owner_id   uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  v_list_houston_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  v_list_utah_id    uuid := '11111111-1111-1111-1111-111111111111';
begin
  insert into public.organizations (id, name)
  values (v_org_id, 'RLS Test Org')
  on conflict (id) do nothing;

  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  )
  select
    '00000000-0000-0000-0000-000000000000',
    u.id,
    'authenticated',
    'authenticated',
    u.email,
    '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyha',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb
  from (values
    (v_owner_id, 'owner-rls-test@example.com'),
    (v_mgr_houston_id, 'mgr-houston-rls-test@example.com'),
    (v_mgr_utah_id, 'mgr-utah-rls-test@example.com'),
    (v_mgr_multi_id, 'mgr-multi-rls-test@example.com'),
    (v_mgr_super_id, 'mgr-super-rls-test@example.com')
  ) as u(id, email)
  where not exists (select 1 from auth.users au where au.id = u.id);

  insert into public.users (id, email)
  select u.id, u.email
  from (values
    (v_owner_id, 'owner-rls-test@example.com'),
    (v_mgr_houston_id, 'mgr-houston-rls-test@example.com'),
    (v_mgr_utah_id, 'mgr-utah-rls-test@example.com'),
    (v_mgr_multi_id, 'mgr-multi-rls-test@example.com'),
    (v_mgr_super_id, 'mgr-super-rls-test@example.com')
  ) as u(id, email)
  on conflict (id) do nothing;

  insert into public.org_members (
    organization_id, user_id, role, team_tag, is_primary_owner, status, invited_email, joined_at
  )
  values
    (v_org_id, v_owner_id, 'owner', null, true, 'active', 'owner-rls-test@example.com', now()),
    (v_org_id, v_mgr_houston_id, 'manager', array['Houston'], false, 'active', 'mgr-houston-rls-test@example.com', now()),
    (v_org_id, v_mgr_utah_id, 'manager', array['Utah'], false, 'active', 'mgr-utah-rls-test@example.com', now()),
    (v_org_id, v_mgr_multi_id, 'manager', array['Odessa', 'Houston'], false, 'active', 'mgr-multi-rls-test@example.com', now())
  on conflict do nothing;

  insert into public.org_members (
    organization_id, user_id, role, team_tag, is_primary_owner, status,
    invited_email, joined_at,
    can_see_all_locations, can_access_billing, can_edit_company_info, can_manage_managers_org_wide
  )
  values (
    v_org_id, v_mgr_super_id, 'manager', null, false, 'active',
    'mgr-super-rls-test@example.com', now(),
    true, true, true, true
  )
  on conflict do nothing;

  insert into public.listings (
    id, seller_id, organization_id, posted_by_user_id,
    title, category, price, status
  )
  values
    (v_list_owner_id, v_owner_id, v_org_id, v_owner_id,
     'Owner Listing', 'rig', 150000, 'draft'),
    (v_list_houston_id, v_mgr_houston_id, v_org_id, v_mgr_houston_id,
     'Houston Listing', 'rig', 150000, 'draft'),
    (v_list_utah_id, v_mgr_utah_id, v_org_id, v_mgr_utah_id,
     'Utah Listing', 'rig', 150000, 'draft')
  on conflict (id) do nothing;
end;
$$;

create or replace function public.run_enterprise_rls_test()
returns text
language plpgsql
set search_path = public, auth, extensions
as $$
declare
  v_org_id          uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_owner_id        uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_mgr_houston_id  uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_mgr_utah_id     uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  v_mgr_multi_id    uuid := '22222222-2222-2222-2222-222222222222';
  v_mgr_super_id    uuid := '33333333-3333-3333-3333-333333333333';
  v_list_houston_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  v_list_utah_id    uuid := '11111111-1111-1111-1111-111111111111';
  v_visible_count   int;
  v_can_see_utah    boolean;
  v_can_see_houston boolean;
begin
  perform public._seed_enterprise_rls_test_data();

  -- Must run outside SECURITY DEFINER — Postgres blocks set_config('role', ...) there.
  perform set_config('role', 'authenticated', true);

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_mgr_houston_id::text)::text,
    true
  );

  select count(*) into v_visible_count
  from public.listings
  where organization_id = v_org_id;

  if v_visible_count <> 2 then
    raise exception 'Houston manager should see 2 listings (own + owner), saw %', v_visible_count;
  end if;

  select exists (
    select 1 from public.listings where id = v_list_utah_id
  ) into v_can_see_utah;

  if v_can_see_utah then
    raise exception 'Houston manager must NOT see Utah manager listing';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_mgr_utah_id::text)::text,
    true
  );

  select count(*) into v_visible_count
  from public.listings
  where organization_id = v_org_id;

  if v_visible_count <> 2 then
    raise exception 'Utah manager should see 2 listings (own + owner), saw %', v_visible_count;
  end if;

  select exists (
    select 1 from public.listings where id = v_list_houston_id
  ) into v_can_see_houston;

  if v_can_see_houston then
    raise exception 'Utah manager must NOT see Houston manager listing';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_mgr_multi_id::text)::text,
    true
  );

  select count(*) into v_visible_count
  from public.listings
  where organization_id = v_org_id;

  if v_visible_count <> 2 then
    raise exception 'Multi-location manager should see 2 listings (Houston + owner), saw %', v_visible_count;
  end if;

  select exists (
    select 1 from public.listings where id = v_list_houston_id
  ) into v_can_see_houston;

  if not v_can_see_houston then
    raise exception 'Multi-location manager must see Houston manager listing';
  end if;

  select exists (
    select 1 from public.listings where id = v_list_utah_id
  ) into v_can_see_utah;

  if v_can_see_utah then
    raise exception 'Multi-location manager must NOT see Utah manager listing';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_owner_id::text)::text,
    true
  );

  select count(*) into v_visible_count
  from public.listings
  where organization_id = v_org_id;

  if v_visible_count <> 3 then
    raise exception 'Owner should see all 3 org listings, saw %', v_visible_count;
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_mgr_super_id::text)::text,
    true
  );

  select count(*) into v_visible_count
  from public.listings
  where organization_id = v_org_id;

  if v_visible_count <> 3 then
    raise exception 'Super manager (all toggles) should see all 3 listings, saw %', v_visible_count;
  end if;

  update public.organizations
  set name = 'RLS Test Org Updated'
  where id = v_org_id;

  if not found then
    raise exception 'Super manager with can_edit_company_info should update organization';
  end if;

  update public.organizations
  set name = 'RLS Test Org'
  where id = v_org_id;

  return 'PASS: enterprise RLS verified (location isolation + super manager toggles)';
end;
$$;

revoke all on function public._seed_enterprise_rls_test_data() from public;
revoke all on function public.run_enterprise_rls_test() from public;
grant execute on function public._seed_enterprise_rls_test_data() to authenticated, service_role;
grant execute on function public.run_enterprise_rls_test() to authenticated, service_role;
