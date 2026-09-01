-- ============================================================
-- Black Diamond Marketplace — Supabase Schema
-- Run this in your Supabase SQL editor to initialize the DB
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('buyer', 'seller', 'admin');
create type membership_plan as enum ('free', 'premium');
create type listing_status as enum ('draft', 'pending_review', 'active', 'sold', 'removed');
create type listing_tier as enum ('green', 'yellow', 'red');
create type lead_status as enum ('new', 'contacted', 'qualified', 'closed', 'lost');
create type transaction_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type article_status as enum ('draft', 'published', 'archived');
create type article_category as enum ('drill_pipe', 'upstream', 'midstream', 'downstream', 'equipment_guides', 'market_news', 'industry');
create type subscriber_status as enum ('active', 'unsubscribed');
create type listing_video_status as enum ('uploading', 'processing', 'ready', 'rejected_too_long', 'error');

-- ============================================================
-- USERS
-- Extends Supabase auth.users with app-level profile data
-- ============================================================

create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  company_name        text,
  phone               text,
  avatar_url          text,
  city                text,
  state               text,
  country             text,
  signup_ip_location  text,
  role                user_role not null default 'buyer',
  plan                membership_plan not null default 'free',
  listing_limit_reached_at      timestamptz,
  listing_limit_upsell_sent_at  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  email_verified_at   timestamptz
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, company_name, avatar_url, phone, city, state, country, signup_ip_location)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'signup_ip_location'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- MEMBERSHIPS
-- Tracks plan changes and Stripe subscription info
-- ============================================================

create table public.memberships (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.users(id) on delete cascade,
  plan                 membership_plan not null,
  stripe_subscription_id text,
  stripe_customer_id   text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancelled_at         timestamptz,
  created_at           timestamptz not null default now()
);

-- ============================================================
-- LISTINGS
-- Core equipment listings table
-- ============================================================

