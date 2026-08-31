-- ARConnect: profiles table + role security
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- against your project. Safe to re-run: guarded with IF NOT EXISTS /
-- OR REPLACE / DROP ... IF EXISTS where applicable.

-- 1. Table -------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'candidate' check (role in ('candidate', 'employer', 'admin')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated user; role drives portal access.';

-- 2. Row Level Security --------------------------------------------------
-- No INSERT/DELETE policy is defined on purpose: rows are created only by
-- the handle_new_user() trigger below (SECURITY DEFINER, bypasses RLS),
-- never directly by a client. This means a user can never fabricate or
-- delete a profile row, including their own, from the browser.

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Prevent privilege escalation ----------------------------------------
-- The UPDATE policy above lets a user update their own row (e.g. full_name,
-- phone, avatar_url) but role must never be client-settable, even to a
-- valid enum value like 'employer'. This trigger silently pins role back
-- to its previous value on every UPDATE, regardless of what the client
-- sends, so admin status can never be granted from client-side code.

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- 4. Auto-create profile on signup ----------------------------------------
-- role/full_name/phone come from the signUp() call's options.data
-- (user_metadata). Only 'candidate' or 'employer' are ever honored here —
-- any other value (including 'admin') silently falls back to 'candidate'.
-- This is the actual enforcement of "no self-registration as admin"; the
-- UI simply not offering an Admin option is not sufficient on its own.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  safe_role text;
begin
  if requested_role in ('candidate', 'employer') then
    safe_role := requested_role;
  else
    safe_role := 'candidate';
  end if;

  insert into public.profiles (user_id, full_name, email, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    safe_role,
    new.raw_user_meta_data ->> 'phone'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Admin provisioning ----------------------------------------------------
-- There is deliberately no self-service way to become an admin. To promote
-- an existing user, run this manually in the Supabase SQL editor (which
-- runs as the table owner and bypasses RLS) after they have registered as
-- a candidate or employer:
--
--   update public.profiles set role = 'admin' where email = 'someone@example.com';
