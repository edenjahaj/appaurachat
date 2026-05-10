-- ============ ENUMS ============
create type public.class_role as enum ('admin', 'student');
create type public.announcement_severity as enum ('normal', 'important', 'critical');

-- ============ TABLES ============
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null,
  role public.class_role not null default 'student',
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index idx_class_members_user on public.class_members(user_id);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  slug text not null,
  name text not null,
  icon text,
  description text,
  is_announcements boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (class_id, slug)
);
create index idx_channels_class on public.channels(class_id);

create table public.channel_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null,
  content text,
  parent_id uuid references public.channel_messages(id) on delete set null,
  pinned boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_chmsg_channel_created on public.channel_messages(channel_id, created_at desc);

create table public.channel_reads (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null,
  title text not null,
  body text not null,
  severity public.announcement_severity not null default 'normal',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_announcements_class_created on public.announcements(class_id, created_at desc);

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

-- ============ HELPERS (security definer to avoid RLS recursion) ============
create or replace function public.is_class_member(_class_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.class_members where class_id = _class_id and user_id = _user_id);
$$;

create or replace function public.is_class_admin(_class_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.class_members where class_id = _class_id and user_id = _user_id and role = 'admin');
$$;

create or replace function public.channel_class(_channel_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select class_id from public.channels where id = _channel_id;
$$;

create or replace function public.channel_is_announcements(_channel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_announcements from public.channels where id = _channel_id;
$$;

-- ============ ENABLE RLS ============
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.channels enable row level security;
alter table public.channel_messages enable row level security;
alter table public.channel_reads enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

-- ============ POLICIES: classes ============
create policy "Members can read their classes" on public.classes
  for select to authenticated using (public.is_class_member(id, auth.uid()));
create policy "Authenticated can create classes" on public.classes
  for insert to authenticated with check (auth.uid() = created_by);
create policy "Admins can update class" on public.classes
  for update to authenticated using (public.is_class_admin(id, auth.uid()));

-- ============ POLICIES: class_members ============
create policy "Members can read class members" on public.class_members
  for select to authenticated using (public.is_class_member(class_id, auth.uid()) or user_id = auth.uid());
create policy "Insert allowed for self or admin" on public.class_members
  for insert to authenticated with check (user_id = auth.uid() or public.is_class_admin(class_id, auth.uid()));
create policy "Self leave or admin remove" on public.class_members
  for delete to authenticated using (user_id = auth.uid() or public.is_class_admin(class_id, auth.uid()));

-- ============ POLICIES: channels ============
create policy "Members can read channels" on public.channels
  for select to authenticated using (public.is_class_member(class_id, auth.uid()));
create policy "Admins can create channels" on public.channels
  for insert to authenticated with check (public.is_class_admin(class_id, auth.uid()));
create policy "Admins can update channels" on public.channels
  for update to authenticated using (public.is_class_admin(class_id, auth.uid()));
create policy "Admins can delete channels" on public.channels
  for delete to authenticated using (public.is_class_admin(class_id, auth.uid()));

-- ============ POLICIES: channel_messages ============
create policy "Members can read messages" on public.channel_messages
  for select to authenticated using (public.is_class_member(public.channel_class(channel_id), auth.uid()));
create policy "Members can send (admins only in announcements)" on public.channel_messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and public.is_class_member(public.channel_class(channel_id), auth.uid())
    and (
      not public.channel_is_announcements(channel_id)
      or public.is_class_admin(public.channel_class(channel_id), auth.uid())
    )
  );
create policy "Senders edit own; admins can pin" on public.channel_messages
  for update to authenticated using (
    sender_id = auth.uid()
    or public.is_class_admin(public.channel_class(channel_id), auth.uid())
  );
create policy "Senders delete own; admins can delete any" on public.channel_messages
  for delete to authenticated using (
    sender_id = auth.uid()
    or public.is_class_admin(public.channel_class(channel_id), auth.uid())
  );

-- ============ POLICIES: channel_reads ============
create policy "Read own reads" on public.channel_reads
  for select to authenticated using (user_id = auth.uid());
create policy "Upsert own reads (insert)" on public.channel_reads
  for insert to authenticated with check (user_id = auth.uid());
create policy "Upsert own reads (update)" on public.channel_reads
  for update to authenticated using (user_id = auth.uid());

-- ============ POLICIES: announcements ============
create policy "Members can read announcements" on public.announcements
  for select to authenticated using (public.is_class_member(class_id, auth.uid()));
create policy "Admins can create announcements" on public.announcements
  for insert to authenticated with check (
    author_id = auth.uid() and public.is_class_admin(class_id, auth.uid())
  );
create policy "Admins can update announcements" on public.announcements
  for update to authenticated using (public.is_class_admin(class_id, auth.uid()));
create policy "Admins can delete announcements" on public.announcements
  for delete to authenticated using (public.is_class_admin(class_id, auth.uid()));

-- ============ POLICIES: announcement_reads ============
create policy "Read own announcement reads" on public.announcement_reads
  for select to authenticated using (user_id = auth.uid());
create policy "Insert own announcement reads" on public.announcement_reads
  for insert to authenticated with check (user_id = auth.uid());

-- ============ DEFAULT CHANNELS TRIGGER ============
create or replace function public.seed_default_channels()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.class_members (class_id, user_id, role) values (new.id, new.created_by, 'admin')
    on conflict do nothing;
  insert into public.channels (class_id, slug, name, icon, is_announcements, position) values
    (new.id, 'announcements', 'announcements', 'megaphone', true, 0),
    (new.id, 'general',       'general',       'hash',     false, 1),
    (new.id, 'homework',      'homework',      'book',     false, 2),
    (new.id, 'study-help',    'study-help',    'graduation-cap', false, 3),
    (new.id, 'memes',         'memes',         'smile',    false, 4),
    (new.id, 'random',        'random',        'sparkles', false, 5);
  return new;
end; $$;

create trigger trg_seed_default_channels
  after insert on public.classes
  for each row execute function public.seed_default_channels();

-- ============ RPCs ============
create or replace function public.gen_join_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return code;
end; $$;

create or replace function public.create_class(_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _me uuid := auth.uid();
  _id uuid;
  _code text;
  _attempts int := 0;
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  loop
    _code := public.gen_join_code();
    exit when not exists(select 1 from public.classes where join_code = _code);
    _attempts := _attempts + 1;
    if _attempts > 8 then raise exception 'Could not generate join code'; end if;
  end loop;
  insert into public.classes (name, join_code, created_by) values (_name, _code, _me) returning id into _id;
  return _id;
end; $$;

create or replace function public.join_class(_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _me uuid := auth.uid();
  _class_id uuid;
begin
  if _me is null then raise exception 'Not authenticated'; end if;
  select id into _class_id from public.classes where join_code = upper(_code);
  if _class_id is null then raise exception 'Invalid join code'; end if;
  insert into public.class_members (class_id, user_id, role) values (_class_id, _me, 'student')
    on conflict do nothing;
  return _class_id;
end; $$;

create or replace function public.mark_channel_read(_channel_id uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.channel_reads (channel_id, user_id, last_read_at)
  values (_channel_id, auth.uid(), now())
  on conflict (channel_id, user_id) do update set last_read_at = excluded.last_read_at;
$$;

create or replace function public.mark_announcement_read(_announcement_id uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.announcement_reads (announcement_id, user_id) values (_announcement_id, auth.uid())
  on conflict do nothing;
$$;

-- ============ TOUCH CHANNEL last_message_at via no-op (we use created_at on messages directly) ============

-- ============ REALTIME ============
alter publication supabase_realtime add table public.channel_messages;
alter publication supabase_realtime add table public.announcements;