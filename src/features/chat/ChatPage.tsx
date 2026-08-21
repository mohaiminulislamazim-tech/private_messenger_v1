import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare } from 'lucide-react';
import type { Conversation, Message as MessageType } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { socketManager } from '@/lib/socket';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConversationList } from './ConversationList';
import { ChatPanel } from './ChatPanel';
import { NewChatModal } from './NewChatModal';
import { GroupInfoModal } from './GroupInfoModal';

/**
 * Realtime payload for `message:new`. The socket uses `id` + epoch-millis
 * `createdAt`, unlike REST's `_id` + ISO string — normalized on arrival.
 */
interface SocketMessagePayload {
  id: string;
  conversation: string;
  sender: string;
  text: string;
  createdAt: number;
}

export function ChatPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const conversations = useChatStore((s) => s.conversations);
  const conversationsStatus = useChatStore((s) => s.conversationsStatus);
  const conversationsError = useChatStore((s) => s.conversationsError);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const unread = useChatStore((s) => s.unread);
  const connection = useChatStore((s) => s.connection);

  const loadConversations = useChatStore((s) => s.loadConversations);
  const openConversation = useChatStore((s) => s.openConversation);
  const closeConversation = useChatStore((s) => s.closeConversation);
  const handleIncomingMessage = useChatStore((s) => s.handleIncomingMessage);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setConnection = useChatStore((s) => s.setConnection);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  // Guard: not logged in → back to login.
  useEffect(() => {
    if (!token || !user) navigate('/login', { replace: true });
  }, [token, user, navigate]);

  // Initial data load.
  useEffect(() => {
    if (token) void loadConversations(token);
  }, [token, loadConversations]);

  /**
   * Single Socket.io connection for the whole app. Handlers are attached once
   * per connection and cleaned up on unmount/logout to avoid stale listeners
   * and duplicate subscriptions.
   */
  useEffect(() => {
    if (!token) return;

    const socket = socketManager.connect(token);

    const onMessageNew = (payload: SocketMessagePayload) => {
      handleIncomingMessage({
        id: payload.id,
        conversationId: payload.conversation,
        senderId: payload.sender,
        text: payload.text,
        createdAt: new Date(payload.createdAt).toISOString(),
        status: 'sent',
      });
    };
    const onConversationUpdated = (conversation: Conversation) => {
      upsertConversation(conversation);
    };
    const onConnect = () => setConnection('connected');
    const onDisconnect = () => setConnection('disconnected');
    const onReconnect = () => {
      setConnection('connected');
      // Refresh state that may have changed while offline.
      void loadConversations(token);
    };

    socket.on('message:new', onMessageNew);
    socket.on('conversation:updated', onConversationUpdated);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect', onReconnect);

    if (socket.connected) setConnection('connected');

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect', onReconnect);
    };
  }, [token, handleIncomingMessage, upsertConversation, setConnection, loadConversations]);

  // Cleanup the socket when leaving chat entirely (logout/unmount).
  useEffect(() => {
    return () => {
      if (!useAuthStore.getState().token) socketManager.disconnect();
    };
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const handleSelect = useCallback(
    (conversation: Conversation) => {
      if (token) void openConversation(conversation._id, token);
    },
    [token, openConversation]
  );

  const handleLogout = () => {
    socketManager.disconnect();
    closeConversation();
    logout();
    navigate('/login', { replace: true });
  };

  if (!token || !user) return null;

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-100">
      {/* Sidebar */}
      <aside
        className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-zinc-200 md:w-[340px] lg:w-[380px]`}
      >
        <ConversationList
          conversations={conversations}
          status={conversationsStatus}
          error={conversationsError}
          activeId={activeConversationId}
          unread={unread}
          connection={connection}
          onRetryLoad={() => token && void loadConversations(token)}
          onSelect={handleSelect}
          onNewChat={() => setNewChatOpen(true)}
        />
        <footer className="border-t border-zinc-100 p-2">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-zinc-500">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </Button>
        </footer>
      </aside>

      {/* Chat panel */}
      <main className={`${activeConversationId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
        {activeConversation ? (
          <ChatPanel
            key={activeConversation._id}
            conversation={activeConversation}
            onBack={closeConversation}
            onOpenGroupInfo={() => setGroupInfoOpen(true)}
          />
        ) : (
          <div className="hidden h-full flex-col items-center justify-center bg-zinc-50 md:flex">
            <EmptyState
              icon={<MessageSquare className="h-7 w-7" aria-hidden="true" />}
              title="Select a conversation"
              description="Pick a chat from the list, or start a new direct message or group."
              action={
                <Button size="sm" onClick={() => setNewChatOpen(true)}>
                  New conversation
                </Button>
              }
            />
          </div>
        )}
      </main>

      <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} onOpenConversation={handleSelect} />
      {groupInfoOpen && (
        <GroupInfoModal conversation={activeConversation} onClose={() => setGroupInfoOpen(false)} />
      )}
    </div>
  );
}

export type { MessageType };
