
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone authenticated"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto create profile trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  i int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), '[^a-z0-9_]', '', 'g'));
  if base_username is null or length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text,1,8);
  end if;
  final_username := base_username;
  while exists(select 1 from public.profiles where username = final_username) loop
    i := i + 1;
    final_username := base_username || i::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', final_username)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- CONVERSATIONS
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text,
  avatar_url text,
  created_by uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;

-- MEMBERS
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_members enable row level security;

-- Helper: is current user a member?
create or replace function public.is_conversation_member(_conversation_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.conversation_members
    where conversation_id = _conversation_id and user_id = _user_id
  );
$$;

create policy "Members can read their conversations"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id, auth.uid()));
create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated
  with check (auth.uid() = created_by);
create policy "Members can update conversation"
  on public.conversations for update to authenticated
  using (public.is_conversation_member(id, auth.uid()));

create policy "Members can read members of their conversations"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()) or user_id = auth.uid());
create policy "Users can add themselves or be added (insert allowed for authed)"
  on public.conversation_members for insert to authenticated
  with check (true);
create policy "Users can remove themselves"
  on public.conversation_members for delete to authenticated
  using (user_id = auth.uid());

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
alter table public.messages enable row level security;
create index messages_conversation_idx on public.messages(conversation_id, created_at desc);

create policy "Members can read messages"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "Members can send messages"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id, auth.uid()));
create policy "Senders can edit their messages"
  on public.messages for update to authenticated
  using (sender_id = auth.uid());
create policy "Senders can delete their messages"
  on public.messages for delete to authenticated
  using (sender_id = auth.uid());

-- Touch conversation last_message_at
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  return new;
end;
$$;
create trigger touch_conversation_on_msg
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- STORIES
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) between 1 and 500),
  background text not null default 'gradient-1',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
alter table public.stories enable row level security;
create index stories_expires_idx on public.stories(expires_at);

create policy "Authenticated can read fresh stories"
  on public.stories for select to authenticated using (expires_at > now());
create policy "Users can create their own stories"
  on public.stories for insert to authenticated with check (user_id = auth.uid());
create policy "Users can delete their own stories"
  on public.stories for delete to authenticated using (user_id = auth.uid());

-- Get-or-create a 1:1 DM
create or replace function public.get_or_create_dm(_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _me uuid := auth.uid();
  _conv uuid;
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  if _me = _other_user_id then raise exception 'Cannot DM yourself'; end if;

  select c.id into _conv
  from public.conversations c
  where c.is_group = false
    and exists(select 1 from public.conversation_members m1 where m1.conversation_id = c.id and m1.user_id = _me)
    and exists(select 1 from public.conversation_members m2 where m2.conversation_id = c.id and m2.user_id = _other_user_id)
    and (select count(*) from public.conversation_members m where m.conversation_id = c.id) = 2
  limit 1;

  if _conv is not null then return _conv; end if;

  insert into public.conversations (is_group, created_by) values (false, _me) returning id into _conv;
  insert into public.conversation_members (conversation_id, user_id) values (_conv, _me), (_conv, _other_user_id);
  return _conv;
end;
$$;

-- Create group
create or replace function public.create_group(_name text, _member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _me uuid := auth.uid();
  _conv uuid;
  _u uuid;
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  insert into public.conversations (is_group, name, created_by) values (true, _name, _me) returning id into _conv;
  insert into public.conversation_members (conversation_id, user_id) values (_conv, _me);
  foreach _u in array _member_ids loop
    if _u <> _me then
      insert into public.conversation_members (conversation_id, user_id) values (_conv, _u)
      on conflict do nothing;
    end if;
  end loop;
  return _conv;
end;
$$;

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_members;
alter publication supabase_realtime add table public.stories;
