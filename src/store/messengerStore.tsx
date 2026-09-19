import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import {
  CONVERSATIONS,
  CURRENT_USER_ID,
  STORAGE_VERSION,
  USERS,
  buildSeedMessages,
  initialLastReadAt,
} from '../data/seed'
import type {
  Conversation,
  ConversationId,
  Message,
  MessageId,
  MessengerSnapshot,
  Theme,
  User,
  UserId,
} from '../types'

const STORAGE_KEY = 'threaded-messenger:v1'

interface UiState {
  currentUserId: UserId
  activeConversationId: ConversationId | null
  activeThreadRootId: MessageId | null
  replyToId: MessageId | null
  lastReadAt: Record<UserId, Record<ConversationId, number>>
  theme: Theme
  collapsedIds: Record<MessageId, boolean>
}

interface StoreState extends UiState {
  users: User[]
  conversations: Conversation[]
  messages: Message[]
}

type Action =
  | { type: 'selectConversation'; id: ConversationId }
  | { type: 'openThread'; rootId: MessageId; replyToId?: MessageId }
  | { type: 'closeThread' }
  | { type: 'setReplyTo'; id: MessageId | null }
  | { type: 'send'; body: string; parentId: MessageId | null }
  | { type: 'switchUser'; id: UserId }
  | { type: 'toggleTheme' }
  | { type: 'toggleCollapse'; id: MessageId }
  | { type: 'resetDemo' }

function defaultTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function seedState(): StoreState {
  const now = Date.now()
  return {
    users: USERS,
    conversations: CONVERSATIONS,
    messages: buildSeedMessages(now),
    currentUserId: CURRENT_USER_ID,
    activeConversationId: 'c_design',
    activeThreadRootId: 'm_launch',
    replyToId: 'm_launch',
    lastReadAt: initialLastReadAt(now),
    theme: defaultTheme(),
    collapsedIds: {},
  }
}

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as MessengerSnapshot
    if (parsed.version !== STORAGE_VERSION) return seedState()
    if (!parsed.users?.length || !parsed.messages?.length) return seedState()
    return {
      users: parsed.users,
      conversations: parsed.conversations,
      messages: parsed.messages,
      currentUserId: parsed.currentUserId,
      activeConversationId: parsed.activeConversationId,
      activeThreadRootId: parsed.activeThreadRootId,
      replyToId: parsed.replyToId,
      lastReadAt: parsed.lastReadAt,
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      collapsedIds: parsed.collapsedIds ?? {},
    }
  } catch {
    return seedState()
  }
}

