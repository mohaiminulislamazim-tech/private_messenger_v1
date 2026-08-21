import { useMemo } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';
import type { Message } from '@/types';
import { useMessageScroll } from '@/hooks/useMessageScroll';
import { cn, formatDayLabel, isSameDayIso, shouldGroupWithPrevious } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  status: 'loading' | 'ready' | 'error' | undefined;
  error: string | null;
  hasMore?: boolean;
  loadingOlder?: boolean;
  showSenderNames: boolean;
  senderNameOf: (senderId: string) => string;
  onLoadOlder: () => void;
  onRetry: (messageId: string) => void;
}

export function MessageList({
  conversationId,
  messages,
  currentUserId,
  status,
  error,
  hasMore,
  loadingOlder,
  showSenderNames,
  senderNameOf,
  onLoadOlder,
  onRetry,
}: MessageListProps) {
  const { containerRef, isNearBottom, unseenCount, scrollToBottom, handleScroll } = useMessageScroll({
    conversationId,
    messages,
    ready: status === 'ready',
    onLoadOlder,
    hasMore,
    loadingOlder,
  });

  /**
   * Precompute grouping metadata: a message starts a new visual cluster when
   * the day changed, the sender changed, or enough time passed.
   */
  const items = useMemo(() => {
    return messages.map((message, index) => {
      const prev = messages[index - 1];
      const next = messages[index + 1];
      const newDay = !prev || !isSameDayIso(prev.createdAt, message.createdAt);
      const startsCluster =
        newDay ||
        !prev ||
        prev.senderId !== message.senderId ||
        (!prev.pending && !shouldGroupWithPrevious(prev.createdAt, message.createdAt));
      const endsCluster =
        !next ||
        next.senderId !== message.senderId ||
        !isSameDayIso(next.createdAt, message.createdAt) ||
        !shouldGroupWithPrevious(message.createdAt, next.createdAt);

      return { message, newDay, startsCluster, endsCluster };
    });
  }, [messages]);

  if (status === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-400" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        <p className="text-sm">Loading conversation…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-zinc-700">Couldn't load this conversation</p>
        <p className="max-w-xs text-sm text-zinc-500">{error ?? 'Something went wrong.'}</p>
        <button
          onClick={onLoadOlder}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6"
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        {hasMore && (
          <div className="flex justify-center pb-3">
            {loadingOlder ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-zinc-500 shadow-sm border border-zinc-100">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Loading earlier messages…
              </span>
            ) : (
              <button
                onClick={onLoadOlder}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm border border-zinc-100 transition-colors hover:text-zinc-800"
              >
                Load earlier messages
              </button>
            )}
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl" aria-hidden="true">
              👋
            </div>
            <p className="text-sm font-semibold text-zinc-700">No messages yet</p>
            <p className="max-w-[240px] text-sm text-zinc-500">
              Say hello — your message will appear here instantly.
            </p>
          </div>
        )}

        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {items.map(({ message, newDay, startsCluster, endsCluster }) => (
            <div key={message.id}>
              {newDay && (
                <div className="my-4 flex items-center justify-center" role="separator" aria-label={formatDayLabel(message.createdAt)}>
                  <span className="rounded-full bg-zinc-200/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 backdrop-blur">
                    {formatDayLabel(message.createdAt)}
                  </span>
                </div>
              )}
              <div className={cn('animate-fade-in', startsCluster ? 'mt-2.5' : 'mt-0.5')}>
                <MessageBubble
                  message={message}
                  own={message.senderId === currentUserId || Boolean(message.pending)}
                  showSender={showSenderNames}
                  senderName={senderNameOf(message.senderId)}
                  isFirstOfGroup={startsCluster}
                  isLastOfGroup={endsCluster}
                  onRetry={onRetry}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bonus feature: unobtrusive "New messages" pill shown only when the
          user has scrolled away from the bottom and fresh messages arrived. */}
      {unseenCount > 0 && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 animate-pop-in rounded-full bg-zinc-900 py-2 pl-4 pr-3 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label={`${unseenCount} new ${unseenCount === 1 ? 'message' : 'messages'} — jump to latest`}
        >
          {unseenCount} new {unseenCount === 1 ? 'message' : 'messages'}
          <ArrowDown className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      {/* Floating jump-to-latest button while reading history */}
      {unseenCount === 0 && !isNearBottom && messages.length > 0 && (
        <JumpToLatest onClick={() => scrollToBottom('smooth')} />
      )}
    </div>
  );
}

function JumpToLatest({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-600 shadow-md border border-zinc-200 transition-colors hover:text-zinc-900"
      aria-label="Jump to latest message"
    >
      <ArrowDown className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
