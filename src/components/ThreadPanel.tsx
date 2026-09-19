import { useEffect, useRef } from 'react'
import { formatClock } from '../lib/format'
import { useMessenger } from '../store/messengerStore'
import type { Message } from '../types'
import { Avatar } from './Avatar'
import { Composer } from './Composer'

function ThreadNode({
  message,
  depth,
}: {
  message: Message
  depth: number
}) {
  const {
    currentUser,
    userById,
    childMessages,
    state,
    toggleCollapse,
    setReplyTo,
    replyCount,
  } = useMessenger()
  const author = userById(message.authorId)
  const kids = childMessages(message.id)
  const collapsed = Boolean(state.collapsedIds[message.id])
  const isOwn = message.authorId === currentUser.id
  const isTarget = state.replyToId === message.id
  const count = replyCount(message.id)
  const indent = Math.min(depth, 8) * 14

  return (
    <div className="enter-msg" style={{ marginLeft: indent }}>
      <div
        className={`thread-indent rounded-r-lg pl-3 ${
          isTarget ? 'bg-[var(--accent-soft)]' : ''
        }`}
      >
        <div className="flex gap-2 py-2">
          <Avatar
            initials={author?.initials ?? '?'}
            hue={author?.hue ?? 160}
            size={28}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[13.5px] font-semibold">
                {isOwn ? 'You' : author?.name}
              </span>
              <span className="text-[11.5px] text-[var(--text-muted)]">
                {formatClock(message.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[14.2px] leading-[1.45] text-[var(--text)]">
              {message.body}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReplyTo(message.id)}
                className="text-[12.5px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)]"
              >
                Reply
              </button>
              {kids.length > 0 ? (
                <button
                  type="button"
                  onClick={() => toggleCollapse(message.id)}
                  className="text-[12.5px] text-[var(--accent)]"
                >
                  {collapsed
                    ? `Show ${count} ${count === 1 ? 'reply' : 'replies'}`
                    : 'Collapse'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {!collapsed
        ? kids.map((child) => (
            <ThreadNode key={child.id} message={child} depth={depth + 1} />
          ))
        : null}
    </div>
  )
}

export function ThreadPanel({ onClose }: { onClose: () => void }) {
  const {
    state,
    userById,
    childMessages,
    sendMessage,
    setReplyTo,
    currentUser,
    replyCount,
  } = useMessenger()
  const scroller = useRef<HTMLDivElement>(null)
  const root = state.messages.find((m) => m.id === state.activeThreadRootId)
  const replies = root ? childMessages(root.id) : []
  const rootAuthor = root ? userById(root.authorId) : undefined
  const replyTarget = state.replyToId
    ? state.messages.find((m) => m.id === state.replyToId)
    : null
  const replyAuthor = replyTarget ? userById(replyTarget.authorId) : undefined
  const contextLabel = replyTarget
    ? replyTarget.authorId === currentUser.id
      ? 'yourself'
      : (replyAuthor?.name ?? 'message')
    : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [replies.length, state.activeThreadRootId, state.messages.length])

  if (!root) return null

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[var(--border)] bg-[var(--bg-panel)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-2.5">
        <div>
          <div className="text-[16px] font-semibold">Thread</div>
          <div className="text-[12.5px] text-[var(--text-muted)]">
            {replies.length === 0
              ? 'No nested replies yet'
              : `${replyCount(root.id)} nested ${
                  replyCount(root.id) === 1 ? 'reply' : 'replies'
                }`}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--bg-hover)]"
          aria-label="Close thread"
        >
          ✕
        </button>
      </header>
      <div
        ref={scroller}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        <article className="mb-4 rounded-xl bg-[var(--bg-thread-card)] p-3">
          <div className="flex gap-2">
            <Avatar
              initials={rootAuthor?.initials ?? '?'}
              hue={rootAuthor?.hue ?? 160}
              size={36}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">
                  {root.authorId === currentUser.id ? 'You' : rootAuthor?.name}
                </span>
                <span className="text-[12px] text-[var(--text-muted)]">
                  {formatClock(root.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-[14.5px] leading-[1.45]">
                {root.body}
              </p>
            </div>
          </div>
        </article>
        {replies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
            <p className="font-medium">No replies yet</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Be the first to nest a comment under this message.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {replies.map((msg) => (
              <ThreadNode key={msg.id} message={msg} depth={0} />
            ))}
          </div>
        )}
      </div>
      <Composer
        placeholder="Reply in thread"
        contextLabel={contextLabel}
        autoFocus
        onClearContext={
          replyTarget && replyTarget.id !== root.id
            ? () => setReplyTo(root.id)
            : undefined
        }
        onSend={(body) => sendMessage(body, replyTarget?.id ?? root.id)}
      />
    </div>
  )
}
