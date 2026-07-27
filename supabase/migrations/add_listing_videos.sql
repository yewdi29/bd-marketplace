-- Phase 1: listing_videos table, constraints, and RLS for Mux-hosted listing videos.

-- ============================================================
-- ENUM
-- ============================================================

create type public.listing_video_status as enum (
  'uploading',
  'processing',
  'ready',
  'rejected_too_long',
  'error'
);

-- ============================================================
-- TABLE
-- ============================================================

create table public.listing_videos (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.listings(id) on delete cascade,
  mux_asset_id      text,
  mux_playback_id   text,
  status            public.listing_video_status not null default 'uploading',
  duration_seconds  numeric,
  position          integer not null check (position >= 1 and position <= 3),
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index listing_videos_listing_idx
  on public.listing_videos (listing_id);

create index listing_videos_mux_asset_idx
  on public.listing_videos (mux_asset_id)
  where mux_asset_id is not null;

create index listing_videos_status_idx
  on public.listing_videos (listing_id, status);

-- Unique display order per listing among videos that count toward the cap.
create unique index listing_videos_listing_position_active_idx
  on public.listing_videos (listing_id, position)
  where status not in ('rejected_too_long', 'error');

-- ============================================================
-- UPDATED_AT
-- ============================================================

create or replace function public.set_listing_videos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listing_videos_updated_at
  before update on public.listing_videos
  for each row execute function public.set_listing_videos_updated_at();

-- ============================================================
-- 3-VIDEO CAP (counts uploading / processing / ready only)
-- ============================================================

create or replace function public.enforce_listing_video_limit()
returns trigger as $$
declare
  active_count int;
begin
  if new.status in ('rejected_too_long', 'error') then
    return new;
  end if;

  select count(*) into active_count
  from public.listing_videos
  where listing_id = new.listing_id
    and status not in ('rejected_too_long', 'error')
    and id is distinct from new.id;

  if active_count >= 3 then
    raise exception 'A listing cannot have more than 3 active videos.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger enforce_listing_video_limit
  before insert or update of status, listing_id on public.listing_videos
  for each row execute function public.enforce_listing_video_limit();

-- ============================================================
-- RLS HELPER — reuses org owner + manager_can_access_org_listing
-- ============================================================

create or replace function public.user_can_manage_listing_media(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings l
    where l.id = p_listing_id
      and (
        l.seller_id = auth.uid()
        or (
          l.organization_id is not null
          and public.is_active_org_owner(l.organization_id)
        )
        or (
          l.organization_id is not null
          and l.posted_by_user_id is not null
          and public.manager_can_access_org_listing(l.organization_id, l.posted_by_user_id)
        )
      )
  );
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.listing_videos enable row level security;

create policy "Anyone can view ready videos of active listings"
  on public.listing_videos for select
  using (
    status = 'ready'
    and exists (
      select 1 from public.listings
      where id = listing_id and status = 'active'
    )
  );

create policy "Anyone can view ready videos of sold listings"
  on public.listing_videos for select
  using (
    status = 'ready'
    and exists (
      select 1 from public.listings
      where id = listing_id and status = 'sold'
    )
  );

create policy "Listing owners can manage listing videos"
  on public.listing_videos for all
  using (public.user_can_manage_listing_media(listing_id))
  with check (public.user_can_manage_listing_media(listing_id));

create policy "Admins have full listing video access"
  on public.listing_videos for all
  using (public.is_admin())
  with check (public.is_admin());
