-- Create this user first in Supabase Authentication -> Users.
-- Replace the email and display name below with the Admin's own details.
-- The Admin chooses and enters their password directly in Supabase.
do $$
declare
  bootstrap_user_id uuid;
  bootstrap_email text := 'admin@example.com';
  bootstrap_name text := 'Farm Admin';
begin
  select id into bootstrap_user_id
  from auth.users
  where lower(email) = lower(bootstrap_email);

  if bootstrap_user_id is null then
    raise exception 'Create the Auth user for % before running this bootstrap', bootstrap_email;
  end if;

  insert into public.profiles (id, login_id, display_name, role, approval_status, must_change_password)
  values (bootstrap_user_id, lower(bootstrap_email), bootstrap_name, 'admin', 'approved', false);
end;
$$;