create table public.listings (
  id               uuid primary key default uuid_generate_v4(),
  seller_id        uuid not null references public.users(id) on delete cascade,
  title            text not null,
  description      text,
  category         text not null,          -- e.g. 'drill_pipe', 'rig', 'blowout_preventer'
  manufacturer     text,
  model            text,
  year             int,
  condition        text,                   -- 'new', 'like_new', 'good', 'fair', 'parts_only'
  price            numeric(15,2) not null,
  price_negotiable boolean default false,
  price_visible    boolean not null default true,  -- if false, shows "Contact for price"
  location_city    text,
  location_state   text,
  tags             text[],
  video_url        text,
  status           listing_status not null default 'pending_review',
  tier             listing_tier,           -- set automatically by trigger on insert
  featured         boolean default false,
  view_count       int default 0,
  slug             text unique,
  meta_description text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-set tier based on price
create or replace function public.set_listing_tier()
returns trigger as $$
begin
  if new.price < 100000 then
    new.tier := 'green';
  elsif new.price < 500000 then
    new.tier := 'yellow';
  else
    new.tier := 'red';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger listing_tier_trigger
  before insert or update of price on public.listings
  for each row execute function public.set_listing_tier();

-- Auto-generate slug from title + id suffix
create or replace function public.generate_listing_slug()
returns trigger as $$
declare
  base_slug text;
  final_slug text;
begin
  base_slug := lower(regexp_replace(new.title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug || '-' || substr(new.id::text, 1, 8);
  new.slug := final_slug;
  return new;
end;
$$ language plpgsql;

create trigger listing_slug_trigger
  before insert on public.listings
  for each row execute function public.generate_listing_slug();

-- ============================================================
-- LISTING IMAGES
-- ============================================================

create table public.listing_images (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,             -- Supabase Storage path
  url         text not null,
  alt_text    text,
  sort_order  int default 0,
  is_primary  boolean default false,
  gallery_position integer,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- LISTING VIDEOS
-- Mux-hosted optional videos (max 3 per listing, 180s cap enforced in app + webhook)
-- ============================================================

create table public.listing_videos (
  id                uuid primary key default uuid_generate_v4(),
  listing_id        uuid not null references public.listings(id) on delete cascade,
  mux_asset_id      text,
  mux_playback_id   text,
  status            listing_video_status not null default 'uploading',
  duration_seconds  numeric,
  position          integer not null check (position >= 1 and position <= 3),
  gallery_position  integer,
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- LEADS
-- Buyer inquiries on listings
-- ============================================================

create table public.leads (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  seller_id    uuid not null references public.users(id),
  buyer_id     uuid references public.users(id),     -- null if unauthenticated
  buyer_name   text not null,
  buyer_email  text not null,
  buyer_phone  text,
  buyer_company text,
  message      text not null,
  status       lead_status not null default 'new',
  tier         listing_tier,                          -- inherited from listing at time of inquiry
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TRANSACTIONS
-- Commission-eligible deals (yellow + red tier)
-- ============================================================

create table public.transactions (
  id                 uuid primary key default uuid_generate_v4(),
  listing_id         uuid not null references public.listings(id),
  lead_id            uuid references public.leads(id),
  seller_id          uuid not null references public.users(id),
  buyer_id           uuid references public.users(id),
  agreed_price       numeric(15,2),
  commission_rate    numeric(5,4),                    -- e.g. 0.03 = 3%
  commission_amount  numeric(15,2),
  status             transaction_status not null default 'pending',
  bd_verified        boolean default false,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- ARTICLES
-- Knowledge base / SEO content
-- ============================================================

create table public.articles (
  id               uuid primary key default uuid_generate_v4(),
  author_id        uuid references public.users(id),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  body             text not null,
  category         article_category not null,
  status           article_status not null default 'draft',
  featured_image   text,
  meta_description text,
  tags             text[],
  read_time_mins   int,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================================

create table public.newsletter_subscribers (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null unique,
  status       subscriber_status not null default 'active',
  source       text,                                   -- e.g. 'homepage', 'listing_detail', 'knowledge_base'
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ============================================================
-- AGENT LOGS
-- Audit trail for all Paperclip AI actions
-- ============================================================

create table public.agent_logs (
  id          uuid primary key default uuid_generate_v4(),
  agent_name  text not null,                           -- 'listing_verifier', 'router', 'marketing'
  action      text not null,
  entity_type text,                                    -- 'listing', 'lead', 'article'
  entity_id   uuid,
  input       jsonb,
  output      jsonb,
  success     boolean,
  error       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.listings (seller_id);
create index on public.listings (status);
create index on public.listings (tier);
create index on public.listings (category);
create index on public.listings (price);
create index on public.listings (created_at desc);
create index on public.listings (slug);

create index on public.listing_images (listing_id, gallery_position);

create index on public.listing_videos (listing_id);
create index on public.listing_videos (mux_asset_id) where mux_asset_id is not null;
create index on public.listing_videos (listing_id, status);
create unique index listing_videos_listing_position_active_idx
  on public.listing_videos (listing_id, position)
  where status not in ('rejected_too_long', 'error');

create index listing_videos_gallery_position_idx
  on public.listing_videos (listing_id, gallery_position)
  where gallery_position is not null;

create index on public.leads (listing_id);
create index on public.leads (seller_id);
create index on public.leads (buyer_id);
create index on public.leads (status);
create index on public.leads (tier);

create index on public.articles (slug);
create index on public.articles (category);
create index on public.articles (status);
create index on public.articles (published_at desc);

create index on public.newsletter_subscribers (email);
create index on public.newsletter_subscribers (status);

create index on public.agent_logs (entity_id);
create index on public.agent_logs (created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.users enable row level security;
alter table public.memberships enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_videos enable row level security;
alter table public.leads enable row level security;
alter table public.transactions enable row level security;
alter table public.articles enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.agent_logs enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- USERS policies
create policy "Users can view their own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update using (auth.uid() = id);

create policy "Admins can view all users"
  on public.users for select using (public.is_admin());

-- MEMBERSHIPS policies
create policy "Users can view their own membership"
  on public.memberships for select using (auth.uid() = user_id);

create policy "Admins can view all memberships"
  on public.memberships for select using (public.is_admin());

-- LISTINGS policies
create policy "Anyone can view active listings"
  on public.listings for select using (status = 'active');

create policy "Anyone can view sold listings"
  on public.listings for select using (status = 'sold');

create policy "Sellers can view their own listings"
  on public.listings for select using (auth.uid() = seller_id);

create policy "Sellers can insert listings"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update their own listings"
  on public.listings for update using (auth.uid() = seller_id);

create policy "Admins have full listing access"
  on public.listings for all using (public.is_admin());

-- LISTING IMAGES policies
create policy "Anyone can view images of active listings"
  on public.listing_images for select using (
    exists (
      select 1 from public.listings
      where id = listing_id and status = 'active'
    )
  );

create policy "Anyone can view images of sold listings"
  on public.listing_images for select using (
    exists (
      select 1 from public.listings
      where id = listing_id and status = 'sold'
    )
  );

create policy "Sellers can manage their listing images"
  on public.listing_images for all using (
    exists (
      select 1 from public.listings
      where id = listing_id and seller_id = auth.uid()
    )
  );

create policy "Admins have full image access"
  on public.listing_images for all using (public.is_admin());

-- LISTING VIDEOS policies
create policy "Anyone can view ready videos of active listings"
  on public.listing_videos for select using (
    status = 'ready'
    and exists (
      select 1 from public.listings
      where id = listing_id and status = 'active'
    )
  );

create policy "Anyone can view ready videos of sold listings"
  on public.listing_videos for select using (
    status = 'ready'
    and exists (
      select 1 from public.listings
      where id = listing_id and status = 'sold'
    )
  );

create policy "Listing owners can manage listing videos"
  on public.listing_videos for all using (
    public.user_can_manage_listing_media(listing_id)
  ) with check (
    public.user_can_manage_listing_media(listing_id)
  );

create policy "Admins have full listing video access"
  on public.listing_videos for all using (public.is_admin());

-- LEADS policies
create policy "Sellers can view leads on their listings"
  on public.leads for select using (auth.uid() = seller_id);

create policy "Buyers can view their own submitted leads"
  on public.leads for select using (auth.uid() = buyer_id);

create policy "Anyone can submit a lead"
  on public.leads for insert with check (true);

create policy "Admins have full lead access"
  on public.leads for all using (public.is_admin());

-- TRANSACTIONS policies
create policy "Sellers can view their own transactions"
  on public.transactions for select using (auth.uid() = seller_id);

create policy "Buyers can view their own transactions"
  on public.transactions for select using (auth.uid() = buyer_id);

create policy "Admins have full transaction access"
  on public.transactions for all using (public.is_admin());

-- ARTICLES policies
create policy "Anyone can view published articles"
  on public.articles for select using (status = 'published');

create policy "Admins have full article access"
  on public.articles for all using (public.is_admin());

-- NEWSLETTER policies
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert with check (true);

create policy "Subscribers can unsubscribe via email match"
  on public.newsletter_subscribers for update using (true);

create policy "Admins can view all subscribers"
  on public.newsletter_subscribers for select using (public.is_admin());

-- AGENT LOGS policies
create policy "Admins can view all agent logs"
  on public.agent_logs for all using (public.is_admin());

-- ============================================================
-- LISTING COUNT ENFORCEMENT (free plan = max 3)
-- Enforced server-side in API route, this is a safety trigger
-- ============================================================

create or replace function public.check_listing_limit()
returns trigger as $$
declare
  listing_count int;
  user_plan     text;
  plan_limit    int;
begin
  -- Only enforce when the listing is being made active (drafts are always allowed)
  if new.status != 'active' then
    return new;
  end if;

  select plan::text into user_plan from public.users where id = new.seller_id;

  case user_plan
    when 'starter'  then plan_limit := 15;
    when 'pro'      then plan_limit := 40;
    when 'max'      then plan_limit := null;   -- unlimited
    else                 plan_limit := 3;      -- free + unknown
  end case;

  -- Unlimited plans skip the check
  if plan_limit is null then
    return new;
  end if;

  select count(*) into listing_count
  from public.listings
  where seller_id = new.seller_id
    and status = 'active'
    and id != new.id;  -- exclude current row so updates are idempotent

  if listing_count >= plan_limit then
    raise exception
      'You''ve reached your % active listing limit. Upgrade your membership for more listings.',
      plan_limit;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Fires on INSERT and UPDATE so publishing a draft also hits the check
drop trigger if exists enforce_listing_limit on public.listings;
create trigger enforce_listing_limit
  before insert or update on public.listings
  for each row execute function public.check_listing_limit();

-- LISTING VIDEO COUNT + UPDATED_AT (max 3 non-rejected/error videos per listing)
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

create or replace function public.user_can_manage_listing_media(p_listing_id uuid)
returns boolean as $$
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
$$ language sql security definer stable set search_path = public;
