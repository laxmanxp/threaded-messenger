import { useState } from 'react'
import { useOrg } from '../../org/OrgProvider'

export function CreateOrgScreen() {
  const { createOrg, signOut, state, clearError } = useOrg()
  const [name, setName] = useState('')
  const [adminName, setAdminName] = useState(state.authUser?.user_metadata?.display_name ?? '')
  const [designation, setDesignation] = useState('Admin')
  const [department, setDepartment] = useState('Leadership')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setBusy(true)
    try {
      await createOrg({
        name: name.trim(),
        adminName: adminName.trim() || 'Admin',
        designation,
        department,
      })
    } catch {
      /* surfaced */
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
        <h1 className="text-xl font-semibold">Create your organization</h1>
        <p className="text-sm text-[var(--text-muted)]">
          You will be the admin. Invite teammates with a link after setup. Plan:{' '}
          <span className="font-medium text-[var(--text)]">free</span> (paid stub ready later).
        </p>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--text-muted)]">Organization name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 w-full rounded-lg bg-[var(--bg-search)] px-3 text-[16px] outline-none"
            placeholder="Acme Corp"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--text-muted)]">Your name</span>
          <input
            required
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
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
        {state.error ? (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-lg bg-[var(--accent)] font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create organization'}
        </button>
        <button type="button" onClick={() => void signOut()} className="w-full text-sm text-[var(--text-muted)]">
          Sign out
        </button>
      </form>
    </div>
  )
}
