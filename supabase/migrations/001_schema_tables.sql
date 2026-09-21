-- Threadly organization cloud schema
-- Run in Supabase SQL Editor (or via supabase db push)

-- Extensions
create extension if not exists "pgcrypto";

-- Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free',
  is_paid boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone text,
  display_name text,
  created_at timestamptz not null default now()
);

-- Org members / directory
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  designation text not null default '',
  department text not null default '',
  role text not null check (role in ('admin', 'member')) default 'member',
  email text,
  phone text,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists org_members_org_id_idx on public.org_members (org_id);
create index if not exists org_members_user_id_idx on public.org_members (user_id);

-- Invite links
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invites_token_idx on public.invites (token);
create index if not exists invites_org_id_idx on public.invites (org_id);

-- Conversations (org-scoped group/dm)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  is_group boolean not null default true,
  hue integer not null default 200,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_org_id_idx on public.conversations (org_id);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- Messages (parent_id for nested threads)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.messages (id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_parent_id_idx on public.messages (parent_id);

-- Attachments metadata (bytes in Storage bucket "attachments")
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  name text not null,
  mime_type text not null default 'application/octet-stream',
  size integer not null default 0,
  kind text not null check (kind in ('image', 'file')) default 'file',
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists attachments_message_id_idx on public.attachments (message_id);

-- Helper: is the current user a member of an org?
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = p_conversation_id and cm.user_id = auth.uid()
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
