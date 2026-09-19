export type UserId = string
export type ConversationId = string
export type MessageId = string
export type Theme = 'light' | 'dark'
export type MobilePane = 'list' | 'chat' | 'thread'

export interface User {
  id: UserId
  name: string
  handle: string
  initials: string
  hue: number
}

export interface Conversation {
  id: ConversationId
  name: string
  participantIds: UserId[]
  isGroup: boolean
  hue: number
}

export interface Message {
  id: MessageId
  conversationId: ConversationId
  authorId: UserId
  parentId: MessageId | null
  body: string
  createdAt: number
}

export interface MessengerSnapshot {
  version: number
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
