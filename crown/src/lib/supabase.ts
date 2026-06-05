// supabase.ts — Supabase client singleton (lazy).
// Importing this file DOES pull @supabase/supabase-js (~150KB) into bundle.
// Use dynamic import: `const { supabase } = await import('./supabase')`
// For just the configured-constant, use './supabase-config' (light).

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config';

// Re-export isConfigured for backward compat (delegates to light config).
export { isConfigured } from './supabase-config';

function createSafeClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return createClient('https://placeholder.example.invalid', 'placeholder-anon-key-not-real');
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
