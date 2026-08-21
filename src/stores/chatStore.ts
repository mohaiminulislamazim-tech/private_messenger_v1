import { create } from 'zustand';
import type { Conversation, Message } from '@/types';
import * as conversationsApi from '@/services/conversations';
import { fetchMessages, sendMessage } from '@/services/messages';
import type { MessagePage } from '@/services/messages';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface ChatState {
  conversations: Conversation[];
  conversationsStatus: 'idle' | 'loading' | 'ready' | 'error';
  conversationsError: string | null;

  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  messageStatus: Record<string, 'loading' | 'ready' | 'error'>;
  messageError: Record<string, string | null>;
  hasMore: Record<string, boolean>;
  loadingOlder: Record<string, boolean>;

  /** unread counts per conversation id */
  unread: Record<string, number>;

  connection: ConnectionState;

  loadConversations: (token: string) => Promise<void>;
  openConversation: (conversationId: string, token: string) => Promise<void>;
  closeConversation: () => void;
  loadOlderMessages: (conversationId: string, token: string) => Promise<void>;
  send: (conversationId: string, text: string, token: string) => Promise<void>;
  retrySend: (conversationId: string, messageId: string, token: string) => Promise<void>;

  upsertConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  addDirectConversation: (userId: string, token: string) => Promise<Conversation>;
  createGroup: (name: string, participantIds: string[], token: string) => Promise<Conversation>;

  handleIncomingMessage: (message: Message) => void;
  setConnection: (state: ConnectionState) => void;
}

