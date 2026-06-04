import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Supabase client singleton.
 *
 * Persistence strategy (per CEO spec):
 *   - persistSession: true     → @supabase/supabase-js default
 *   - storageKey: 'crown-auth' → shared key across ALL pages
 *   - storage: window.localStorage (explicit so behavior is obvious)
 *
 * Because storageKey is a fixed, well-known string, ANY page on the same
 * origin (root /, /crown/, /about/, etc.) that loads this same client
 * will see the same session — login is truly global.
 */
function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'crown-auth',
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          try {
            return window.localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.setItem(key, value);
          } catch {
            /* quota / private mode — ignore */
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.removeItem(key);
          } catch {
            /* ignore */
          }
        },
      },
    },
  });
}

export const supabase = createSafeClient();
