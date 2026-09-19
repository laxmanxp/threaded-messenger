import { useEffect, useMemo, useRef } from 'react'
import { conversationHue, conversationInitials, conversationTitle } from '../lib/conversation'
import { formatDayLabel } from '../lib/format'
import { useMessenger } from '../store/messengerStore'
import { Avatar } from './Avatar'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'

export function ChatView({
  onBack,
  onOpenThread,
}: {
  onBack: () => void
  onOpenThread: () => void
}) {
  const {
    state,
    currentUser,
    activeConversation,
    userById,
    topLevelMessages,
    replyCount,
    openThread,
    sendMessage,
  } = useMessenger()
  const scroller = useRef<HTMLDivElement>(null)

  const messages = useMemo(
    () =>
      activeConversation ? topLevelMessages(activeConversation.id) : [],
    [activeConversation, topLevelMessages],
  )

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, activeConversation?.id])

  if (!activeConversation) {
    return (
      <div className="chat-canvas grid h-full place-items-center px-8 text-center">
        <div>
          <p className="text-xl font-medium">Select a chat</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Pick a conversation from the list to start messaging.
          </p>
        </div>
      </div>
    )
  }

  const title = conversationTitle(
    activeConversation,
    state.users,
    currentUser.id,
  )
  const hue = conversationHue(activeConversation, state.users, currentUser.id)
  const initials = conversationInitials(
    activeConversation,
    state.users,
    currentUser.id,
  )
  const subtitle = activeConversation.isGroup
    ? activeConversation.participantIds
        .map((id) => userById(id)?.name.split(' ')[0])
        .filter(Boolean)
        .join(', ')
    : 'Tap Reply on any message to open a nested thread'

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-chat)]">
      <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--bg-hover)] md:hidden"
          aria-label="Back to chats"
        >
          ←
        </button>
        <Avatar initials={initials} hue={hue} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold">{title}</div>
          <div className="truncate text-[12.5px] text-[var(--text-muted)]">
            {subtitle}
          </div>
        </div>
      </header>
      <div
        ref={scroller}
        className="chat-canvas scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-8"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.map((msg, index) => {
            const day = formatDayLabel(msg.createdAt)
            const prev = messages[index - 1]
            const showDay = !prev || formatDayLabel(prev.createdAt) !== day
            const author = userById(msg.authorId)
            const isOwn = msg.authorId === currentUser.id
            const count = replyCount(msg.id)
            return (
              <div key={msg.id} className="flex flex-col gap-3">
                {showDay ? (
                  <div className="sticky top-1 z-10 mx-auto rounded-lg bg-[var(--bg-header)] px-3 py-1 text-[12.5px] text-[var(--text-muted)]">
                    {day}
                  </div>
                ) : null}
                <MessageBubble
                  message={msg}
                  author={author}
                  isOwn={isOwn}
                  showName={activeConversation.isGroup}
                  replyCount={count}
                  onReply={() => {
                    openThread(msg.id, msg.id)
                    onOpenThread()
                  }}
                  onOpenThread={() => {
                    openThread(msg.id)
                    onOpenThread()
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <Composer
        placeholder="Type a message"
        onSend={(body) => sendMessage(body, null)}
      />
    </div>
  )
}
