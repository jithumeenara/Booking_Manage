-- Create profiles table for app users/admins
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null,
  role text not null default 'user' check (role in ('admin','user')),
  mobile text,
  photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
-- 1) Users can read their own profile
create policy if not exists "profiles_read_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- 2) Admins can read all profiles
create policy if not exists "profiles_admin_read_all"
  on public.profiles
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles pr 
    where pr.id = auth.uid() and pr.role = 'admin'
  ));

-- 3) Users can insert their own profile
create policy if not exists "profiles_insert_self"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- 4) Users can update their own profile
create policy if not exists "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5) Admins can update any profile
create policy if not exists "profiles_admin_update_any"
  on public.profiles
  for update
  to authenticated
  using (exists (
    select 1 from public.profiles pr 
    where pr.id = auth.uid() and pr.role = 'admin'
  ));

-- 6) Admins can delete any profile
create policy if not exists "profiles_admin_delete_any"
  on public.profiles
  for delete
  to authenticated
  using (exists (
    select 1 from public.profiles pr 
    where pr.id = auth.uid() and pr.role = 'admin'
  ));
