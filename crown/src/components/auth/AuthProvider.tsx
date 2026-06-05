'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Session, User, SupabaseClient, Subscription } from '@supabase/supabase-js';
import { isConfigured } from '@/lib/supabase-config';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
  basePath: string;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signInWithEmail: async () => ({ error: 'Not configured' }),
  signInWithGoogle: async () => ({ error: 'Not configured' }),
  signOut: async () => {},
  isConfigured: false,
  basePath: '/crown',
});

function detectBasePath(): string {
  if (typeof window === 'undefined') return '/crown';
  const first = window.location.pathname.split('/').filter(Boolean)[0];
  if (first === 'crown') return '/crown';
  return '';
}

// Lazy-load supabase client (saves ~150KB on initial page bundle).
// Only fetched when user actually tries to authenticate.
async function getSupabase(): Promise<SupabaseClient> {
  const mod = await import('@/lib/supabase');
  return mod.supabase;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [basePath, setBasePath] = useState<string>('/crown');

  useEffect(() => {
    setBasePath(detectBasePath());
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let subscription: Subscription | null = null;

    (async () => {
      try {
        const supabase = await getSupabase();
        if (cancelled) return;

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session ?? null);
        setLoading(false);

        const { data: subData } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          setLoading(false);
        });
        subscription = subData.subscription;
      } catch {
        if (cancelled) return;
        setSession(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(() => {
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${basePath}/callback_route/`
        : undefined;

    return {
      session,
      user: session?.user ?? null,
      loading,
      isConfigured,
      basePath,
      signInWithEmail: async (email: string) => {
        if (!isConfigured) return { error: 'Supabase not configured' };
        const supabase = await getSupabase();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) return { error: error.message };
        return {};
      },
      signInWithGoogle: async () => {
        if (!isConfigured) return { error: 'Supabase not configured' };
        const supabase = await getSupabase();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) return { error: error.message };
        return {};
      },
      signOut: async () => {
        if (!isConfigured) return;
        const supabase = await getSupabase();
        await supabase.auth.signOut();
        setSession(null);
      },
    };
  }, [session, loading, basePath]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
