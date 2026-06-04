'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isConfigured } from '@/lib/supabase';

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

/**
 * Detect the live basePath at runtime so the same AuthProvider works whether
 * the page is mounted under /crown/ (crown SPA) or under / (root site, when
 * a non-crown page embeds this component).
 */
function detectBasePath(): string {
  if (typeof window === 'undefined') return '/crown';
  const first = window.location.pathname.split('/').filter(Boolean)[0];
  if (first === 'crown') return '/crown';
  return '';
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

    // Initial hydrate from localStorage
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSession(null);
        setLoading(false);
      });

    // Long-lived auth listener — covers signin / signout / token refresh
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
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
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) return { error: error.message };
        return {};
      },
      signInWithGoogle: async () => {
        if (!isConfigured) return { error: 'Supabase not configured' };
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) return { error: error.message };
        return {};
      },
      signOut: async () => {
        if (!isConfigured) return;
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
