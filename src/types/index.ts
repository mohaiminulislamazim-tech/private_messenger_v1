export interface User {
  _id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export interface LastMessage {
  text: string;
  sender: string;
  createdAt: string;
}

export interface GroupParticipant {
  _id: string;
  name: string;
  phone: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  lastMessage?: Partial<LastMessage> | null;
  updatedAt: string;
  /** direct only — the other user */
  participant?: User;
  /** group only */
  name?: string;
  createdBy?: string;
  admins?: string[];
  participants?: GroupParticipant[];
}

/** Shape returned by GET /conversations/:id/messages */
export interface RestMessage {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  createdAt: string;
}

/**
 * Normalized message used across the UI.
 * REST returns `_id` + ISO date; the socket returns `id` + epoch millis,
 * so both shapes are normalized into this single type.
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO
  /** client-side send state for optimistic messages */
  status?: 'sending' | 'sent' | 'failed';
  /** true while this is a local optimistic copy not yet confirmed by server */
  pending?: boolean;
}

export type { RestMessage as ApiMessage };
