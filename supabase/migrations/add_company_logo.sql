-- ============================================================
-- Add company_logo_url and company_slug to users table
-- ============================================================

alter table public.users
  add column if not exists company_logo_url text,
  add column if not exists company_slug text unique;

-- Index for fast slug lookups on seller profile pages
create index if not exists users_company_slug_idx on public.users (company_slug);

-- ============================================================
-- Storage RLS: company-logos bucket
-- NOTE: Create the 'company-logos' bucket in the Supabase
-- Storage dashboard — set it to PUBLIC so that getPublicUrl() works.
-- The RLS policies below still protect writes (only owners can upload/delete).
-- Then apply these policies.
-- ============================================================

-- Public read access (logos are public-facing brand assets)
create policy "Public can read company logos"
  on storage.objects for select
  using (bucket_id = 'company-logos');

-- Authenticated sellers can insert their own logo
create policy "Users can upload their own company logo"
  on storage.objects for insert
  with check (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated sellers can replace their own logo
create policy "Users can update their own company logo"
  on storage.objects for update
  using (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated sellers can delete their own logo
create policy "Users can delete their own company logo"
  on storage.objects for delete
  using (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
