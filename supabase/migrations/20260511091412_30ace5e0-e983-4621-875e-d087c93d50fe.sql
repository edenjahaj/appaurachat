
create table if not exists public.favorites (
  user_id uuid not null,
  friend_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.favorites enable row level security;

create policy "Read own favorites" on public.favorites
for select to authenticated using (user_id = auth.uid());
create policy "Insert own favorites" on public.favorites
for insert to authenticated with check (user_id = auth.uid());
create policy "Delete own favorites" on public.favorites
for delete to authenticated using (user_id = auth.uid());

create or replace function public.toggle_favorite(_friend_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare _me uuid := auth.uid(); _exists boolean;
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  if _me = _friend_id then raise exception 'Cannot favorite yourself'; end if;
  select exists(select 1 from public.favorites where user_id = _me and friend_id = _friend_id) into _exists;
  if _exists then
    delete from public.favorites where user_id = _me and friend_id = _friend_id;
    return false;
  else
    insert into public.favorites (user_id, friend_id) values (_me, _friend_id);
    return true;
  end if;
end; $$;

alter publication supabase_realtime add table public.favorites;
