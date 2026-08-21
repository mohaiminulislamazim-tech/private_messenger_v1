import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  /** id of the message currently being retried, if any */
  conversationLabel: string;
}

const MAX_LENGTH = 4000;

export function Composer({ onSend, disabled, conversationLabel }: ComposerProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !sending && !disabled;

  const handleSend = async () => {
    const text = value.trim();
    if (!text || sending || disabled) return;

    setSending(true);
    setSendError(null);
    setValue('');
    try {
      await onSend(text);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Message could not be sent.');
      setValue(text); // restore the draft so nothing is lost
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="border-t border-zinc-100 bg-white/90 px-3 py-3 backdrop-blur sm:px-4">
      {sendError && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
          {sendError}
        </p>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="message-composer" className="sr-only">
          Message {conversationLabel}
        </label>
        <textarea
          ref={textareaRef}
          id="message-composer"
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${conversationLabel}`}
          disabled={disabled}
          className="max-h-40 min-h-[44px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 transition-colors hover:border-zinc-300 focus:border-primary-500 disabled:bg-zinc-50 disabled:text-zinc-400"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-label={`Send message to ${conversationLabel}`}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-150',
            canSend
              ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:scale-95'
              : 'bg-zinc-100 text-zinc-400'
          )}
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-primary-600" aria-hidden="true" />
          ) : (
            <SendHorizontal className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
      <p className="mt-1.5 hidden px-1 text-[10px] text-zinc-400 sm:block">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
