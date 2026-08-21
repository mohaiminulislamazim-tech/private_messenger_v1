import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '@/services/auth';

interface AuthState {
  token: string | null;
  user: authApi.LoginResponse['user'] | null;
  status: 'idle' | 'loading';
  error: string | null;
  login: (phone: string, name: string) => Promise<boolean>;
  restoreSession: () => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'pulse-auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: 'idle',
      error: null,

      login: async (phone, name) => {
        set({ status: 'loading', error: null });
        try {
          const { token, user } = await authApi.login(phone, name);
          set({ token, user, status: 'idle' });
          return true;
        } catch (err) {
          set({
            status: 'idle',
            error: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          });
          return false;
        }
      },

      /** Validate the persisted token against /auth/me; log out if it is dead. */
      restoreSession: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const user = await authApi.fetchCurrentUser(token);
          set({ user });
        } catch {
          get().logout();
        }
      },

      logout: () => {
        set({ token: null, user: null, status: 'idle', error: null });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
