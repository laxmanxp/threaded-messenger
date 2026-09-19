import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

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
  onSend: (body: string) => void
  autoFocus?: boolean
}) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus, contextLabel])

  function submit() {
    const body = value.trim()
    if (!body) return
    onSend(body)
    setValue('')
    const el = ref.current
    if (el) el.style.height = 'auto'
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-composer)] px-3 py-2.5">
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
      <div className="flex items-end gap-2">
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
          className="max-h-[140px] min-h-[44px] flex-1 resize-none rounded-lg border-0 bg-[var(--bg-sidebar)] px-3 py-2.5 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white transition enabled:hover:brightness-110 disabled:opacity-40"
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
