import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../../lib/supabase'
import * as api from '../../org/orgApi'
import type { Invite, Organization } from '../../org/types'
import { getSupabase } from '../../lib/supabase'

export function JoinScreen({
  token,
  onJoined,
  onNeedAuth,
}: {
  token: string
  onJoined: (orgId: string) => void
  onNeedAuth: () => void
}) {
  const [invite, setInvite] = useState<(Invite & { organization: Organization }) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    void (async () => {
      try {
        const user = await api.getSessionUser()
        setAuthed(Boolean(user))
        if (user) {
          setName(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '')
        }
        const inv = await api.getInviteByToken(token)
        if (!inv) setError('Invite not found')
        else if (inv.used_at) setError('This invite was already used')
        else if (new Date(inv.expires_at).getTime() < Date.now()) setError('This invite has expired')
        else setInvite(inv)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invite')
      }
    })()
    const client = getSupabase()
    if (!client) return
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      setAuthed(Boolean(session))
    })
    return () => sub.subscription.unsubscribe()
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!authed) {
      onNeedAuth()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const orgId = await api.acceptInvite(token, {
        name: name.trim() || 'Member',
        designation: designation.trim(),
        department: department.trim(),
        phone: phone.trim() || undefined,
      })
      onJoined(orgId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell flex min-h-0 flex-col items-center justify-center bg-[var(--bg-app)] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6"
      >
        <h1 className="text-xl font-semibold">Join organization</h1>
        {invite ? (
          <p className="text-sm text-[var(--text-muted)]">
            You are joining <strong className="text-[var(--text)]">{invite.organization.name}</strong>
          </p>
        ) : null}
        {!authed ? (
          <p className="rounded-lg bg-[var(--bg-search)] p-3 text-sm">
            Sign in or create an account first, then return to this invite link.
          </p>
        ) : (
          <>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--text-muted)]">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-11 w-full rounded-lg bg-[var(--bg-search)] px-3 text-[16px] outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--text-muted)]">Designation</span>
                <input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="min-h-11 w-full rounded-lg bg-[var(--bg-search)] px-3 text-[16px] outline-none"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--text-muted)]">Department</span>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="min-h-11 w-full rounded-lg bg-[var(--bg-search)] px-3 text-[16px] outline-none"
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--text-muted)]">Phone (optional)</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-h-11 w-full rounded-lg bg-[var(--bg-search)] px-3 text-[16px] outline-none"
              />
            </label>
          </>
        )}
        {error ? (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy || Boolean(error && !invite)}
          className="min-h-11 w-full rounded-lg bg-[var(--accent)] font-semibold text-white disabled:opacity-60"
        >
          {!authed ? 'Sign in to continue' : busy ? 'Joining…' : 'Join organization'}
        </button>
      </form>
    </div>
  )
}
