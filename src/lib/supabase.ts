import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClientPromise: Promise<SupabaseClient> | null = null;
let supabaseClient: SupabaseClient | null = null;

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) return supabaseClient;
  if (!supabaseClientPromise) {
    supabaseClientPromise = fetch('/api/auth/config')
      .then((res) => res.json())
      .then((config) => {
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
          throw new Error('Supabase client config missing from server.');
        }
        supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
        return supabaseClient;
      });
  }
  return supabaseClientPromise;
}
