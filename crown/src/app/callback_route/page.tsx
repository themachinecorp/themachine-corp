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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
      } else {
        router.push('/_auth/');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
      <div className="text-center">
        <div className="text-5xl animate-pulse mb-4">👑</div>
        <div className="text-sm tracking-widest" style={{ color: '#686880' }}>Verifying magic link...</div>
      </div>
    </div>
  );
}