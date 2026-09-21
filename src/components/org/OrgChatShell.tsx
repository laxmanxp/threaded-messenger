import { createElement, useEffect, useRef, useState } from 'react'
import { ChatList } from '../ChatList'
import { ChatView } from '../ChatView'
import { ThreadPanel } from '../ThreadPanel'
import { useMediaQuery } from '../../lib/media'
import { StoreContext, type StoreApi } from '../../store/messengerContext'
import { useOrg, useOrgAsMessenger } from '../../org/OrgProvider'
import type { MobilePane } from '../../types'
import { DirectoryScreen } from './DirectoryScreen'
import { AdminPanel } from './AdminPanel'

function OrgMessengerBridge({ children }: { children: React.ReactNode }) {
  const api = useOrgAsMessenger() as StoreApi
  return createElement(StoreContext.Provider, { value: api }, children)
}

export function OrgChatShell() {
  const org = useOrg()
  const { state, toggleTheme, closeThread, replyCount, setScreen, signOut } = org
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')
  const [pane, setPane] = useState<MobilePane>('chat')
  const [threadSheet, setThreadSheet] = useState(false)
  const wasLg = useRef(isLg)
  const threadOpen = Boolean(state.activeThreadRootId)
  const threadReplies = state.activeThreadRootId ? replyCount(state.activeThreadRootId) : 0

  useEffect(() => {
    if (!threadOpen) setThreadSheet(false)
  }, [threadOpen])

  useEffect(() => {
    if (wasLg.current && !isLg && threadOpen) setThreadSheet(true)
    wasLg.current = isLg
  }, [isLg, threadOpen])

  if (state.screen === 'directory') {
    return (
      <div className="app-shell flex min-h-0 flex-col bg-[var(--bg-app)]">
        <OrgTopBar />
        <div className="min-h-0 flex-1">
          <DirectoryScreen onBack={() => setScreen('chats')} />
        </div>
      </div>
    )
  }

  if (state.screen === 'admin') {
    return (
      <div className="app-shell flex min-h-0 flex-col bg-[var(--bg-app)]">
        <OrgTopBar />
        <div className="min-h-0 flex-1">
          <AdminPanel onBack={() => setScreen('chats')} />
        </div>
      </div>
    )
  }

  const showList = isMd || pane === 'list'
  const showChat = isMd || pane === 'chat'
  const showThreadColumn = isLg && threadOpen
  const showThreadSheet = !isLg && threadOpen && threadSheet
  const gridCols = showThreadColumn
    ? 'md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(280px,380px)]'
    : 'md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]'

  return (
    <OrgMessengerBridge>
      <div className="app-shell flex min-h-0 flex-col bg-[var(--bg-app)]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-1.5 pt-[max(0.35rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
              T
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-wide">
                {state.organization?.name ?? 'Threadly'}
              </div>
              <div className="hidden truncate text-[11px] text-[var(--text-muted)] sm:block">
                Org cloud · nested threads
                {state.syncing ? ' · syncing…' : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScreen('directory')}
            className="min-h-11 rounded-md px-2 text-[13px] hover:bg-[var(--bg-hover)]"
          >
            Directory
          </button>
          {org.isAdmin ? (
            <button
              type="button"
              onClick={() => setScreen('admin')}
              className="min-h-11 rounded-md px-2 text-[13px] hover:bg-[var(--bg-hover)]"
            >
              Admin
            </button>
          ) : null}
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-11 min-w-11 rounded-md px-2 text-[13px] hover:bg-[var(--bg-hover)]"
          >
            {state.theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="min-h-11 rounded-md px-2 text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
          >
            Sign out
          </button>
        </div>

        {state.error ? (
          <div className="bg-red-500/15 px-3 py-2 text-center text-sm text-red-400">{state.error}</div>
        ) : null}

        <div className={`grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden ${gridCols}`}>
          <section
            className={`min-h-0 min-w-0 border-r border-[var(--border)] ${showList ? 'block' : 'hidden'}`}
          >
            <ChatList onOpenChat={() => setPane('chat')} />
          </section>
          <section className={`min-h-0 min-w-0 ${showChat ? 'block' : 'hidden'}`}>
            <ChatView
              onBack={() => setPane('list')}
              onOpenThread={() => setThreadSheet(true)}
            />
          </section>
          {showThreadColumn ? (
            <section className="min-h-0 min-w-0">
              <ThreadPanel
                onClose={() => {
                  closeThread()
                  setThreadSheet(false)
                }}
              />
            </section>
          ) : null}
        </div>

        {showThreadSheet ? (
          <div className="fixed inset-0 z-40 flex justify-end lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/45"
              aria-label="Dismiss thread"
              onClick={() => {
                closeThread()
                setThreadSheet(false)
              }}
            />
            <div className="thread-sheet relative flex h-full w-full max-w-full flex-col bg-[var(--bg-panel)] shadow-2xl md:max-w-[400px]">
              <ThreadPanel
                onClose={() => {
                  closeThread()
                  setThreadSheet(false)
                }}
                sheet
              />
            </div>
          </div>
        ) : null}

        <p className="sr-only">
          {threadOpen ? `Thread open with ${threadReplies} nested replies` : ''}
        </p>
      </div>
    </OrgMessengerBridge>
  )
}

function OrgTopBar() {
  const { state, setScreen, toggleTheme, signOut, isAdmin } = useOrg()
  return (
    <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-1.5 pt-[max(0.35rem,env(safe-area-inset-top))]">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
        T
      </span>
      <div className="min-w-0 flex-1 truncate text-sm font-semibold">
        {state.organization?.name ?? 'Threadly'}
      </div>
      <button type="button" onClick={() => setScreen('chats')} className="min-h-11 px-2 text-[13px]">
        Chats
      </button>
      <button type="button" onClick={() => setScreen('directory')} className="min-h-11 px-2 text-[13px]">
        Directory
      </button>
      {isAdmin ? (
        <button type="button" onClick={() => setScreen('admin')} className="min-h-11 px-2 text-[13px]">
          Admin
        </button>
      ) : null}
      <button type="button" onClick={toggleTheme} className="min-h-11 px-2 text-[13px]">
        {state.theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      <button type="button" onClick={() => void signOut()} className="min-h-11 px-2 text-[13px] text-[var(--text-muted)]">
        Sign out
      </button>
    </div>
  )
}
