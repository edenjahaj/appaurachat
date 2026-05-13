-- Roles enum
do $$ begin
  create type public.app_role as enum ('owner','admin');
exception when duplicate_object then null; end $$;

-- user_roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security-definer helpers
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_owner(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'owner');
$$;

-- Policies
drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.is_owner(auth.uid()));

drop policy if exists "Only owner manages roles insert" on public.user_roles;
create policy "Only owner manages roles insert" on public.user_roles
for insert to authenticated
with check (public.is_owner(auth.uid()));

drop policy if exists "Only owner manages roles delete" on public.user_roles;
create policy "Only owner manages roles delete" on public.user_roles
for delete to authenticated
using (public.is_owner(auth.uid()));

-- Claim owner: first authenticated caller becomes the sole owner
create or replace function public.claim_owner()
returns boolean
language plpgsql security definer set search_path = public
as $$
declare _me uuid := auth.uid();
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.user_roles where role = 'owner') then
    return false;
  end if;
  insert into public.user_roles (user_id, role) values (_me, 'owner')
  on conflict do nothing;
  return true;
end; $$;

-- Admin panel helpers (owner-only)
create or replace function public.admin_grant_admin(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(auth.uid()) then raise exception 'Forbidden'; end if;
  insert into public.user_roles (user_id, role) values (_user_id, 'admin') on conflict do nothing;
end; $$;

create or replace function public.admin_revoke_admin(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(auth.uid()) then raise exception 'Forbidden'; end if;
  delete from public.user_roles where user_id = _user_id and role = 'admin';
end; $$;

create or replace function public.admin_delete_message(_message_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(auth.uid()) then raise exception 'Forbidden'; end if;
  delete from public.messages where id = _message_id;
end; $$;

create or replace function public.admin_delete_channel_message(_message_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(auth.uid()) then raise exception 'Forbidden'; end if;
  delete from public.channel_messages where id = _message_id;
end; $$;