import type { Conversation, User, UserId } from '../types'

export function conversationTitle(
  conversation: Conversation,
  users: User[],
  currentUserId: UserId,
): string {
  if (conversation.isGroup) return conversation.name
  const other = users.find(
    (u) => conversation.participantIds.includes(u.id) && u.id !== currentUserId,
  )
  return other?.name ?? conversation.name
}

export function conversationHue(
  conversation: Conversation,
  users: User[],
  currentUserId: UserId,
): number {
  if (conversation.isGroup) return conversation.hue
  const other = users.find(
    (u) => conversation.participantIds.includes(u.id) && u.id !== currentUserId,
  )
  return other?.hue ?? conversation.hue
}

export function conversationInitials(
  conversation: Conversation,
  users: User[],
  currentUserId: UserId,
): string {
  if (conversation.isGroup) {
    return conversation.name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  const other = users.find(
    (u) => conversation.participantIds.includes(u.id) && u.id !== currentUserId,
  )
  return other?.initials ?? '?'
}
