-- Fix B003: handle_new_user trigger was not reading company_name from raw_user_meta_data
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, company_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
