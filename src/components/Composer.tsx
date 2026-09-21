import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import {
  filesToAttachments,
  MAX_ATTACHMENTS,
} from '../lib/attachments'
import type { Attachment } from '../types'
import { PendingAttachments } from './Attachments'

export function Composer({
  placeholder,
  contextLabel,
  onClearContext,
  onSend,
  autoFocus,
}: {
  placeholder: string
  contextLabel?: string | null
  onClearContext?: () => void
  onSend: (body: string, attachments: Attachment[]) => void
  autoFocus?: boolean
}) {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState<Attachment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus, contextLabel])

  async function addFiles(fileList: FileList | File[]) {
    setBusy(true)
    const { attachments, errors } = await filesToAttachments(fileList, pending.length)
    setPending((cur) => [...cur, ...attachments])
    setError(errors[0] ?? null)
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function submit() {
    const body = value.trim()
    if (!body && !pending.length) return
    onSend(body, pending)
    setValue('')
    setPending([])
    setError(null)
    const el = ref.current
    if (el) el.style.height = 'auto'
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files)
  }

  return (
    <div
      className={`border-t border-[var(--border)] bg-[var(--bg-composer)] px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] ${
        dragging ? 'outline outline-2 outline-[var(--accent)] outline-offset-[-2px]' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {contextLabel ? (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[var(--accent-soft)] px-3 py-1.5 text-[13px] text-[var(--accent)]">
          <span className="min-w-0 truncate">
            Replying to <strong className="font-semibold">{contextLabel}</strong>
          </span>
          {onClearContext ? (
            <button
              type="button"
              onClick={onClearContext}
              className="shrink-0 rounded px-1 text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear reply target"
            >
              ✕
            </button>
          ) : null}
        </div>
      ) : null}
      <PendingAttachments
        items={pending}
        onRemove={(id) => setPending((cur) => cur.filter((a) => a.id !== id))}
      />
      {error ? (
        <p className="mb-2 text-[12.5px] text-[var(--danger)]">{error}</p>
      ) : null}
      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files)
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || pending.length >= MAX_ATTACHMENTS}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] disabled:opacity-40"
          aria-label="Attach files"
          title="Attach files"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
          </svg>
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            const el = e.target
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 140)}px`
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="min-h-12 max-h-[140px] flex-1 resize-none rounded-lg border-0 bg-[var(--bg-sidebar)] px-3 py-2.5 text-[16px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] md:min-h-[44px] md:text-[15px]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || (!value.trim() && !pending.length)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white transition enabled:hover:brightness-110 disabled:opacity-40"
          aria-label="Send"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
