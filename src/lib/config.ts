/**
 * Central app configuration.
 * The public chat API has no secrets; the base URL defaults to the live
 * deployment so a missing .env cannot silently break requests.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://frontend-task-chatapp.onrender.com';
