import { getSupabaseClient } from './supabase';

/**
 * Helper to construct secure request headers with the current Supabase session JWT.
 */
export async function getAuthHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  try {
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('[AuthHeaders] Failed to retrieve Supabase JWT token:', err);
  }

  return headers;
}

/**
 * Drop-in replacement for fetch() that automatically injects the Supabase JWT.
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders((options.headers || {}) as Record<string, string>);

  // If the body is FormData, we let the browser set the Content-Type boundary automatically
  if (options.body instanceof FormData) {
    delete authHeaders['Content-Type'];
  }

  return fetch(url, {
    ...options,
    headers: authHeaders
  });
}
