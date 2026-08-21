import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/config';

/**
 * Singleton manager for the app's single Socket.io connection.
 *
 * The API delivers realtime events over Socket.io at the server's ROOT origin
 * (not the /api REST base). A single connection is shared by the whole app to
 * avoid duplicate subscriptions; React components subscribe via the store.
 */
class SocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): Socket {
    if (this.socket && this.token === token) return this.socket;
    this.disconnect();

    this.token = token;
    this.socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    return this.socket;
  }

  get(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
    this.socket = null;
    this.token = null;
  }
}

export const socketManager = new SocketManager();
