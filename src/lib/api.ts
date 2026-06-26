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
    // First try to get existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      // Check if token expires in less than 60 seconds
      const expiresAt = session.expires_at ?? 0;
      const nowSecs = Math.floor(Date.now() / 1000);
      if (expiresAt - nowSecs < 60) {
        // Proactively refresh
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed.session?.access_token) {
          headers['Authorization'] = `Bearer ${refreshed.session.access_token}`;
          return headers;
        }
      }
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

  const response = await fetch(url, { ...options, headers: authHeaders });

  // On 401, try to refresh session and retry once
  if (response.status === 401) {
    try {
      const supabase = await getSupabaseClient();
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session?.access_token) {
        const retryHeaders = {
          ...authHeaders,
          'Authorization': `Bearer ${refreshed.session.access_token}`
        };
        if (options.body instanceof FormData) delete retryHeaders['Content-Type'];
        return fetch(url, { ...options, headers: retryHeaders });
      }
    } catch (e) {
      console.error('[secureFetch] Token refresh failed:', e);
    }
  }

  return response;
}
