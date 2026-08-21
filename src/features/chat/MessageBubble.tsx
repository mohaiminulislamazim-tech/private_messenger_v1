import { memo } from 'react';
import { AlertTriangle, Check, Clock, RotateCw } from 'lucide-react';
import type { Message } from '@/types';
import { cn, formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  own: boolean;
  /** show sender name above the bubble (group chats) */
  showSender?: boolean;
  senderName?: string;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  onRetry: (messageId: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  own,
  showSender,
  senderName,
  isFirstOfGroup,
  isLastOfGroup,
  onRetry,
}: MessageBubbleProps) {
  const failed = message.status === 'failed';
  const sending = message.status === 'sending';

  return (
    <div className={cn('flex w-full gap-2.5', own ? 'justify-end' : 'justify-start')}>
      {!own && (
        <div className="w-7 shrink-0" aria-hidden="true">
          {isLastOfGroup && showSender && (
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 text-[10px] font-bold leading-7 text-center text-zinc-600">
              {senderName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      )}

      <div className={cn('flex max-w-[85%] flex-col sm:max-w-[70%]', own ? 'items-end' : 'items-start')}>
        {showSender && !own && isFirstOfGroup && (
          <span className="mb-0.5 px-1 text-xs font-semibold text-primary-700">{senderName}</span>
        )}

        <div
          className={cn(
            'group relative min-w-0 rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm',
            '[overflow-wrap:anywhere] whitespace-pre-wrap break-words',
            own
              ? 'rounded-br-md bg-primary-600 text-white'
              : 'rounded-bl-md border border-zinc-100 bg-white text-zinc-900',
            failed && 'opacity-90'
          )}
        >
          <span className="hyphens-none">{message.text}</span>
          <span
            aria-hidden="true"
            className={cn(
              'ml-2 inline-block select-none align-bottom text-[10px]',
              own ? 'text-primary-200' : 'text-zinc-400'
            )}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>

        <div className="mt-0.5 flex h-4 items-center gap-1 px-1">
          {sending && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
              <Clock className="h-3 w-3 animate-pulse" aria-hidden="true" /> Sending…
            </span>
          )}
          {message.status === 'sent' && !failed && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
              <Check className="h-3 w-3" aria-hidden="true" /> Sent
            </span>
          )}
          {failed && (
            <button
              onClick={() => onRetry(message.id)}
              className="inline-flex items-center gap-1 rounded px-1 text-[10px] font-semibold text-red-600 transition-colors hover:text-red-700"
              aria-label={`Message failed to send. Retry sending: ${message.text.slice(0, 50)}`}
            >
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Failed — tap to retry
              <RotateCw className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
