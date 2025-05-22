-- migrate:up
-- Enable RLS on users table
alter table public.users enable row level security;

-- Create a policy that allows all users to see all rows
create policy "Allow all users to see all users"
on public.users
for select
using (true);

-- Create a policy that allows users to update their own profile
create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id); 