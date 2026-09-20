import { formatClock } from '../lib/format'
import type { Message, User } from '../types'
import { MessageAttachments } from './Attachments'

export function MessageBubble({
  message,
  author,
  isOwn,
  showName,
  replyCount,
  onReply,
  onOpenThread,
}: {
  message: Message
  author?: User
  isOwn: boolean
  showName: boolean
  replyCount: number
  onReply: () => void
  onOpenThread: () => void
}) {
  return (
    <div
      className={`enter-msg group flex max-w-[min(88%,640px)] flex-col ${
        isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
      }`}
    >
      <div
        className={`bubble relative rounded-lg px-2.5 pb-1.5 pt-1.5 ${
          isOwn ? 'bubble-own rounded-tr-none' : 'bubble-other rounded-tl-none'
        }`}
      >
        {showName && !isOwn && author ? (
          <div
            className="mb-0.5 text-[13px] font-semibold"
            style={{ color: `hsl(${author.hue} 70% 62%)` }}
          >
            {author.name}
          </div>
        ) : null}
        {message.body ? (
          <p className="whitespace-pre-wrap break-words text-[14.8px] leading-[1.45]">
            {message.body}
          </p>
        ) : null}
        <MessageAttachments items={message.attachments ?? []} />
        <div className="mt-0.5 flex items-center justify-end gap-2 text-[11px] text-[var(--text-muted)]">
          <span>{formatClock(message.createdAt)}</span>
        </div>
      </div>
      <div
        className={`mt-1 flex flex-wrap items-center gap-1 text-[13px] ${
          isOwn ? 'justify-end' : ''
        }`}
      >
        <button
          type="button"
          onClick={onReply}
          className="min-h-11 rounded-md px-3 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]"
        >
          Reply
        </button>
        {replyCount > 0 ? (
          <button
            type="button"
            onClick={onOpenThread}
            className="min-h-11 rounded-md bg-[var(--accent-soft)] px-3 font-medium text-[var(--accent)] hover:brightness-110"
          >
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
