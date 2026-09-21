import { useState } from 'react'
import { useOrg } from '../../org/OrgProvider'

export function AuthScreen({ onDemo }: { onDemo?: () => void }) {
  const { signIn, signUp, state, clearError } = useOrg()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setBusy(true)
    try {
      if (mode === 'in') await signIn(email.trim(), password)
      else await signUp(email.trim(), password, name.trim() || email.split('@')[0])
    } catch {
      /* error on state */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell flex min-h-0 flex-col items-center justify-center bg-[var(--bg-app)] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-lg"
      >
        <div className="space-y-1 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent)] font-bold text-white">
            T
          </div>
          <h1 className="text-xl font-semibold">{mode === 'in' ? 'Sign in' : 'Create account'}</h1>
          <p className="text-sm text-[var(--text-muted)]">Organization mode · Threadly cloud</p>
        </div>
        {mode === 'up' ? (
          <label className="block space-y-1 text-left text-sm">
            <span className="text-[var(--text-muted)]">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-11 w-full rounded-lg border-0 bg-[var(--bg-search)] px-3 text-[16px] outline-none"
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="block space-y-1 text-left text-sm">
          <span className="text-[var(--text-muted)]">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full rounded-lg border-0 bg-[var(--bg-search)] px-3 text-[16px] outline-none"
            autoComplete="email"
          />
        </label>
        <label className="block space-y-1 text-left text-sm">
          <span className="text-[var(--text-muted)]">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 w-full rounded-lg border-0 bg-[var(--bg-search)] px-3 text-[16px] outline-none"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          />
        </label>
        {state.error ? (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-lg bg-[var(--accent)] text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          type="button"
          className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          onClick={() => {
            clearError()
            setMode(mode === 'in' ? 'up' : 'in')
          }}
        >
          {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
        {onDemo ? (
          <button
            type="button"
            onClick={onDemo}
            className="w-full text-sm text-[var(--accent)] hover:underline"
          >
            Use local demo instead
          </button>
        ) : null}
      </form>
    </div>
  )
}