function persist(state: StoreState) {
  const snapshot: MessengerSnapshot = {
    version: STORAGE_VERSION,
    users: state.users,
    conversations: state.conversations,
    messages: state.messages,
    currentUserId: state.currentUserId,
    activeConversationId: state.activeConversationId,
    activeThreadRootId: state.activeThreadRootId,
    replyToId: state.replyToId,
    lastReadAt: state.lastReadAt,
    theme: state.theme,
    collapsedIds: state.collapsedIds,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

function markRead(state: StoreState, conversationId: ConversationId): StoreState {
  const userMap = { ...(state.lastReadAt[state.currentUserId] ?? {}) }
  userMap[conversationId] = Date.now()
  return {
    ...state,
    lastReadAt: {
      ...state.lastReadAt,
      [state.currentUserId]: userMap,
    },
  }
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'selectConversation': {
      if (state.activeConversationId === action.id) {
        return markRead(state, action.id)
      }
      return markRead(
        {
          ...state,
          activeConversationId: action.id,
          activeThreadRootId: null,
          replyToId: null,
        },
        action.id,
      )
    }
    case 'openThread': {
      const root = state.messages.find((m) => m.id === action.rootId)
      if (!root) return state
      return {
        ...state,
        activeConversationId: root.conversationId,
        activeThreadRootId: action.rootId,
        replyToId: action.replyToId ?? action.rootId,
      }
    }
    case 'closeThread':
      return { ...state, activeThreadRootId: null, replyToId: null }
    case 'setReplyTo':
      return { ...state, replyToId: action.id }
    case 'send': {
      const conversationId = state.activeConversationId
      const body = action.body.trim()
      if (!conversationId || !body) return state
      const msg: Message = {
        id: `m_${crypto.randomUUID()}`,
        conversationId,
        authorId: state.currentUserId,
        parentId: action.parentId,
        body,
        createdAt: Date.now(),
      }
      const next = markRead(
        {
          ...state,
          messages: [...state.messages, msg],
          replyToId: action.parentId ?? state.replyToId,
        },
        conversationId,
      )
      return next
    }
    case 'switchUser': {
      const next: StoreState = {
        ...state,
        currentUserId: action.id,
        activeThreadRootId: null,
        replyToId: null,
      }
      if (next.activeConversationId) {
        return markRead(next, next.activeConversationId)
      }
      return next
    }
    case 'toggleTheme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }
    case 'toggleCollapse': {
      const collapsed = { ...state.collapsedIds }
      if (collapsed[action.id]) delete collapsed[action.id]
      else collapsed[action.id] = true
      return { ...state, collapsedIds: collapsed }
    }
    case 'resetDemo':
      return seedState()
    default:
      return state
  }
}

function descendantsOf(
  messages: Message[],
  rootId: MessageId,
): Message[] {
  const byParent = new Map<MessageId, Message[]>()
  for (const msg of messages) {
    if (!msg.parentId) continue
    const list = byParent.get(msg.parentId) ?? []
    list.push(msg)
    byParent.set(msg.parentId, list)
  }
  const out: Message[] = []
  const stack = [...(byParent.get(rootId) ?? [])]
  while (stack.length) {
    const node = stack.pop()!
    out.push(node)
    const kids = byParent.get(node.id)
    if (kids) stack.push(...kids)
  }
  return out
}

function childrenOf(messages: Message[], parentId: MessageId): Message[] {
  return messages
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

interface StoreApi {
  state: StoreState
  currentUser: User
  activeConversation: Conversation | null
  selectConversation: (id: ConversationId) => void
  openThread: (rootId: MessageId, replyToId?: MessageId) => void
  closeThread: () => void
  setReplyTo: (id: MessageId | null) => void
  sendMessage: (body: string, parentId: MessageId | null) => void
  switchUser: (id: UserId) => void
  toggleTheme: () => void
  toggleCollapse: (id: MessageId) => void
  resetDemo: () => void
  userById: (id: UserId) => User | undefined
  topLevelMessages: (conversationId: ConversationId) => Message[]
  childMessages: (parentId: MessageId) => Message[]
  replyCount: (rootId: MessageId) => number
  unreadCount: (conversationId: ConversationId) => number
  latestMessage: (conversationId: ConversationId) => Message | undefined
}

const StoreContext = createContext<StoreApi | null>(null)

export function MessengerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    persist(state)
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    document.documentElement.style.colorScheme = state.theme
  }, [state.theme])

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? state.users[0],
    [state.users, state.currentUserId],
  )

  const activeConversation = useMemo(
    () =>
      state.conversations.find((c) => c.id === state.activeConversationId) ??
      null,
    [state.conversations, state.activeConversationId],
  )

  const userById = useCallback(
    (id: UserId) => state.users.find((u) => u.id === id),
    [state.users],
  )

  const topLevelMessages = useCallback(
    (conversationId: ConversationId) =>
      state.messages
        .filter((m) => m.conversationId === conversationId && m.parentId === null)
        .sort((a, b) => a.createdAt - b.createdAt),
    [state.messages],
  )

  const childMessages = useCallback(
    (parentId: MessageId) => childrenOf(state.messages, parentId),
    [state.messages],
  )

  const replyCount = useCallback(
    (rootId: MessageId) => descendantsOf(state.messages, rootId).length,
    [state.messages],
  )

  const unreadCount = useCallback(
    (conversationId: ConversationId) => {
      const readAt =
        state.lastReadAt[state.currentUserId]?.[conversationId] ?? 0
      return state.messages.filter(
        (m) =>
          m.conversationId === conversationId &&
          m.createdAt > readAt &&
          m.authorId !== state.currentUserId,
      ).length
    },
    [state.messages, state.lastReadAt, state.currentUserId],
  )

  const latestMessage = useCallback(
    (conversationId: ConversationId) => {
      const list = state.messages.filter((m) => m.conversationId === conversationId)
      if (!list.length) return undefined
      return list.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b))
    },
    [state.messages],
  )

  const api = useMemo<StoreApi>(
    () => ({
      state,
      currentUser,
      activeConversation,
      selectConversation: (id) => dispatch({ type: 'selectConversation', id }),
      openThread: (rootId, replyToId) =>
        dispatch({ type: 'openThread', rootId, replyToId }),
      closeThread: () => dispatch({ type: 'closeThread' }),
      setReplyTo: (id) => dispatch({ type: 'setReplyTo', id }),
      sendMessage: (body, parentId) => dispatch({ type: 'send', body, parentId }),
      switchUser: (id) => dispatch({ type: 'switchUser', id }),
      toggleTheme: () => dispatch({ type: 'toggleTheme' }),
      toggleCollapse: (id) => dispatch({ type: 'toggleCollapse', id }),
      resetDemo: () => dispatch({ type: 'resetDemo' }),
      userById,
      topLevelMessages,
      childMessages,
      replyCount,
      unreadCount,
      latestMessage,
    }),
    [
      state,
      currentUser,
      activeConversation,
      userById,
      topLevelMessages,
      childMessages,
      replyCount,
      unreadCount,
      latestMessage,
    ],
  )

  return createElement(StoreContext.Provider, { value: api }, children)
}

export function useMessenger(): StoreApi {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useMessenger must be used within MessengerProvider')
  return ctx
}
