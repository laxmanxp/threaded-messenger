import { ChatList } from './components/ChatList'
import { ChatView } from './components/ChatView'
import { ThreadPanel } from './components/ThreadPanel'
import { useMediaQuery } from './lib/media'
import { useMessenger } from './store/messengerStore'
import { useEffect, useRef, useState } from 'react'
import type { MobilePane } from './types'

export default function App() {
  const { state, switchUser, toggleTheme, resetDemo, closeThread, replyCount } =
    useMessenger()
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')
  const [pane, setPane] = useState<MobilePane>('chat')
  const [threadSheet, setThreadSheet] = useState(false)
  const wasLg = useRef(isLg)
  const threadOpen = Boolean(state.activeThreadRootId)
  const threadReplies = state.activeThreadRootId
    ? replyCount(state.activeThreadRootId)
    : 0

  useEffect(() => {
    if (!threadOpen) setThreadSheet(false)
  }, [threadOpen])

  useEffect(() => {
    if (wasLg.current && !isLg && threadOpen) setThreadSheet(true)
    wasLg.current = isLg
  }, [isLg, threadOpen])

  function openThreadSheet() {
    setThreadSheet(true)
  }

  function onCloseThread() {
    closeThread()
    setThreadSheet(false)
  }

  const showList = isMd || pane === 'list'
  const showChat = isMd || pane === 'chat'
  const showThreadColumn = isLg && threadOpen
  const showThreadSheet = !isLg && threadOpen && threadSheet

  const gridCols = showThreadColumn
    ? 'md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(280px,380px)]'
    : 'md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]'

  return (
    <div className="app-shell flex min-h-0 flex-col bg-[var(--bg-app)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-1.5 pt-[max(0.35rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            T
          </span>
          <div className="min-w-0">
            <div className="hidden truncate text-sm font-semibold tracking-wide min-[420px]:block">
              Threadly
            </div>
            <div className="hidden truncate text-[11px] text-[var(--text-muted)] sm:block">
              WhatsApp-style chat · nested threads
            </div>
          </div>
        </div>
        <label className="hidden min-h-11 items-center gap-2 text-[12.5px] text-[var(--text-muted)] sm:flex">
          Switch user
          <select
            value={state.currentUserId}
            onChange={(e) => switchUser(e.target.value)}
            className="min-h-11 rounded-md border-0 bg-[var(--bg-search)] px-2 py-1 text-[16px] text-[var(--text)] outline-none md:text-[13px]"
          >
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <select
          value={state.currentUserId}
          onChange={(e) => switchUser(e.target.value)}
          className="min-h-11 max-w-[38vw] rounded-md border-0 bg-[var(--bg-search)] px-2 text-[16px] text-[var(--text)] outline-none sm:hidden"
          aria-label="Switch user"
        >
          {state.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={toggleTheme}
          className="min-h-11 min-w-11 rounded-md px-2 text-[13px] text-[var(--text)] hover:bg-[var(--bg-hover)]"
        >
          {state.theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          onClick={resetDemo}
          className="min-h-11 rounded-md px-2 text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          Reset
        </button>
      </div>

      <div className={`grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden ${gridCols}`}>
        <section
          className={`min-h-0 min-w-0 border-r border-[var(--border)] ${
            showList ? 'block' : 'hidden'
          }`}
        >
          <ChatList onOpenChat={() => setPane('chat')} />
        </section>
        <section className={`min-h-0 min-w-0 ${showChat ? 'block' : 'hidden'}`}>
          <ChatView
            onBack={() => setPane('list')}
            onOpenThread={openThreadSheet}
          />
        </section>
        {showThreadColumn ? (
          <section className="min-h-0 min-w-0">
            <ThreadPanel onClose={onCloseThread} />
          </section>
        ) : null}
      </div>

      {showThreadSheet ? (
        <div className="fixed inset-0 z-40 flex justify-end lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Dismiss thread"
            onClick={onCloseThread}
          />
          <div className="thread-sheet relative flex h-full w-full max-w-full flex-col bg-[var(--bg-panel)] shadow-2xl md:max-w-[400px]">
            <ThreadPanel onClose={onCloseThread} sheet />
          </div>
        </div>
      ) : null}

      <p className="sr-only">
        {threadOpen ? `Thread open with ${threadReplies} nested replies` : ''}
      </p>
    </div>
  )
}
