import { useOrg } from '../../org/OrgProvider'
import { Avatar } from '../Avatar'

function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function DirectoryScreen({ onBack }: { onBack: () => void }) {
  const { state } = useOrg()
  const members = state.members

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-sidebar)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 min-w-11 rounded-md text-[var(--text)] hover:bg-[var(--bg-hover)] md:hidden"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Directory</div>
          <div className="truncate text-xs text-[var(--text-muted)]">
            {state.organization?.name ?? 'Organization'} · {members.length} people
          </div>
        </div>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3"
          >
            <Avatar initials={initialsOf(m.name)} hue={hueFromString(m.user_id)} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium">{m.name}</span>
                <span className="rounded-full bg-[var(--bg-search)] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  {m.role}
                </span>
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                {m.designation || '—'}
                {m.department ? ` · ${m.department}` : ''}
              </div>
              <div className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
                {m.email ? <div>{m.email}</div> : null}
                {m.phone ? <div>{m.phone}</div> : null}
              </div>
            </div>
          </div>
        ))}
        {!members.length ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No members yet.</p>
        ) : null}
      </div>
    </div>
  )
}
