-- RLS policies for Threadly org cloud
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.org_members enable row level security;
alter table public.invites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;

drop policy if exists "profiles_select_own_or_org" on public.profiles;
create policy "profiles_select_own_or_org" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.org_members me
      join public.org_members them on them.org_id = me.org_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "orgs_select_member" on public.organizations;
create policy "orgs_select_member" on public.organizations
  for select to authenticated
  using (public.is_org_member(id) or created_by = auth.uid());

drop policy if exists "orgs_insert_authenticated" on public.organizations;
create policy "orgs_insert_authenticated" on public.organizations
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "orgs_update_admin" on public.organizations;
create policy "orgs_update_admin" on public.organizations
  for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

drop policy if exists "org_members_select_same_org" on public.org_members;
create policy "org_members_select_same_org" on public.org_members
  for select to authenticated
  using (public.is_org_member(org_id));

drop policy if exists "org_members_insert_admin_or_self_join" on public.org_members;
create policy "org_members_insert_admin_or_self_join" on public.org_members
  for insert to authenticated
  with check (public.is_org_admin(org_id) or user_id = auth.uid());

drop policy if exists "org_members_update_admin" on public.org_members;
create policy "org_members_update_admin" on public.org_members
  for update to authenticated
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

drop policy if exists "org_members_delete_admin" on public.org_members;
create policy "org_members_delete_admin" on public.org_members
  for delete to authenticated
  using (public.is_org_admin(org_id));

drop policy if exists "invites_select" on public.invites;
create policy "invites_select" on public.invites
  for select to authenticated
  using (public.is_org_member(org_id) or (used_at is null and expires_at > now()));

drop policy if exists "invites_insert_admin" on public.invites;
create policy "invites_insert_admin" on public.invites
  for insert to authenticated
  with check (public.is_org_admin(org_id));

drop policy if exists "invites_update_claim" on public.invites;
create policy "invites_update_claim" on public.invites
  for update to authenticated
  using (public.is_org_admin(org_id) or (used_at is null and expires_at > now()))
  with check (true);

drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member" on public.conversations
  for select to authenticated
  using (public.is_conversation_member(id));

drop policy if exists "conversations_insert_org_member" on public.conversations;
create policy "conversations_insert_org_member" on public.conversations
  for insert to authenticated
  with check (public.is_org_member(org_id));

drop policy if exists "conversations_update_admin" on public.conversations;
create policy "conversations_update_admin" on public.conversations
  for update to authenticated
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

drop policy if exists "conversation_members_select" on public.conversation_members;
create policy "conversation_members_select" on public.conversation_members
  for select to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists "conversation_members_insert" on public.conversation_members;
create policy "conversation_members_insert" on public.conversation_members
  for insert to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.is_org_member(c.org_id)
    )
  );

drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member" on public.messages
  for select to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member" on public.messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_conversation_member(conversation_id)
  );

drop policy if exists "attachments_select_member" on public.attachments;
create policy "attachments_select_member" on public.attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_member(m.conversation_id)
    )
  );

drop policy if exists "attachments_insert_member" on public.attachments;
create policy "attachments_insert_member" on public.attachments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_id
        and m.author_id = auth.uid()
        and public.is_conversation_member(m.conversation_id)
    )
  );
