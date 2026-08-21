import { API_BASE_URL } from '@/lib/config';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: { path: string; message: string }[];

  constructor(message: string, code: string, status: number, details?: { path: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper around the Chat API.
 * Normalizes errors into ApiError (the API returns { error: { message, code, details? } }).
 * Network failures are surfaced as ApiError with code NETWORK_ERROR.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(
      'Cannot reach the server. Check your internet connection and try again.',
      'NETWORK_ERROR',
      0
    );
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON body — fall through with null
    }
  }

  if (!res.ok) {
    const err = (data as { error?: { message?: string; code?: string; details?: { path: string; message: string }[] } })?.error;
    throw new ApiError(
      err?.message ?? `Request failed with status ${res.status}`,
      err?.code ?? 'UNKNOWN',
      res.status,
      err?.details
    );
  }

  return data as T;
}
