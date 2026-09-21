import { getSupabase } from '../lib/supabase'
import type { Attachment } from '../types'
import type {
  Invite,
  OrgAttachmentRow,
  OrgConversationRow,
  OrgMember,
  OrgMessageRow,
  Organization,
} from './types'

function sb() {
  const client = getSupabase()
  if (!client) throw new Error('Supabase is not configured')
  return client
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${base || 'org'}-${Math.random().toString(36).slice(2, 7)}`
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await sb().auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await sb().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await sb().auth.signOut()
  if (error) throw error
}

export async function getSessionUser() {
  const { data, error } = await sb().auth.getUser()
  if (error) throw error
  return data.user
}

export async function listMyMemberships(): Promise<(OrgMember & { organization: Organization })[]> {
  const { data, error } = await sb()
    .from('org_members')
    .select('*, organization:organizations(*)')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as (OrgMember & { organization: Organization })[]
}

export async function createOrganization(input: {
  name: string
  adminName: string
  designation?: string
  department?: string
  email?: string
  phone?: string
}): Promise<{ org: Organization; member: OrgMember }> {
  const user = await getSessionUser()
  if (!user) throw new Error('Sign in required')

  const slug = slugify(input.name)
  const { data: org, error: orgErr } = await sb()
    .from('organizations')
    .insert({
      name: input.name.trim(),
      slug,
      plan: 'free',
      is_paid: false,
      created_by: user.id,
    })
    .select('*')
    .single()
  if (orgErr) throw orgErr

  const { data: member, error: memErr } = await sb()
    .from('org_members')
    .insert({
      org_id: org.id,
      user_id: user.id,
      name: input.adminName.trim() || 'Admin',
      designation: input.designation?.trim() ?? 'Admin',
      department: input.department?.trim() ?? 'Leadership',
      role: 'admin',
      email: input.email ?? user.email ?? null,
      phone: input.phone ?? null,
    })
    .select('*')
    .single()
  if (memErr) throw memErr

  const { data: conv, error: convErr } = await sb()
    .from('conversations')
    .insert({
      org_id: org.id,
      name: 'General',
      is_group: true,
      hue: 160,
      created_by: user.id,
    })
    .select('*')
    .single()
  if (convErr) throw convErr

  const { error: cmErr } = await sb().from('conversation_members').insert({
    conversation_id: conv.id,
    user_id: user.id,
  })
  if (cmErr) throw cmErr

  return { org: org as Organization, member: member as OrgMember }
}

export async function listDirectory(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await sb()
    .from('org_members')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as OrgMember[]
}

export async function addMemberAsAdmin(
  orgId: string,
  input: {
    name: string
    designation: string
    department: string
    email?: string
    phone?: string
    role?: 'admin' | 'member'
  },
): Promise<Invite> {
  void input
  return createInvite(orgId)
}

export async function createInvite(orgId: string): Promise<Invite> {
  const user = await getSessionUser()
  if (!user) throw new Error('Sign in required')
  const { data, error } = await sb()
    .from('invites')
    .insert({
      org_id: orgId,
      created_by: user.id,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Invite
}

export async function getInviteByToken(token: string): Promise<(Invite & { organization: Organization }) | null> {
  const { data, error } = await sb().rpc('get_invite_info', { p_token: token })
  if (error) throw error
  if (!data) return null
  const row = data as {
    id: string
    token: string
    org_id: string
    expires_at: string
    used_at: string | null
    created_at: string
    organization: Pick<Organization, 'id' | 'name' | 'slug' | 'plan' | 'is_paid'>
  }
  return {
    id: row.id,
    org_id: row.org_id,
    token: row.token,
    created_by: null,
    expires_at: row.expires_at,
    used_at: row.used_at,
    used_by: null,
    created_at: row.created_at,
    organization: {
      id: row.organization.id,
      name: row.organization.name,
      slug: row.organization.slug,
      plan: row.organization.plan,
      is_paid: row.organization.is_paid,
      created_by: null,
      created_at: row.created_at,
    },
  }
}

export async function acceptInvite(
  token: string,
  profile: { name: string; designation: string; department: string; phone?: string },
): Promise<string> {
  const { data, error } = await sb().rpc('accept_invite', {
    p_token: token,
    p_name: profile.name,
    p_designation: profile.designation,
    p_department: profile.department,
    p_phone: profile.phone ?? null,
  })
  if (error) throw error
  return data as string
}

export async function updateMember(
  memberId: string,
  patch: Partial<Pick<OrgMember, 'name' | 'designation' | 'department' | 'role' | 'email' | 'phone'>>,
) {
  const { data, error } = await sb()
    .from('org_members')
    .update(patch)
    .eq('id', memberId)
    .select('*')
    .single()
  if (error) throw error
  return data as OrgMember
}

export async function createGroupConversation(
  orgId: string,
  name: string,
  memberUserIds: string[],
): Promise<OrgConversationRow> {
  const user = await getSessionUser()
  if (!user) throw new Error('Sign in required')
  const hue = Math.floor(Math.random() * 360)
  const { data: conv, error } = await sb()
    .from('conversations')
    .insert({
      org_id: orgId,
      name: name.trim(),
      is_group: true,
      hue,
      created_by: user.id,
    })
    .select('*')
    .single()
  if (error) throw error

  const ids = Array.from(new Set([user.id, ...memberUserIds]))
  const { error: cmErr } = await sb().from('conversation_members').insert(
    ids.map((uid) => ({ conversation_id: conv.id, user_id: uid })),
  )
  if (cmErr) throw cmErr
  return conv as OrgConversationRow
}

export async function listConversations(orgId: string): Promise<OrgConversationRow[]> {
  const { data, error } = await sb()
    .from('conversations')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as OrgConversationRow[]
}

export async function listMessages(conversationIds: string[]): Promise<OrgMessageRow[]> {
  if (!conversationIds.length) return []
  const { data, error } = await sb()
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as OrgMessageRow[]
}

export async function listAttachments(messageIds: string[]): Promise<OrgAttachmentRow[]> {
  if (!messageIds.length) return []
  const { data, error } = await sb()
    .from('attachments')
    .select('*')
    .in('message_id', messageIds)
  if (error) throw error
  return (data ?? []) as OrgAttachmentRow[]
}

export async function signedUrlForPath(path: string): Promise<string> {
  const { data, error } = await sb().storage.from('attachments').createSignedUrl(path, 60 * 60 * 24)
  if (error) throw error
  return data.signedUrl
}

export async function sendOrgMessage(input: {
  conversationId: string
  body: string
  parentId: string | null
  files: File[]
}): Promise<{ message: OrgMessageRow; attachments: Attachment[] }> {
  const user = await getSessionUser()
  if (!user) throw new Error('Sign in required')

  const { data: message, error } = await sb()
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      author_id: user.id,
      parent_id: input.parentId,
      body: input.body,
    })
    .select('*')
    .single()
  if (error) throw error

  const attachments: Attachment[] = []
  for (const file of input.files) {
    const kind = file.type.startsWith('image/') ? 'image' : 'file'
    const path = `${user.id}/${message.id}/${crypto.randomUUID()}-${file.name}`
    const { error: upErr } = await sb().storage.from('attachments').upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (upErr) throw upErr

    const { data: row, error: attErr } = await sb()
      .from('attachments')
      .insert({
        message_id: message.id,
        name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size: file.size,
        kind,
        storage_path: path,
      })
      .select('*')
      .single()
    if (attErr) throw attErr

    const url = await signedUrlForPath(path)
    attachments.push({
      id: row.id,
      name: row.name,
      mimeType: row.mime_type,
      size: row.size,
      kind: row.kind as 'image' | 'file',
      dataUrl: url,
    })
  }

  return { message: message as OrgMessageRow, attachments }
}

export function inviteUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/join/${token}`
}
