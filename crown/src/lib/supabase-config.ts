// supabase-config.ts — light constants, no client import.
// Importing this file does NOT pull @supabase/supabase-js into the bundle.

export const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
