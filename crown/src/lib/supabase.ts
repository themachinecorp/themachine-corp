import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a safe client — when not configured, provide stub methods so the app still builds
function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that won't crash the build
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSafeClient();