import { useMemo, useState } from 'react'
import { useOrg } from '../../org/OrgProvider'

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const { state, createInviteLink, createGroup, updateMember, isAdmin } = useOrg()
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const others = useMemo(
    () => state.members.filter((m) => m.user_id !== state.currentUserId),
    [state.members, state.currentUserId],
  )

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Only admins can manage the organization.</p>
        <button type="button" onClick={onBack} className="text-[var(--accent)]">
          Back to chats
        </button>
      </div>
    )
  }

  async function onInvite() {
    setBusy(true)
    setError(null)
    try {
      const url = await createInviteLink()
      setInviteLink(url)
      await navigator.clipboard?.writeText(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setBusy(false)
    }
  }

  async function onCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const ids = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([id]) => id)
      await createGroup(groupName.trim() || 'New group', ids)
      setGroupName('')
      setSelected({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-sidebar)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 min-w-11 rounded-md hover:bg-[var(--bg-hover)] md:hidden"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Admin</div>
          <div className="truncate text-xs text-[var(--text-muted)]">
            {state.organization?.name} · plan {state.organization?.plan ?? 'free'}
            {state.organization?.is_paid ? ' · paid' : ' · free stub'}
          </div>
        </div>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {error ? (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400">{error}</p>
        ) : null}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Invite link</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Share a one-time link. New members join the org, appear in the directory, and get existing
            group chats with history.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onInvite()}
            className="min-h-11 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Generate & copy invite
          </button>
          {inviteLink ? (
            <p className="break-all rounded-lg bg-[var(--bg-search)] p-3 text-xs">{inviteLink}</p>
          ) : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Members</h2>
          <ul className="space-y-2">
            {state.members.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3 text-sm"
              >
                <div className="font-medium">
                  {m.name}{' '}
                  <span className="text-xs text-[var(--text-muted)]">({m.role})</span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <input
                    defaultValue={m.designation}
                    placeholder="Designation"
                    className="min-h-10 rounded-md bg-[var(--bg-search)] px-2 text-[14px] outline-none"
                    onBlur={(e) => {
                      if (e.target.value !== m.designation) {
                        void updateMember(m.id, { designation: e.target.value })
                      }
                    }}
                  />
                  <input
                    defaultValue={m.department}
                    placeholder="Department"
                    className="min-h-10 rounded-md bg-[var(--bg-search)] px-2 text-[14px] outline-none"
                    onBlur={(e) => {
                      if (e.target.value !== m.department) {
                        void updateMember(m.id, { department: e.target.value })
                      }
                    }}
                  />
                  <select
                    defaultValue={m.role}
                    className="min-h-10 rounded-md bg-[var(--bg-search)] px-2 text-[14px] outline-none"
                    onChange={(e) =>
                      void updateMember(m.id, { role: e.target.value as 'admin' | 'member' })
                    }
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">New group conversation</h2>
          <form onSubmit={onCreateGroup} className="space-y-2">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="min-h-11 w-full rounded-lg bg-[var(--bg-search)] px-3 text-[16px] outline-none"
            />
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
              {others.map((m) => (
                <label key={m.user_id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[m.user_id])}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, [m.user_id]: e.target.checked }))
                    }
                  />
                  {m.name}
                </label>
              ))}
              {!others.length ? (
                <p className="text-xs text-[var(--text-muted)]">Invite people first.</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-lg border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--bg-hover)] disabled:opacity-60"
            >
              Create group
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
