import { useState } from 'react'
import { fileIconLabel, formatBytes } from '../lib/attachments'
import type { Attachment } from '../types'

function FileChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment
  onRemove?: () => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[var(--bg-sidebar)] px-2 py-1.5">
      {attachment.kind === 'image' ? (
        <img
          src={attachment.dataUrl}
          alt=""
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">
          {fileIconLabel(attachment.name, attachment.mimeType)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium">{attachment.name}</div>
        <div className="text-[11px] text-[var(--text-muted)]">
          {formatBytes(attachment.size)}
        </div>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          aria-label={`Remove ${attachment.name}`}
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}

export function PendingAttachments({
  items,
  onRemove,
}: {
  items: Attachment[]
  onRemove: (id: string) => void
}) {
  if (!items.length) return null
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {items.map((att) => (
        <div key={att.id} className="min-w-0 max-w-full flex-[1_1_12rem]">
          <FileChip attachment={att} onRemove={() => onRemove(att.id)} />
        </div>
      ))}
    </div>
  )
}

function ImageLightbox({
  attachment,
  onClose,
}: {
  attachment: Attachment
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={attachment.name}
      onClick={onClose}
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-white">
        <span className="min-w-0 truncate text-sm">{attachment.name}</span>
        <div className="flex items-center gap-2">
          <a
            href={attachment.dataUrl}
            download={attachment.name}
            onClick={(e) => e.stopPropagation()}
            className="rounded-md bg-white/15 px-3 py-1 text-sm hover:bg-white/25"
          >
            Download
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/15 px-3 py-1 text-sm hover:bg-white/25"
          >
            Close
          </button>
        </div>
      </div>
      <img
        src={attachment.dataUrl}
        alt={attachment.name}
        className="mx-auto max-h-[calc(100vh-80px)] max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function ImageThumb({ attachment }: { attachment: Attachment }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block overflow-hidden rounded-md"
      >
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="max-h-52 max-w-full object-cover"
        />
      </button>
      {open ? (
        <ImageLightbox attachment={attachment} onClose={() => setOpen(false)} />
      ) : null}
    </>
  )
}

function FileCard({ attachment }: { attachment: Attachment }) {
  return (
    <a
      href={attachment.dataUrl}
      download={attachment.name}
      className="flex min-w-[180px] items-center gap-2 rounded-md bg-[color-mix(in_srgb,var(--text)_10%,transparent)] px-2 py-2 no-underline"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">
        {fileIconLabel(attachment.name, attachment.mimeType)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-[var(--text)]">
          {attachment.name}
        </span>
        <span className="block text-[11px] text-[var(--text-muted)]">
          {formatBytes(attachment.size)}
        </span>
      </span>
    </a>
  )
}

export function MessageAttachments({ items }: { items: Attachment[] }) {
  if (!items?.length) return null
  const images = items.filter((a) => a.kind === 'image')
  const files = items.filter((a) => a.kind !== 'image')
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {images.length ? (
        <div className={`grid gap-1 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((att) => (
            <ImageThumb key={att.id} attachment={att} />
          ))}
        </div>
      ) : null}
      {files.map((att) => (
        <FileCard key={att.id} attachment={att} />
      ))}
    </div>
  )
}
