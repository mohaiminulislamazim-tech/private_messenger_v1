import { apiFetch } from '@/lib/api';
import type { User } from '@/types';

/**
 * Search users by name or phone.
 *
 * Known API quirks (probed against the live deployment):
 * 1. The server builds a RegExp from `q`, so a leading "+" (common in phone
 *    numbers) causes HTTP 500 ("Regular expression is invalid"). We escape
 *    regex metacharacters before sending.
 * 2. Matching is NAME-PREFIX only: "Ahasan" matches but "hasan" does not,
 *    and the phone field is never searched — even an exact existing phone
 *    number returns [].
 * 3. `q=` (empty) returns users sorted OLDEST-first, hard-capped at 50, with
 *    no pagination — so recently registered users are missing from that list.
 *
 * Strategy:
 * - Text-only queries use the fast server-side prefix search directly.
 * - Queries containing digits run two lookups in parallel and merge results:
 *   (a) the server-side prefix search on the alphabetic portion of the query
 *       (works for any user, e.g. "Ada 1234" → search "Ada"), filtered
 *       client-side to the full query, and
 *   (b) the capped full list filtered by phone/name substring (covers phone
 *       lookups for older accounts).
 * Pure-digit phone lookups therefore only cover the 50 oldest accounts; this
 * API limitation is documented in the README rather than hidden.
 */
export async function searchUsers(query: string, token: string, signal?: AbortSignal): Promise<User[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const escaped = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (!/\d/.test(trimmed)) {
    const results = await apiFetch<User[]>(`/users/search?q=${encodeURIComponent(escaped(trimmed))}`, {
      token,
      signal,
    });
    return Array.isArray(results) ? results : [];
  }

  // Digit-bearing query: combine server-side name search (alpha part) with a
  // client-side phone/name substring pass over the capped full list.
  const alphaPart = trimmed.replace(/[\d\s\-()+]+$/, '').trim(); // drop trailing digits
  const q = trimmed.toLowerCase();

  const [prefixed, everyone] = await Promise.all([
    alphaPart.length >= 2
      ? apiFetch<User[]>(`/users/search?q=${encodeURIComponent(escaped(alphaPart))}`, { token, signal }).catch(
          () => []
        )
      : Promise.resolve([] as User[]),
    apiFetch<User[]>('/users/search?q=', { token, signal }).catch(() => [] as User[]),
  ]);

  const matches = new Map<string, User>();
  for (const u of Array.isArray(prefixed) ? prefixed : []) {
    if (`${u.name} ${u.phone}`.toLowerCase().includes(q)) matches.set(u._id, u);
  }
  for (const u of Array.isArray(everyone) ? everyone : []) {
    if (u.phone.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)) matches.set(u._id, u);
  }
  return [...matches.values()];
}
