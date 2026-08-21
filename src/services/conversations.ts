import { apiFetch } from '@/lib/api';
import type { Conversation } from '@/types';

interface ConversationsResponse {
  data: Conversation[];
}

export async function fetchConversations(token: string): Promise<Conversation[]> {
  const res = await apiFetch<ConversationsResponse | Conversation[]>('/conversations', { token });
  // Defensive: the API wraps the list in { data }, but tolerate a bare array too.
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export function startDirectConversation(userId: string, token: string): Promise<Conversation> {
  return apiFetch<Conversation>('/conversations', {
    method: 'POST',
    token,
    body: { userId },
  });
}

export interface CreateGroupInput {
  name: string;
  participantIds: string[];
}

export function createGroup(input: CreateGroupInput, token: string): Promise<Conversation> {
  return apiFetch<Conversation>('/conversations/group', {
    method: 'POST',
    token,
    body: input,
  });
}

export function addParticipants(conversationId: string, userIds: string[], token: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${conversationId}/participants`, {
    method: 'POST',
    token,
    body: { userIds },
  });
}

export function removeParticipant(conversationId: string, userId: string, token: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${conversationId}/participants/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export function promoteToAdmin(conversationId: string, userId: string, token: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${conversationId}/admins`, {
    method: 'POST',
    token,
    body: { userId },
  });
}

export function renameGroup(conversationId: string, name: string, token: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${conversationId}`, {
    method: 'PATCH',
    token,
    body: { name },
  });
}
