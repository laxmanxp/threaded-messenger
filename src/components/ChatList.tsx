import { useMemo, useState } from 'react'
import { conversationHue, conversationInitials, conversationTitle } from '../lib/conversation'
import { previewAttachments } from '../lib/attachments'
import { formatListTime } from '../lib/format'
import { useMessenger } from '../store/messengerStore'
import { Avatar } from './Avatar'

export function ChatList({
  onOpenChat,
}: {
  onOpenChat: () => void
}) {
  const {
    state,
    currentUser,
    selectConversation,
    userById,
    latestMessage,
    unreadCount,
  } = useMessenger()
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.conversations
      .map((conv) => {
        const title = conversationTitle(conv, state.users, currentUser.id)
        const latest = latestMessage(conv.id)
        return {
          conv,
          title,
          latest,
          unread: unreadCount(conv.id),
          hue: conversationHue(conv, state.users, currentUser.id),
          initials: conversationInitials(conv, state.users, currentUser.id),
        }
      })
      .filter((row) => {
        if (!q) return true
        const author = row.latest ? userById(row.latest.authorId)?.name : ''
        const attNames = (row.latest?.attachments ?? [])
          .map((a) => a.name)
          .join(' ')
        return (
          row.title.toLowerCase().includes(q) ||
          (row.latest?.body ?? '').toLowerCase().includes(q) ||
          attNames.toLowerCase().includes(q) ||
          (author ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (b.latest?.createdAt ?? 0) - (a.latest?.createdAt ?? 0))
  }, [
    state.conversations,
    state.users,
    currentUser.id,
    query,
    latestMessage,
    unreadCount,
    userById,
  ])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-sidebar)]">
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-header)] px-4 py-3">
        <Avatar
          initials={currentUser.initials}
          hue={currentUser.hue}
          size={40}
          title={currentUser.name}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold">{currentUser.name}</div>
          <div className="text-[12.5px] text-[var(--text-muted)]">@{currentUser.handle}</div>
        </div>
      </div>
      <div className="px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or start a new chat"
          className="min-h-11 w-full rounded-lg border-0 bg-[var(--bg-search)] px-3 py-2 text-[16px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] md:text-[14px]"
        />
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            No chats match that search.
          </p>
        ) : (
          rows.map((row) => {
            const active = state.activeConversationId === row.conv.id
            const latest = row.latest
            const author =
              latest && latest.authorId !== currentUser.id
                ? userById(latest.authorId)?.name.split(' ')[0]
                : latest
                  ? 'You'
                  : null
            const nested = latest?.parentId ? '↳ ' : ''
            return (
              <button
                key={row.conv.id}
                type="button"
                onClick={() => {
                  selectConversation(row.conv.id)
                  onOpenChat()
                }}
                className={`flex min-h-[64px] w-full items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-left transition ${
                  active ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Avatar initials={row.initials} hue={row.hue} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[16px] font-medium">{row.title}</span>
                    <span className="shrink-0 text-[12px] text-[var(--text-muted)]">
                      {latest ? formatListTime(latest.createdAt) : ''}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p
                      className={`min-w-0 flex-1 truncate text-[13.5px] ${
                        row.unread
                          ? 'font-medium text-[var(--text)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {latest
                        ? `${nested}${author ? `${author}: ` : ''}${previewAttachments(latest)}`
                        : 'No messages yet'}
                    </p>
                    {row.unread > 0 ? (
                      <span className="grid min-w-[20px] place-items-center rounded-full bg-[var(--unread)] px-1.5 text-[11px] font-semibold text-[#111b21]">
                        {row.unread > 99 ? '99+' : row.unread}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