const PAGE_SIZE = 30;

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/** Merge a freshly fetched page into state without duplicating messages. */
function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const seen = new Set(existing.map((m) => m.id));
  const merged = [...incoming.filter((m) => !seen.has(m.id)), ...existing];
  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return merged;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  conversationsStatus: 'idle',
  conversationsError: null,

  activeConversationId: null,
  messages: {},
  messageStatus: {},
  messageError: {},
  hasMore: {},
  loadingOlder: {},

  unread: {},

  connection: 'connecting',

  loadConversations: async (token) => {
    if (get().conversationsStatus === 'idle') set({ conversationsStatus: 'loading', conversationsError: null });
    try {
      const data = await conversationsApi.fetchConversations(token);
      set({ conversations: sortConversations(data), conversationsStatus: 'ready' });
    } catch (err) {
      set({
        conversationsStatus: 'error',
        conversationsError: err instanceof Error ? err.message : 'Failed to load conversations.',
      });
    }
  },

  openConversation: async (conversationId, token) => {
    const isActive = get().activeConversationId === conversationId;
    set((s) => ({
      activeConversationId: conversationId,
      unread: { ...s.unread, [conversationId]: 0 },
    }));
    if (isActive && get().messages[conversationId]?.length) return;

    if (!get().messages[conversationId]) {
      set((s) => ({ messageStatus: { ...s.messageStatus, [conversationId]: 'loading' }, messageError: { ...s.messageError, [conversationId]: null } }));
    }
    try {
      const page: MessagePage = await fetchMessages(conversationId, token, { limit: PAGE_SIZE });
      set((s) => ({
        messages: { ...s.messages, [conversationId]: mergeMessages(s.messages[conversationId] ?? [], page.messages) },
        hasMore: { ...s.hasMore, [conversationId]: page.hasMore },
        messageStatus: { ...s.messageStatus, [conversationId]: 'ready' },
      }));
    } catch (err) {
      set((s) => ({
        messageStatus: { ...s.messageStatus, [conversationId]: 'error' },
        messageError: {
          ...s.messageError,
          [conversationId]: err instanceof Error ? err.message : 'Failed to load messages.',
        },
      }));
    }
  },

  closeConversation: () => set({ activeConversationId: null }),

  loadOlderMessages: async (conversationId, token) => {
    const state = get();
    const list = state.messages[conversationId] ?? [];
    if (!list.length || !state.hasMore[conversationId] || state.loadingOlder[conversationId]) return;

    set((s) => ({ loadingOlder: { ...s.loadingOlder, [conversationId]: true } }));
    try {
      const oldest = list[0];
      const page = await fetchMessages(conversationId, token, {
        limit: PAGE_SIZE,
        before: oldest.pending ? undefined : oldest.id,
      });
      set((s) => ({
        messages: { ...s.messages, [conversationId]: mergeMessages(s.messages[conversationId] ?? [], page.messages) },
        hasMore: { ...s.hasMore, [conversationId]: page.hasMore },
        loadingOlder: { ...s.loadingOlder, [conversationId]: false },
      }));
    } catch {
      set((s) => ({ loadingOlder: { ...s.loadingOlder, [conversationId]: false } }));
    }
  },

  send: async (conversationId, text, token) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: '', // filled by caller context; not needed for own-message rendering
      text: trimmed,
      createdAt: new Date().toISOString(),
      status: 'sending',
      pending: true,
    };

    set((s) => ({
      messages: { ...s.messages, [conversationId]: [...(s.messages[conversationId] ?? []), optimistic] },
    }));

    try {
      const saved = await sendMessage(conversationId, trimmed, token);
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
            m.id === tempId ? { ...saved, status: 'sent' as const } : m
          ),
        },
      }));
    } catch (err) {
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
            m.id === tempId ? { ...m, status: 'failed' as const } : m
          ),
        },
      }));
      throw err instanceof Error ? err : new Error('Failed to send message.');
    }
  },

  retrySend: async (conversationId, messageId, token) => {
    const msg = get().messages[conversationId]?.find((m) => m.id === messageId);
    if (!msg) return;
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, status: 'sending' as const } : m
        ),
      },
    }));
    try {
      const saved = await sendMessage(conversationId, msg.text, token);
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
            m.id === messageId ? { ...saved, status: 'sent' as const } : m
          ),
        },
      }));
    } catch {
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
            m.id === messageId ? { ...m, status: 'failed' as const } : m
          ),
        },
      }));
    }
  },

  upsertConversation: (conversation) => {
    set((s) => {
      const rest = s.conversations.filter((c) => c._id !== conversation._id);
      return { conversations: sortConversations([conversation, ...rest]) };
    });
  },

  /** Drop a conversation everywhere (e.g. after leaving a group). */
  removeConversation: (conversationId) => {
    set((s) => {
      const messages = { ...s.messages };
      delete messages[conversationId];
      const unread = { ...s.unread };
      delete unread[conversationId];
      return {
        conversations: s.conversations.filter((c) => c._id !== conversationId),
        messages,
        unread,
        activeConversationId: s.activeConversationId === conversationId ? null : s.activeConversationId,
      };
    });
  },

  addDirectConversation: async (userId, token) => {
    const conversation = await conversationsApi.startDirectConversation(userId, token);
    // The start response is sparse ({_id, participants, createdAt}); enrich it
    // with any existing entry we already have, then refresh the list.
    const existing = get().conversations.find((c) => c._id === conversation._id);
    get().upsertConversation({ ...existing, ...conversation, type: existing?.type ?? 'direct' });
    void get().loadConversations(token);
    return conversation;
  },

  createGroup: async (name, participantIds, token) => {
    const conversation = await conversationsApi.createGroup({ name, participantIds }, token);
    get().upsertConversation(conversation);
    return conversation;
  },

  /**
   * Realtime handler for `message:new`. Deduplicates by id so a REST echo and
   * a socket delivery of the same message only render once.
   */
  handleIncomingMessage: (message) => {
    set((s) => {
      const list = s.messages[message.conversationId] ?? [];
      const isDuplicate = list.some((m) => m.id === message.id);
      const replacedOptimistic = list.some(
        (m) => m.pending && m.text === message.text && Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 60_000
      );

      let nextList = list;
      if (!isDuplicate) {
        nextList = replacedOptimistic
          ? list.map((m) =>
              m.pending && m.text === message.text && Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 60_000
                ? { ...message, status: 'sent' as const }
                : m
            )
          : [...list, { ...message, status: 'sent' as const }];
      }

      const convIndex = s.conversations.findIndex((c) => c._id === message.conversationId);
      let conversations = s.conversations;
      let unread = s.unread;

      if (convIndex !== -1) {
        const conv = s.conversations[convIndex];
        const updated: Conversation = {
          ...conv,
          lastMessage: { text: message.text, sender: message.senderId, createdAt: message.createdAt },
          updatedAt: message.createdAt,
        };
        conversations = sortConversations([updated, ...s.conversations.filter((c) => c._id !== conv._id)]);
      }

      const isActive = s.activeConversationId === message.conversationId;
      if (!isActive && !isDuplicate) {
        unread = { ...s.unread, [message.conversationId]: (s.unread[message.conversationId] ?? 0) + 1 };
      }

      return { messages: { ...s.messages, [message.conversationId]: nextList }, conversations, unread };
    });
  },

  setConnection: (connection) => set({ connection }),
}));
