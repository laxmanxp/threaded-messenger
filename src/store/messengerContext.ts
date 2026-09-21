import { createContext, useContext } from 'react'
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

export interface MessengerState {
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
}

export interface StoreApi {
  state: MessengerState
  currentUser: User
  activeConversation: Conversation | null
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
}

export const StoreContext = createContext<StoreApi | null>(null)

export function useMessenger(): StoreApi {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useMessenger must be used within MessengerProvider')
  return ctx
}
