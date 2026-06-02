-- Migration: Fix check_listing_limit trigger
-- Old behavior: counted ALL non-removed listings (including drafts) — blocked draft creation
-- New behavior: only counts ACTIVE listings, supports all plan tiers, fires on INSERT and UPDATE

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
    when 'max'      then plan_limit := null;
    else                 plan_limit := 3;
  end case;

  if plan_limit is null then
    return new;
  end if;

  select count(*) into listing_count
  from public.listings
  where seller_id = new.seller_id
    and status = 'active'
    and id != new.id;

  if listing_count >= plan_limit then
    raise exception
      'You''ve reached your % active listing limit. Upgrade your membership for more listings.',
      plan_limit;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_listing_limit on public.listings;
create trigger enforce_listing_limit
  before insert or update on public.listings
  for each row execute function public.check_listing_limit();
