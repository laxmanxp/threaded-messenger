export type OrgRole = 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  is_paid: boolean
  created_by: string | null
  created_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  name: string
  designation: string
  department: string
  role: OrgRole
  email: string | null
  phone: string | null
  created_at: string
}

export interface Invite {
  id: string
  org_id: string
  token: string
  created_by: string | null
  expires_at: string
  used_at: string | null
  used_by: string | null
  created_at: string
}

export interface OrgConversationRow {
  id: string
  org_id: string
  name: string
  is_group: boolean
  hue: number
  created_by: string | null
  created_at: string
}

export interface OrgMessageRow {
  id: string
  conversation_id: string
  author_id: string
  parent_id: string | null
  body: string
  created_at: string
}

export interface OrgAttachmentRow {
  id: string
  message_id: string
  name: string
  mime_type: string
  size: number
  kind: 'image' | 'file'
  storage_path: string
  created_at: string
}

export type OrgScreen =
  | 'chats'
  | 'directory'
  | 'admin'
  | 'create-org'
  | 'auth'
