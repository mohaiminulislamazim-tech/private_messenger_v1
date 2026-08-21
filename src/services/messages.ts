import { apiFetch } from '@/lib/api';
import type { Message, RestMessage } from '@/types';

interface MessagesResponse {
  messages: RestMessage[];
  hasMore: boolean;
}

export function normalizeMessage(raw: RestMessage): Message {
  return {
    id: raw._id,
    conversationId: raw.conversation,
    senderId: raw.sender,
    text: raw.text,
    createdAt: raw.createdAt,
  };
}

export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
}

/**
 * Fetch a page of message history. Messages are returned newest-first by the
 * API; we reverse them here so the UI always works with oldest-first order.
 *
 * `before` is the id of the oldest message currently loaded (cursor pagination).
 */
export async function fetchMessages(
  conversationId: string,
  token: string,
  options: { limit?: number; before?: string; signal?: AbortSignal } = {}
): Promise<MessagePage> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', String(options.limit));
  if (options.before) params.set('before', options.before);
  const qs = params.toString();

  const res = await apiFetch<MessagesResponse>(
    `/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`,
    { token, signal: options.signal }
  );

  return {
    messages: (res.messages ?? []).map(normalizeMessage).reverse(),
    hasMore: Boolean(res.hasMore),
  };
}

export function sendMessage(conversationId: string, text: string, token: string): Promise<Message> {
  return apiFetch<RestMessage>('/messages', {
    method: 'POST',
    token,
    body: { conversationId, text },
  }).then(normalizeMessage);
}
