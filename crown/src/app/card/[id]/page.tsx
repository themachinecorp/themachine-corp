'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WatchCard from '@/components/WatchCard';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS } from '@/lib/brands';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [watch, setWatch] = useState<Watch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    getWatches(user?.id).then((watches) => {
      const found = watches.find((w) => w.id === id);
      if (!found) {
        router.push('/me/');
        return;
      }
      setWatch(found);
      setLoading(false);
    });
  }, [params.id, user?.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-4">👑</div>
          <div className="text-sm text-gray-500 tracking-widest">Loading...</div>
        </div>
      </div>
    );
  }

  if (!watch) return null;

  const brand = BRANDS.find((b) => b.id === watch.brandId) || BRANDS[0];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4"
      style={{ background: '#09090f' }}
    >
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid rgba(160,175,200,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/me/" className="flex items-center gap-2">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px rgba(180,195,215,0.4))' }}>👑</span>
            <span className="text-sm font-black tracking-[0.25em] hidden sm:block" style={{ color: '#94A3B8' }}>CROWN</span>
          </Link>
          <Link
            href="/me/"
            className="text-xs px-4 py-2 rounded-full transition-all"
            style={{ background: 'rgba(148,163,184,0.1)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.2)' }}
          >
            ← My Collection
          </Link>
        </div>
      </div>

      {/* Card display */}
      <div className="pt-16">
        <WatchCard watch={watch} brand={brand} />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[10px]" style={{ color: '#3a3d4e', fontFamily: 'var(--font-mono)' }}>
        CROWN — STEEL EDITION · Card #{watch.cardNumber.toString().padStart(4, '0')}
      </div>
    </div>
  );
}