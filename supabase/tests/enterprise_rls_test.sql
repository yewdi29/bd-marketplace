-- ============================================================
-- Enterprise RLS verification script
-- Run AFTER:
--   1. add_org_member_team_tag_array.sql
--   2. add_org_manager_permissions.sql
--   3. add_enterprise_rls_test_runner.sql  (installs run_enterprise_rls_test())
--
-- HOW TO RUN (Supabase SQL Editor):
--   Paste this entire file and execute. The outer transaction rolls back
--   all seeded test rows — nothing persists.
--
-- NOTE: Do NOT paste the old inline DO $$ block. The test runner is a
-- SECURITY DEFINER function owned by postgres so it can seed auth.users
-- even when the editor session uses the authenticated role.
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.run_enterprise_rls_test()') is null then
    raise exception
      'Missing public.run_enterprise_rls_test(). Run supabase/migrations/add_enterprise_rls_test_runner.sql in the SQL editor first.';
  end if;
  if to_regprocedure('public._seed_enterprise_rls_test_data()') is null then
    raise exception
      'Missing public._seed_enterprise_rls_test_data(). Re-run add_enterprise_rls_test_runner.sql (split seed/assert version).';
  end if;
end $$;

select public.run_enterprise_rls_test();

rollback;
