'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isConfigured } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured) {
      router.push('/');
      return;
    }

    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/me/');
      } else {
        router.push('/');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
      <div className="text-center">
        <div className="text-5xl mb-6 animate-pulse">👑</div>
        <div className="text-sm text-gray-500 tracking-widest uppercase">Verifying magic link...</div>
      </div>
    </div>
  );
}