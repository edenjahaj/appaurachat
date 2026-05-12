
-- Mute conversations
create table if not exists public.conversation_mutes (
  user_id uuid not null,
  conversation_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);
alter table public.conversation_mutes enable row level security;
create policy "Read own mutes" on public.conversation_mutes for select to authenticated using (user_id = auth.uid());
create policy "Insert own mutes" on public.conversation_mutes for insert to authenticated with check (user_id = auth.uid());
create policy "Delete own mutes" on public.conversation_mutes for delete to authenticated using (user_id = auth.uid());

-- Block users
create table if not exists public.user_blocks (
  user_id uuid not null,
  blocked_user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_user_id),
  check (user_id <> blocked_user_id)
);
alter table public.user_blocks enable row level security;
create policy "Read own blocks" on public.user_blocks for select to authenticated using (user_id = auth.uid());
create policy "Insert own blocks" on public.user_blocks for insert to authenticated with check (user_id = auth.uid());
create policy "Delete own blocks" on public.user_blocks for delete to authenticated using (user_id = auth.uid());

-- Reports
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  message_id uuid not null,
  scope text not null check (scope in ('dm','channel')),
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);
alter table public.message_reports enable row level security;
create policy "Insert own reports" on public.message_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "Read own reports" on public.message_reports for select to authenticated using (reporter_id = auth.uid());

-- Toggle helpers
create or replace function public.toggle_mute(_conversation_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare _me uuid := auth.uid(); _exists boolean;
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  select exists(select 1 from public.conversation_mutes where user_id = _me and conversation_id = _conversation_id) into _exists;
  if _exists then
    delete from public.conversation_mutes where user_id = _me and conversation_id = _conversation_id;
    return false;
  else
    insert into public.conversation_mutes (user_id, conversation_id) values (_me, _conversation_id);
    return true;
  end if;
end; $$;

create or replace function public.toggle_block(_blocked_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare _me uuid := auth.uid(); _exists boolean;
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  if _me = _blocked_user_id then raise exception 'Cannot block yourself'; end if;
  select exists(select 1 from public.user_blocks where user_id = _me and blocked_user_id = _blocked_user_id) into _exists;
  if _exists then
    delete from public.user_blocks where user_id = _me and blocked_user_id = _blocked_user_id;
    return false;
  else
    insert into public.user_blocks (user_id, blocked_user_id) values (_me, _blocked_user_id);
    return true;
  end if;
end; $$;
