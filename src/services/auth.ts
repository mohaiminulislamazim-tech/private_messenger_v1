import { apiFetch } from '@/lib/api';
import type { User } from '@/types';

export interface LoginResponse {
  token: string;
  user: User;
}

export function login(phone: string, name: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { phone, name },
  });
}

export function fetchCurrentUser(token: string): Promise<User> {
  return apiFetch<User>('/auth/me', { token });
}
