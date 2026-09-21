import { createContext } from 'react'
import type { Session, User as AuthUser } from '@supabase/supabase-js'
import type {
  Attachment,
  Conversation,
  ConversationId,
  Message,
  MessageId,
  Theme,
  User,
  UserId,
} from '../types'
import type { OrgMember, OrgScreen, Organization } from './types'

export function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function memberToUser(m: OrgMember): User {
  return {
    id: m.user_id,
    name: m.name,
    handle: (m.email ?? m.name).split('@')[0].toLowerCase().replace(/\s+/g, ''),
    initials: initialsOf(m.name),
    hue: hueFromString(m.user_id),
  }
}

export interface OrgState {
  session: Session | null
  authUser: AuthUser | null
  organization: Organization | null
  membership: OrgMember | null
  members: OrgMember[]
  users: User[]
  conversations: Conversation[]
  messages: Message[]
  currentUserId: UserId
  activeConversationId: ConversationId | null
  activeThreadRootId: MessageId | null
  replyToId: MessageId | null
  lastReadAt: Record<UserId, Record<ConversationId, number>>
  theme: Theme
  collapsedIds: Record<MessageId, boolean>
  screen: OrgScreen
  loading: boolean
  error: string | null
  syncing: boolean
}

export interface OrgApi {
  state: OrgState
  configured: boolean
  currentUser: User
  activeConversation: Conversation | null
  isAdmin: boolean
  selectConversation: (id: ConversationId) => void
  openThread: (rootId: MessageId, replyToId?: MessageId) => void
  closeThread: () => void
  setReplyTo: (id: MessageId | null) => void
  sendMessage: (body: string, parentId: MessageId | null, attachments?: Attachment[]) => void
  switchUser: (id: UserId) => void
  toggleTheme: () => void
  toggleCollapse: (id: MessageId) => void
  resetDemo: () => void
  userById: (id: UserId) => User | undefined
  topLevelMessages: (conversationId: ConversationId) => Message[]
  childMessages: (parentId: MessageId) => Message[]
  replyCount: (rootId: MessageId) => number
  unreadCount: (conversationId: ConversationId) => number
  latestMessage: (conversationId: ConversationId) => Message | undefined
  setScreen: (s: OrgScreen) => void
  refresh: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  createOrg: (input: {
    name: string
    adminName: string
    designation?: string
    department?: string
    phone?: string
  }) => Promise<void>
  createInviteLink: () => Promise<string>
  createGroup: (name: string, memberUserIds: string[]) => Promise<void>
  updateMember: (
    memberId: string,
    patch: Partial<Pick<OrgMember, 'name' | 'designation' | 'department' | 'role' | 'email' | 'phone'>>,
  ) => Promise<void>
  clearError: () => void
}

export const OrgContext = createContext<OrgApi | null>(null)

export function defaultTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function childrenOf(messages: Message[], parentId: MessageId): Message[] {
  return messages
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function descendantsOf(messages: Message[], rootId: MessageId): Message[] {
  const byParent = new Map<MessageId, Message[]>()
  for (const msg of messages) {
    if (!msg.parentId) continue
    const list = byParent.get(msg.parentId) ?? []
    list.push(msg)
    byParent.set(msg.parentId, list)
  }
  const out: Message[] = []
  const stack = [...(byParent.get(rootId) ?? [])]
  while (stack.length) {
    const node = stack.pop()!
    out.push(node)
    const kids = byParent.get(node.id)
    if (kids) stack.push(...kids)
  }
  return out
}
