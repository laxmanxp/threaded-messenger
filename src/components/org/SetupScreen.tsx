export function SetupScreen({ onContinueDemo }: { onContinueDemo: () => void }) {
  return (
    <div className="app-shell flex min-h-0 flex-col items-center justify-center gap-6 bg-[var(--bg-app)] px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent)] text-xl font-bold text-white">
        T
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Connect Supabase for org mode</h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Organization sync needs a free Supabase project. Copy <code className="rounded bg-[var(--bg-search)] px-1">.env.example</code> to{' '}
          <code className="rounded bg-[var(--bg-search)] px-1">.env</code>, set{' '}
          <code className="rounded bg-[var(--bg-search)] px-1">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-[var(--bg-search)] px-1">VITE_SUPABASE_ANON_KEY</code>, then run the SQL in{' '}
          <code className="rounded bg-[var(--bg-search)] px-1">supabase/migrations/001_org_cloud.sql</code>.
        </p>
      </div>
      <button
        type="button"
        onClick={onContinueDemo}
        className="min-h-11 rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:opacity-90"
      >
        Continue with local demo
      </button>
    </div>
  )
}
