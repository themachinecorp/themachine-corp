'use client';

import { useEffect, useState } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';

/**
 * Auth callback page.
 *
 * Single flow: any auth code in the URL is exchanged for a session.
 * The supabase-js client (configured with persistSession + localStorage
 * storageKey 'crown-auth') writes the session to localStorage automatically.
 * We then bounce to the crown /me page where the user can see their vault.
 *
 * We no longer read access_token / refresh_token from the URL — that's
 * the implicit flow, which we don't use. PKCE only.
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      window.location.href = '/crown/login/?error=not_configured';
      return;
    }

    let cancelled = false;

    const finish = (ok: boolean, errMsg?: string) => {
      if (cancelled) return;
      // Always strip the code/token from the address bar
      try {
        window.history.replaceState({}, document.title, '/crown/callback_route/');
      } catch {
        /* ignore */
      }
      window.location.href = ok
        ? '/crown/me/'
        : `/crown/login/?error=${encodeURIComponent(errMsg || 'auth_failed')}`;
    };

    // The supabase-js client with detectSessionInUrl:true handles most of this
    // automatically, but we run an explicit exchange for reliability across
    // static export + CF Pages edge behavior.
    (async () => {
      try {
        // 1) Drain any URL fragment the SDK may have already processed
        const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );

        if (exchangeErr) {
          // Fall back: maybe the session is already in storage
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            finish(true);
            return;
          }
          finish(false, exchangeErr.message);
          return;
        }

        if (data.session) {
          // Belt-and-braces: give the localStorage write a tick to flush
          await new Promise((r) => setTimeout(r, 50));
          finish(true);
          return;
        }

        // No error and no session — probably a non-auth visit to /callback/
        const { data: sessionData } = await supabase.auth.getSession();
        finish(!!sessionData.session);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'auth_failed';
        finish(false, msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#09090f' }}
    >
      <div className="text-center">
        <div className="text-5xl animate-pulse mb-4">👑</div>
        <div
          className="text-sm tracking-widest"
          style={{ color: error ? '#f87171' : '#686880' }}
        >
          {error ? error : 'Verifying magic link...'}
        </div>
      </div>
    </div>
  );
}
