-- Admin Command Center — deals table, user suspension, listing flagging

-- User suspension flag
alter table public.users
  add column if not exists suspended boolean not null default false;

-- Admin flag on listings (moderation)
alter table public.listings
  add column if not exists admin_flagged boolean not null default false;

-- Deal tracker
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  deal_tier text not null check (deal_tier in ('yellow', 'red')),
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  seller_name text,
  asking_price numeric,
  final_sale_price numeric,
  commission_rate numeric default 7,
  commission_earned numeric generated always as (coalesce(final_sale_price, 0) * coalesce(commission_rate, 7) / 100) stored,
  status text not null default 'identified' check (status in ('identified', 'contacted', 'negotiating', 'closed_won', 'closed_lost')),
  notes text,
  assigned_to uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists deals_status_idx on public.deals (status);
create index if not exists deals_listing_idx on public.deals (listing_id);
create index if not exists deals_assigned_idx on public.deals (assigned_to);

alter table public.deals enable row level security;

create policy "Admins have full deal access"
  on public.deals for all using (public.is_admin());

-- Auto-update updated_at
create or replace function public.set_deals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists deals_updated_at on public.deals;
create trigger deals_updated_at
  before update on public.deals
  for each row execute function public.set_deals_updated_at();
