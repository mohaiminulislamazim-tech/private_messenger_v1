import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import type { Conversation, Message } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Composer } from './Composer';
import { MessageList } from './MessageList';

interface ChatPanelProps {
  conversation: Conversation;
  onBack: () => void;
  onOpenGroupInfo: () => void;
}

export function ChatPanel({ conversation, onBack, onOpenGroupInfo }: ChatPanelProps) {
  const currentUser = useAuthStore((s) => s.user)!;
  const token = useAuthStore((s) => s.token)!;

  const messages = useChatStore((s) => s.messages[conversation._id]);
  const status = useChatStore((s) => s.messageStatus[conversation._id]);
  const error = useChatStore((s) => s.messageError[conversation._id]);
  const hasMore = useChatStore((s) => s.hasMore[conversation._id]);
  const loadingOlder = useChatStore((s) => s.loadingOlder[conversation._id]);

  const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
  const send = useChatStore((s) => s.send);
  const retrySend = useChatStore((s) => s.retrySend);

  const isGroup = conversation.type === 'group';
  const title = isGroup ? (conversation.name ?? 'Group') : (conversation.participant?.name ?? 'Direct chat');

  const senderNameOf = (senderId: string): string => {
    if (senderId === currentUser._id) return currentUser.name;
    return conversation.participants?.find((p) => p._id === senderId)?.name ?? 'Member';
  };

  const handleSend = async (text: string) => {
    await send(conversation._id, text, token);
  };

  const handleRetry = (messageId: string) => {
    void retrySend(conversation._id, messageId, token);
  };

  const handleLoadOlder = () => {
    if (status === 'error') {
      // Retry initial load through openConversation
      void useChatStore.getState().openConversation(conversation._id, token);
      return;
    }
    void loadOlderMessages(conversation._id, token);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-100 bg-white/90 px-3 py-2.5 backdrop-blur sm:px-4">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {isGroup ? (
          <Avatar name={title} id={conversation._id} size="md" />
        ) : (
          <Avatar name={title} id={conversation.participant?._id ?? conversation._id} size="md" />
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-zinc-900">{title}</h2>
          <p className="truncate text-xs text-zinc-500">
            {isGroup
              ? `${conversation.participants?.length ?? 0} members`
              : (conversation.participant?.phone ?? '')}
          </p>
        </div>

        {isGroup && (
          <Button variant="ghost" size="sm" onClick={onOpenGroupInfo} aria-label="Group info and members">
            <Info className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Info</span>
          </Button>
        )}
      </header>

      {/* Messages */}
      {status === undefined || status === 'loading' ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-zinc-400" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading messages…
        </div>
      ) : (
        <MessageList
          conversationId={conversation._id}
          messages={messages ?? []}
          currentUserId={currentUser._id}
          status={status}
          error={error}
          hasMore={hasMore}
          loadingOlder={loadingOlder}
          showSenderNames={isGroup}
          senderNameOf={senderNameOf}
          onLoadOlder={handleLoadOlder}
          onRetry={handleRetry}
        />
      )}

      {/* Composer */}
      <Composer onSend={handleSend} conversationLabel={title} />
    </div>
  );
}

export type { Message };
