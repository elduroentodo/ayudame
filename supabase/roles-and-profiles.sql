-- Ejecutar una sola vez en Supabase SQL Editor.
-- Roles y perfiles administrativos para Ayúdame.

create type public.app_role as enum ('super_admin', 'admin', 'editor', 'viewer');
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'admin',
  updated_at timestamptz not null default now()
);
alter table public.businesses add column if not exists active boolean not null default true;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'super_admin') $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.user_profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute procedure public.handle_new_user();

-- Crea perfiles para las cuentas existentes.
insert into public.user_profiles (id, full_name, email)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email from auth.users
on conflict (id) do nothing;
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users on conflict (user_id) do nothing;

alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile" on public.user_profiles for select using (id = auth.uid() or public.is_super_admin());
drop policy if exists "Super admins manage profiles" on public.user_profiles;
create policy "Super admins manage profiles" on public.user_profiles for update using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "Users read own role" on public.user_roles;
create policy "Users read own role" on public.user_roles for select using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "Super admins manage roles" on public.user_roles;
create policy "Super admins manage roles" on public.user_roles for update using (public.is_super_admin()) with check (public.is_super_admin());

-- Convierte TU cuenta en SuperAdmin: sustituye el correo antes de ejecutar.
-- insert into public.user_roles (user_id, role)
-- select id, 'super_admin' from auth.users where email = 'tu-correo@ejemplo.com'
-- on conflict (user_id) do update set role = excluded.role;
