import { Search, MessageCirclePlus, Users, WifiOff } from 'lucide-react';
import type { Conversation } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatListTimestamp } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

interface ConversationListProps {
  conversations: Conversation[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  activeId: string | null;
  unread: Record<string, number>;
  connection: 'connecting' | 'connected' | 'disconnected';
  onRetryLoad: () => void;
  onSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
}

export function ConversationList({
  conversations,
  status,
  error,
  activeId,
  unread,
  connection,
  onRetryLoad,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  const currentUser = useAuthStore((s) => s.user);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={currentUser?.name ?? '?'} id={currentUser?._id} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">{currentUser?.name}</p>
            <p
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium',
                connection === 'connected' ? 'text-emerald-600' : 'text-amber-600'
              )}
            >
              {connection === 'connected' ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" aria-hidden="true" />
                  {connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
                </>
              )}
            </p>
          </div>
        </div>
        <Button onClick={onNewChat} size="sm" aria-label="Start a new conversation or group">
          <MessageCirclePlus className="h-4 w-4" aria-hidden="true" />
          New
        </Button>
      </header>

      {/* Conversations */}
      <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain">
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400" role="status" aria-label="Loading conversations">
            <Spinner className="h-4 w-4" /> Loading conversations…
          </div>
        )}

        {status === 'error' && (
          <div className="p-4">
            <ErrorBanner message={error ?? 'Failed to load conversations.'} onRetry={onRetryLoad} />
          </div>
        )}

        {status === 'ready' && conversations.length === 0 && (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden="true" />}
            title="No conversations yet"
            description="Search for someone by name or phone and say hello — or create a group."
            action={
              <Button onClick={onNewChat} size="sm">
                Start a conversation
              </Button>
            }
            className="py-16"
          />
        )}

        {status === 'ready' && conversations.length > 0 && (
          <ul className="px-2 py-2" aria-label="Conversations">
            {conversations.map((conversation) => (
              <li key={conversation._id}>
                <ConversationItem
                  conversation={conversation}
                  active={conversation._id === activeId}
                  unread={unread[conversation._id] ?? 0}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  unread: number;
  onSelect: (conversation: Conversation) => void;
}

function ConversationItem({ conversation, active, unread, onSelect }: ConversationItemProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isGroup = conversation.type === 'group';
  const title = isGroup ? (conversation.name ?? 'Group') : (conversation.participant?.name ?? 'Direct chat');
  const subtitle = isGroup
    ? (conversation.participants ?? [])
        .filter((p) => p._id !== currentUser?._id)
        .map((p) => p.name.split(' ')[0])
        .slice(0, 3)
        .join(', ') + ((conversation.participants?.length ?? 0) > 4 ? ` +${(conversation.participants?.length ?? 0) - 4}` : '')
    : conversation.participant?.phone;

  const lastText = conversation.lastMessage?.text;
  const lastTime = conversation.lastMessage?.createdAt ?? conversation.updatedAt;
  const ownLast = conversation.lastMessage?.sender === currentUser?._id;

  return (
    <button
      onClick={() => onSelect(conversation)}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        active ? 'bg-primary-50' : 'hover:bg-zinc-50'
      )}
    >
      {isGroup ? (
        <div className="relative shrink-0" aria-hidden="true">
          <Avatar name={title} id={conversation._id} size="lg" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-zinc-800">
            <Users className="h-2.5 w-2.5 text-white" />
          </span>
        </div>
      ) : (
        <Avatar name={title} id={conversation.participant?._id ?? conversation._id} size="lg" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-sm', unread > 0 ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-800')}>
            {title}
          </span>
          <span className="shrink-0 text-[11px] font-medium text-zinc-400">{formatListTimestamp(lastTime)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={cn('truncate text-xs', unread > 0 ? 'font-semibold text-zinc-700' : 'text-zinc-500')}>
            {!lastText ? (
              <span className="italic text-zinc-400">No messages yet</span>
            ) : (
              <>
                {isGroup && ownLast && <span className="text-zinc-400">You: </span>}
                {lastText}
              </>
            )}
          </span>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        {isGroup && subtitle && (
          <span className="mt-0.5 block truncate text-[11px] text-zinc-400">{subtitle}</span>
        )}
      </div>
    </button>
  );
}

export function SearchHint() {
  return <Search className="h-4 w-4" aria-hidden="true" />;
}
