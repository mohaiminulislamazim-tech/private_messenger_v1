import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Message } from '@/types';

interface UseMessageScrollOptions {
  /** active conversation id — resets scroll state when switching chats */
  conversationId: string;
  messages: Message[];
  /** conversation history finished loading (initial jump) */
  ready: boolean;
  /** callback when the user scrolls to the top — load older messages */
  onLoadOlder?: () => void;
  hasMore?: boolean;
  loadingOlder?: boolean;
}

const NEAR_BOTTOM_THRESHOLD = 120;
const LOAD_OLDER_THRESHOLD = 60;

/**
 * Intelligent auto-scroll behavior for the chat panel:
 *
 * - When a conversation opens, jumps straight to the latest message.
 * - While the user is near the bottom, new messages scroll into view smoothly.
 * - If the user scrolled up to read history, we never yank them down; instead
 *   we expose `unseenCount` so the UI can show a "New messages" pill.
 * - Scrolling to the top triggers `onLoadOlder` and preserves the reading
 *   position after older messages are prepended.
 */
export function useMessageScroll({ conversationId, messages, ready, onLoadOlder, hasMore, loadingOlder }: UseMessageScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);

  const lastCountRef = useRef(0);
  const initialJumpDoneRef = useRef(false);
  const prependRestoreRef = useRef<{ active: boolean; height: number }>({ active: false, height: 0 });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setUnseenCount(0);
    isNearBottomRef.current = true;
    setIsNearBottom(true);
  }, []);

  // Reset per-conversation state when switching chats or reloading history.
  useEffect(() => {
    initialJumpDoneRef.current = false;
    lastCountRef.current = 0;
    setUnseenCount(0);
    isNearBottomRef.current = true;
    setIsNearBottom(true);
    prependRestoreRef.current = { active: false, height: 0 };
  }, [conversationId, ready]);

  // React to new messages / initial load / prepends.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !ready) return;

    const count = messages.length;
    if (count === lastCountRef.current) return;

    const isFirstLoad = !initialJumpDoneRef.current && count > 0;
    const addedAtEnd = count > lastCountRef.current;

    if (isFirstLoad) {
      el.scrollTop = el.scrollHeight;
      initialJumpDoneRef.current = true;
      lastCountRef.current = count;
      return;
    }

    if (prependRestoreRef.current.active) {
      el.scrollTop = el.scrollHeight - prependRestoreRef.current.height;
      prependRestoreRef.current.active = false;
      lastCountRef.current = count;
      return;
    }

    if (addedAtEnd) {
      if (isNearBottomRef.current) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        setUnseenCount(0);
      } else {
        setUnseenCount((prev) => prev + (count - lastCountRef.current));
      }
    }
    lastCountRef.current = count;
  }, [messages, ready]);

  // Preserve reading position right before DOM updates from a prepend.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (loadingOlder) {
      prependRestoreRef.current = { active: true, height: el.scrollHeight };
    }
  }, [loadingOlder]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
    if (nearBottom !== isNearBottomRef.current) {
      isNearBottomRef.current = nearBottom;
      setIsNearBottom(nearBottom);
      if (nearBottom) setUnseenCount(0);
    }

    if (el.scrollTop < LOAD_OLDER_THRESHOLD && hasMore && !loadingOlder) {
      onLoadOlder?.();
    }
  }, [hasMore, loadingOlder, onLoadOlder]);

  return { containerRef, isNearBottom, unseenCount, scrollToBottom, handleScroll };
}
