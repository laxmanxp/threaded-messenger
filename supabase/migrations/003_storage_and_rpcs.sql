-- Storage + invite RPCs (run after 001_schema_tables.sql and 002_rls_and_functions.sql)

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_storage_select" on storage.objects;
create policy "attachments_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments');

drop policy if exists "attachments_storage_insert" on storage.objects;
create policy "attachments_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create or replace function public.accept_invite(
  p_token text,
  p_name text,
  p_designation text default '',
  p_department text default '',
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites%rowtype;
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite from public.invites where token = p_token for update;

  if not found then raise exception 'Invite not found'; end if;
  if v_invite.used_at is not null then raise exception 'Invite already used'; end if;
  if v_invite.expires_at < now() then raise exception 'Invite expired'; end if;

  v_org_id := v_invite.org_id;

  insert into public.org_members (org_id, user_id, name, designation, department, role, email, phone)
  values (
    v_org_id, auth.uid(),
    coalesce(nullif(trim(p_name), ''), 'Member'),
    coalesce(p_designation, ''), coalesce(p_department, ''), 'member',
    (select email from auth.users where id = auth.uid()), p_phone
  )
  on conflict (org_id, user_id) do update
    set name = excluded.name,
        designation = excluded.designation,
        department = excluded.department,
        phone = coalesce(excluded.phone, public.org_members.phone);

  update public.invites set used_at = now(), used_by = auth.uid() where id = v_invite.id;

  insert into public.conversation_members (conversation_id, user_id)
  select c.id, auth.uid() from public.conversations c
  where c.org_id = v_org_id and c.is_group = true
  on conflict do nothing;

  return v_org_id;
end;
$$;

grant execute on function public.accept_invite(text, text, text, text, text) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create or replace function public.get_invite_info(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  select i.id, i.token, i.org_id, i.expires_at, i.used_at, i.created_at,
         o.name as org_name, o.slug as org_slug, o.plan, o.is_paid
  into v_row
  from public.invites i
  join public.organizations o on o.id = i.org_id
  where i.token = p_token;

  if not found then return null; end if;

  return jsonb_build_object(
    'id', v_row.id, 'token', v_row.token, 'org_id', v_row.org_id,
    'expires_at', v_row.expires_at, 'used_at', v_row.used_at, 'created_at', v_row.created_at,
    'organization', jsonb_build_object(
      'id', v_row.org_id, 'name', v_row.org_name, 'slug', v_row.org_slug,
      'plan', v_row.plan, 'is_paid', v_row.is_paid
    )
  );
end;
$$;

grant execute on function public.get_invite_info(text) to authenticated;
