import { useEffect, useMemo, useState } from 'react'
import { LocalDemoApp } from './components/LocalDemoApp'
import { AuthScreen } from './components/org/AuthScreen'
import { CreateOrgScreen } from './components/org/CreateOrgScreen'
import { JoinScreen } from './components/org/JoinScreen'
import { OrgChatShell } from './components/org/OrgChatShell'
import { SetupScreen } from './components/org/SetupScreen'
import { supabaseConfigured } from './lib/supabase'
import { OrgProvider, useOrg } from './org/OrgProvider'
import { MessengerProvider } from './store/messengerStore'

type AppMode = 'demo' | 'org'

function joinTokenFromPath(): string | null {
  if (typeof window === 'undefined') return null
  const m = window.location.pathname.match(/^\/join\/([^/]+)\/?$/)
  return m ? decodeURIComponent(m[1]) : null
}

function OrgRoot({
  onDemo,
}: {
  onDemo: () => void
}) {
  const org = useOrg()
  const token = useMemo(() => joinTokenFromPath(), [])
  const [joinDone, setJoinDone] = useState(false)

  useEffect(() => {
    if (joinDone && token) {
      window.history.replaceState({}, '', '/')
    }
  }, [joinDone, token])

  if (org.state.loading) {
    return (
      <div className="app-shell grid place-items-center bg-[var(--bg-app)] text-sm text-[var(--text-muted)]">
        Loading…
      </div>
    )
  }

  if (token && !joinDone) {
    if (!org.state.authUser) {
      return <AuthScreen onDemo={onDemo} />
    }
    return (
      <JoinScreen
        token={token}
        onNeedAuth={() => undefined}
        onJoined={async () => {
          setJoinDone(true)
          await org.refresh()
        }}
      />
    )
  }

  if (!org.state.authUser) {
    return <AuthScreen onDemo={onDemo} />
  }

  if (org.state.screen === 'create-org' || !org.state.organization) {
    return <CreateOrgScreen />
  }

  return <OrgChatShell />
}

export default function App() {
  const [mode, setMode] = useState<AppMode>(() => {
    if (joinTokenFromPath()) return 'org'
    if (!supabaseConfigured) return 'demo'
    const saved = localStorage.getItem('threadly:mode')
    return saved === 'org' ? 'org' : 'demo'
  })

  useEffect(() => {
    localStorage.setItem('threadly:mode', mode)
  }, [mode])

  // Missing env: show setup, allow demo without crashing
  if (!supabaseConfigured && mode === 'org') {
    return (
      <SetupScreen
        onContinueDemo={() => {
          setMode('demo')
        }}
      />
    )
  }

  if (mode === 'demo') {
    return (
      <MessengerProvider>
        <LocalDemoApp
          onSwitchToOrg={
            supabaseConfigured
              ? () => setMode('org')
              : () => {
                  setMode('org')
                }
          }
        />
      </MessengerProvider>
    )
  }

  return (
    <OrgProvider>
      <OrgRoot onDemo={() => setMode('demo')} />
    </OrgProvider>
  )
}
