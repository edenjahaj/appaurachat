
-- Channel message reactions
create table if not exists public.message_reactions (
  message_id uuid not null references public.channel_messages(id) on delete cascade,
  user_id uuid not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
alter table public.message_reactions enable row level security;

create policy "Members read reactions" on public.message_reactions
for select to authenticated using (
  public.is_class_member(public.channel_class((select channel_id from public.channel_messages where id = message_id)), auth.uid())
);
create policy "Members add own reactions" on public.message_reactions
for insert to authenticated with check (
  user_id = auth.uid()
  and public.is_class_member(public.channel_class((select channel_id from public.channel_messages where id = message_id)), auth.uid())
);
create policy "Users delete own reactions" on public.message_reactions
for delete to authenticated using (user_id = auth.uid());

create or replace function public.toggle_channel_reaction(_message_id uuid, _emoji text)
returns void language plpgsql security definer set search_path = public as $$
declare _me uuid := auth.uid();
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.message_reactions where message_id = _message_id and user_id = _me and emoji = _emoji) then
    delete from public.message_reactions where message_id = _message_id and user_id = _me and emoji = _emoji;
  else
    insert into public.message_reactions (message_id, user_id, emoji) values (_message_id, _me, _emoji);
  end if;
end; $$;

-- DM reactions
create table if not exists public.dm_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
alter table public.dm_reactions enable row level security;

create policy "Members read dm reactions" on public.dm_reactions
for select to authenticated using (
  public.is_conversation_member((select conversation_id from public.messages where id = message_id), auth.uid())
);
create policy "Members add own dm reactions" on public.dm_reactions
for insert to authenticated with check (
  user_id = auth.uid()
  and public.is_conversation_member((select conversation_id from public.messages where id = message_id), auth.uid())
);
create policy "Users delete own dm reactions" on public.dm_reactions
for delete to authenticated using (user_id = auth.uid());

create or replace function public.toggle_dm_reaction(_message_id uuid, _emoji text)
returns void language plpgsql security definer set search_path = public as $$
declare _me uuid := auth.uid();
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.dm_reactions where message_id = _message_id and user_id = _me and emoji = _emoji) then
    delete from public.dm_reactions where message_id = _message_id and user_id = _me and emoji = _emoji;
  else
    insert into public.dm_reactions (message_id, user_id, emoji) values (_message_id, _me, _emoji);
  end if;
end; $$;

-- Realtime
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.dm_reactions;
