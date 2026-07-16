-- Enterprise unlimited listings only after org billing (payment method) is on file.

create or replace function public.check_listing_limit()
returns trigger as $$
declare
  listing_count int;
  user_plan     text;
  plan_limit    int;
begin
  if new.status != 'active' then
    return new;
  end if;

  if exists (
    select 1
    from public.org_members om
    join public.organizations o on o.id = om.organization_id
    where om.user_id = new.seller_id
      and om.status = 'active'
      and o.preferred_payment_method is not null
  ) then
    return new;
  end if;

  select plan::text into user_plan from public.users where id = new.seller_id;

  case user_plan
    when 'starter'  then plan_limit := 15;
    when 'pro'      then plan_limit := 40;
    when 'max'      then plan_limit := null;
    when 'premium'  then plan_limit := null;
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
