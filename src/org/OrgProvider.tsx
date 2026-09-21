import {
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSupabase, supabaseConfigured } from '../lib/supabase'
import type {
  Attachment,
  Conversation,
  Message,
} from '../types'
import * as api from './orgApi'
import type { OrgApi, OrgState } from './orgStoreShared'
import {
  OrgContext,
  childrenOf,
  defaultTheme,
  descendantsOf,
  initialsOf,
  memberToUser,
} from './orgStoreShared'

export function OrgProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrgState>(() => ({
    session: null,
    authUser: null,
    organization: null,
    membership: null,
    members: [],
    users: [],
    conversations: [],
    messages: [],
    currentUserId: '',
    activeConversationId: null,
    activeThreadRootId: null,
    replyToId: null,
    lastReadAt: {},
    theme: defaultTheme(),
    collapsedIds: {},
    screen: 'auth',
    loading: true,
    error: null,
    syncing: false,
  }))

  const loadOrgData = useCallback(async (orgId: string, userId: string) => {
    setState((s) => ({ ...s, syncing: true, error: null }))
    try {
      const members = await api.listDirectory(orgId)
      const membership = members.find((m) => m.user_id === userId) ?? null
      const convRows = await api.listConversations(orgId)
      const msgRows = await api.listMessages(convRows.map((c) => c.id))
      const attRows = await api.listAttachments(msgRows.map((m) => m.id))
      const urlCache = new Map<string, string>()
      for (const a of attRows) {
        if (!urlCache.has(a.storage_path)) {
          try {
            urlCache.set(a.storage_path, await api.signedUrlForPath(a.storage_path))
          } catch {
            urlCache.set(a.storage_path, '')
          }
        }
      }
      const attsByMsg = new Map<string, Attachment[]>()
      for (const a of attRows) {
        const list = attsByMsg.get(a.message_id) ?? []
        list.push({
          id: a.id,
          name: a.name,
          mimeType: a.mime_type,
          size: a.size,
          kind: a.kind,
          dataUrl: urlCache.get(a.storage_path) || '',
        })
        attsByMsg.set(a.message_id, list)
      }

      const users = members.map(memberToUser)
      const conversations: Conversation[] = convRows.map((c) => ({
        id: c.id,
        name: c.name,
        participantIds: members.map((m) => m.user_id),
        isGroup: c.is_group,
        hue: c.hue,
      }))
      const messages: Message[] = msgRows.map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        authorId: m.author_id,
        parentId: m.parent_id,
        body: m.body,
        createdAt: new Date(m.created_at).getTime(),
        attachments: attsByMsg.get(m.id) ?? [],
      }))

      const memberships = await api.listMyMemberships()
      const mine = memberships.find((m) => m.org_id === orgId)

      setState((s) => ({
        ...s,
        members,
        membership,
        organization: mine?.organization ?? s.organization,
        users,
        conversations,
        messages,
        currentUserId: userId,
        activeConversationId:
          s.activeConversationId && conversations.some((c) => c.id === s.activeConversationId)
            ? s.activeConversationId
            : (conversations[0]?.id ?? null),
        screen: 'chats',
        syncing: false,
        loading: false,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        syncing: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to sync org data',
      }))
    }
  }, [])

  const bootstrap = useCallback(async () => {
    if (!supabaseConfigured) {
      setState((s) => ({ ...s, loading: false, screen: 'auth' }))
      return
    }
    const client = getSupabase()!
    const { data } = await client.auth.getSession()
    const session = data.session
    if (!session) {
      setState((s) => ({
        ...s,
        session: null,
        authUser: null,
        loading: false,
        screen: 'auth',
      }))
      return
    }
    setState((s) => ({
      ...s,
      session,
      authUser: session.user,
      currentUserId: session.user.id,
    }))
    try {
      const memberships = await api.listMyMemberships()
      if (!memberships.length) {
        setState((s) => ({
          ...s,
          loading: false,
          screen: 'create-org',
          session,
          authUser: session.user,
          currentUserId: session.user.id,
        }))
        return
      }
      const first = memberships[0]
      setState((s) => ({
        ...s,
        organization: first.organization,
        membership: first,
        session,
        authUser: session.user,
      }))
      await loadOrgData(first.org_id, session.user.id)
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Bootstrap failed',
        screen: 'auth',
      }))
    }
  }, [loadOrgData])

  useEffect(() => {
    void bootstrap()
    if (!supabaseConfigured) return
    const client = getSupabase()!
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState((s) => ({
          ...s,
          session: null,
          authUser: null,
          organization: null,
          membership: null,
          members: [],
          users: [],
          conversations: [],
          messages: [],
          screen: 'auth',
          loading: false,
        }))
        return
      }
      void bootstrap()
    })
    return () => sub.subscription.unsubscribe()
  }, [bootstrap])

  useEffect(() => {
    if (!supabaseConfigured || !state.organization) return
    const client = getSupabase()!
    const channel = client
      .channel(`org-${state.organization.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          if (state.organization && state.currentUserId) {
            void loadOrgData(state.organization.id, state.currentUserId)
          }
        },
      )
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [state.organization, state.currentUserId, loadOrgData])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    document.documentElement.style.colorScheme = state.theme
    const color = state.theme === 'dark' ? '#111b21' : '#f0f2f5'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [state.theme])

  const currentUser = useMemo(() => {
    const found = state.users.find((u) => u.id === state.currentUserId)
    if (found) return found
    return {
      id: state.currentUserId || 'anon',
      name: state.membership?.name ?? state.authUser?.email ?? 'You',
      handle: 'you',
      initials: initialsOf(state.membership?.name ?? 'You'),
      hue: 200,
    }
  }, [state.users, state.currentUserId, state.membership, state.authUser])

  const activeConversation = useMemo(
    () => state.conversations.find((c) => c.id === state.activeConversationId) ?? null,
    [state.conversations, state.activeConversationId],
  )

  const isAdmin = state.membership?.role === 'admin'

  const apiObj = useMemo<OrgApi>(
    () => ({
      state,
      configured: supabaseConfigured,
      currentUser,
      activeConversation,
      isAdmin,
      selectConversation: (id) =>
        setState((s) => {
          const userMap = { ...(s.lastReadAt[s.currentUserId] ?? {}) }
          userMap[id] = Date.now()
          return {
            ...s,
            activeConversationId: id,
            activeThreadRootId: null,
            replyToId: null,
            lastReadAt: { ...s.lastReadAt, [s.currentUserId]: userMap },
            screen: 'chats',
          }
        }),
      openThread: (rootId, replyToId) =>
        setState((s) => {
          const root = s.messages.find((m) => m.id === rootId)
          if (!root) return s
          return {
            ...s,
            activeConversationId: root.conversationId,
            activeThreadRootId: rootId,
            replyToId: replyToId ?? rootId,
          }
        }),
      closeThread: () =>
        setState((s) => ({ ...s, activeThreadRootId: null, replyToId: null })),
      setReplyTo: (id) => setState((s) => ({ ...s, replyToId: id })),
      sendMessage: (body, parentId, attachments = []) => {
        const conversationId = state.activeConversationId
        if (!conversationId || (!body.trim() && !attachments.length)) return
        void (async () => {
          try {
            const files: File[] = []
            for (const att of attachments) {
              if (!att.dataUrl.startsWith('data:')) continue
              const res = await fetch(att.dataUrl)
              const blob = await res.blob()
              files.push(new File([blob], att.name, { type: att.mimeType }))
            }
            await api.sendOrgMessage({
              conversationId,
              body: body.trim(),
              parentId,
              files,
            })
            if (state.organization) {
              await loadOrgData(state.organization.id, state.currentUserId)
            }
            if (parentId) {
              setState((s) => ({ ...s, replyToId: parentId }))
            }
          } catch (err) {
            setState((s) => ({
              ...s,
              error: err instanceof Error ? err.message : 'Failed to send',
            }))
          }
        })()
      },
      switchUser: () => {},
      toggleTheme: () =>
        setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleCollapse: (id) =>
        setState((s) => {
          const collapsed = { ...s.collapsedIds }
          if (collapsed[id]) delete collapsed[id]
          else collapsed[id] = true
          return { ...s, collapsedIds: collapsed }
        }),
      resetDemo: () => {},
      userById: (id) => state.users.find((u) => u.id === id),
      topLevelMessages: (conversationId) =>
        state.messages
          .filter((m) => m.conversationId === conversationId && m.parentId === null)
          .sort((a, b) => a.createdAt - b.createdAt),
      childMessages: (parentId) => childrenOf(state.messages, parentId),
      replyCount: (rootId) => descendantsOf(state.messages, rootId).length,
      unreadCount: (conversationId) => {
        const readAt = state.lastReadAt[state.currentUserId]?.[conversationId] ?? 0
        return state.messages.filter(
          (m) =>
            m.conversationId === conversationId &&
            m.createdAt > readAt &&
            m.authorId !== state.currentUserId,
        ).length
      },
      latestMessage: (conversationId) => {
        const list = state.messages.filter((m) => m.conversationId === conversationId)
        if (!list.length) return undefined
        return list.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b))
      },
      setScreen: (screen) => setState((s) => ({ ...s, screen })),
      refresh: async () => {
        if (state.organization && state.currentUserId) {
          await loadOrgData(state.organization.id, state.currentUserId)
        } else {
          await bootstrap()
        }
      },
      signIn: async (email, password) => {
        setState((s) => ({ ...s, error: null, loading: true }))
        try {
          await api.signIn(email, password)
          await bootstrap()
        } catch (err) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Sign in failed',
          }))
          throw err
        }
      },
      signUp: async (email, password, name) => {
        setState((s) => ({ ...s, error: null, loading: true }))
        try {
          await api.signUp(email, password, name)
          await bootstrap()
        } catch (err) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Sign up failed',
          }))
          throw err
        }
      },
      signOut: async () => {
        await api.signOut()
        setState((s) => ({
          ...s,
          session: null,
          authUser: null,
          organization: null,
          membership: null,
          screen: 'auth',
        }))
      },
      createOrg: async (input) => {
        setState((s) => ({ ...s, error: null, loading: true }))
        try {
          const { org } = await api.createOrganization({
            ...input,
            email: state.authUser?.email ?? undefined,
          })
          setState((s) => ({ ...s, organization: org }))
          await loadOrgData(org.id, state.authUser!.id)
        } catch (err) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Create org failed',
          }))
          throw err
        }
      },
      createInviteLink: async () => {
        if (!state.organization) throw new Error('No organization')
        const invite = await api.createInvite(state.organization.id)
        return api.inviteUrl(invite.token)
      },
      createGroup: async (name, memberUserIds) => {
        if (!state.organization) throw new Error('No organization')
        await api.createGroupConversation(state.organization.id, name, memberUserIds)
        await loadOrgData(state.organization.id, state.currentUserId)
      },
      updateMember: async (memberId, patch) => {
        await api.updateMember(memberId, patch)
        if (state.organization) {
          await loadOrgData(state.organization.id, state.currentUserId)
        }
      },
      clearError: () => setState((s) => ({ ...s, error: null })),
    }),
    [state, currentUser, activeConversation, isAdmin, loadOrgData, bootstrap],
  )

  return createElement(OrgContext.Provider, { value: apiObj }, children)
}

export function useOrg(): OrgApi {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used within OrgProvider')
  return ctx
}

export function useOrgAsMessenger() {
  const org = useOrg()
  return {
    state: {
      users: org.state.users,
      conversations: org.state.conversations,
      messages: org.state.messages,
      currentUserId: org.state.currentUserId,
      activeConversationId: org.state.activeConversationId,
      activeThreadRootId: org.state.activeThreadRootId,
      replyToId: org.state.replyToId,
      lastReadAt: org.state.lastReadAt,
      theme: org.state.theme,
      collapsedIds: org.state.collapsedIds,
    },
    currentUser: org.currentUser,
    activeConversation: org.activeConversation,
    selectConversation: org.selectConversation,
    openThread: org.openThread,
    closeThread: org.closeThread,
    setReplyTo: org.setReplyTo,
    sendMessage: org.sendMessage,
    switchUser: org.switchUser,
    toggleTheme: org.toggleTheme,
    toggleCollapse: org.toggleCollapse,
    resetDemo: org.resetDemo,
    userById: org.userById,
    topLevelMessages: org.topLevelMessages,
    childMessages: org.childMessages,
    replyCount: org.replyCount,
    unreadCount: org.unreadCount,
    latestMessage: org.latestMessage,
  }
}
