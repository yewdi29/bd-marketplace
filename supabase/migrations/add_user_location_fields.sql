-- F003: Add location fields to users table
alter table public.users
  add column if not exists city               text,
  add column if not exists state              text,
  add column if not exists country            text,
  add column if not exists signup_ip_location text;

-- Update trigger to populate location fields from signup metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, company_name, avatar_url, city, state, country, signup_ip_location)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'signup_ip_location'
  );
  return new;
end;
$$ language plpgsql security definer;
