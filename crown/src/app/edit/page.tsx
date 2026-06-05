'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import WatchForm from '@/components/WatchForm';
import { useAuth } from '@/components/auth/AuthProvider';

function EditInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = searchParams.get('id') || '';
  const [watch, setWatch] = useState<Watch | null | 'loading'>('loading');

  useEffect(() => {
    const load = async () => {
      const data = await getWatches(user?.id);
      const found = data.find((w) => w.id === id);
      setWatch(found ?? null);
    };
    if (id) load();
  }, [id, user?.id]);

  if (watch === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="inline-block w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#94A3B8', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4 opacity-40">⌧</div>
          <h1 className="text-2xl font-black text-white mb-2">Card not found</h1>
          <p className="text-sm text-gray-400 mb-6">This watch isn't in your collection.</p>
          <Link
            href="/me/"
            className="inline-block px-5 py-2.5 text-sm font-semibold rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg, #94A3B8, #64748B)', color: '#0a0a0a' }}
          >
            ← Back to collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 backdrop-blur-md" style={{ background: 'rgba(10,10,15,0.85)', borderBottom: '1px solid #1e1e2e' }}>
        <Link href={`/card/?id=${watch.id}`} className="text-xs font-semibold tracking-widest uppercase transition-colors" style={{ color: '#94A3B8' }}>
          ← Back to card
        </Link>
        <span className="text-[10px] font-mono tracking-widest" style={{ color: '#6b6d7e' }}>
          EDITING #{watch.cardNumber.toString().padStart(4, '0')}
        </span>
      </nav>

      <div className="px-4 sm:px-6 pt-6 max-w-md mx-auto">
        <h1 className="text-2xl font-black text-white mb-1">Edit Watch</h1>
        <p className="text-sm text-gray-400 mb-6">
          Update details for <span style={{ color: '#94A3B8' }}>{watch.model}</span>
        </p>

        <WatchForm initial={watch} returnToCardOnSave={true} />
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="inline-block w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#94A3B8', borderTopColor: 'transparent' }} />
      </div>
    }>
      <EditInner />
    </Suspense>
  );
}
