import { useEffect, useState } from 'react'
import { ChatList } from './components/ChatList'
import { ChatView } from './components/ChatView'
import { ThreadPanel } from './components/ThreadPanel'
import { useMessenger } from './store/messengerStore'
import type { MobilePane } from './types'

export default function App() {
  const { state, switchUser, toggleTheme, resetDemo, closeThread, replyCount } =
    useMessenger()
  const [pane, setPane] = useState<MobilePane>(
    state.activeThreadRootId ? 'thread' : 'chat',
  )
  const threadOpen = Boolean(state.activeThreadRootId)
  const threadReplies = state.activeThreadRootId
    ? replyCount(state.activeThreadRootId)
    : 0

  useEffect(() => {
    if (threadOpen) setPane('thread')
    else setPane((current) => (current === 'thread' ? 'chat' : current))
  }, [threadOpen])

  const gridCols = threadOpen
    ? 'md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_minmax(280px,380px)]'
    : 'md:grid-cols-[300px_minmax(0,1fr)]'

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-app)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            T
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-wide">
              Threadly
            </div>
            <div className="truncate text-[11px] text-[var(--text-muted)]">
              WhatsApp-style chat · nested threads
            </div>
          </div>
        </div>
        <label className="hidden items-center gap-2 text-[12.5px] text-[var(--text-muted)] sm:flex">
          Switch user
          <select
            value={state.currentUserId}
            onChange={(e) => switchUser(e.target.value)}
            className="rounded-md border-0 bg-[var(--bg-search)] px-2 py-1 text-[13px] text-[var(--text)] outline-none"
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
          className="rounded-md border-0 bg-[var(--bg-search)] px-2 py-1 text-[13px] text-[var(--text)] outline-none sm:hidden"
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
          className="rounded-md px-2 py-1 text-[13px] text-[var(--text)] hover:bg-[var(--bg-hover)]"
        >
          {state.theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-md px-2 py-1 text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          Reset
        </button>
      </div>

      <div className={`grid min-h-0 flex-1 grid-cols-1 ${gridCols}`}>
        <section
          className={`min-h-0 border-r border-[var(--border)] ${
            pane === 'list' ? 'block' : 'hidden md:block'
          }`}
        >
          <ChatList onOpenChat={() => setPane('chat')} />
        </section>
        <section
          className={`min-h-0 ${
            pane === 'chat' ? 'block' : 'hidden'
          } ${threadOpen ? 'lg:block' : 'md:block'} ${
            pane === 'thread' ? 'md:hidden lg:block' : 'md:block'
          }`}
        >
          <ChatView
            onBack={() => setPane('list')}
            onOpenThread={() => setPane('thread')}
          />
        </section>
        {threadOpen ? (
          <section
            className={`min-h-0 ${
              pane === 'thread' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ThreadPanel
              onClose={() => {
                closeThread()
                setPane('chat')
              }}
            />
          </section>
        ) : null}
      </div>
      <p className="sr-only">
        {threadOpen ? `Thread open with ${threadReplies} nested replies` : ''}
      </p>
    </div>
  )
}
