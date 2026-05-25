'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS, TIER_CONFIG } from '@/lib/brands';

function computeCollectionPower(watches: Watch[]): number {
  if (watches.length === 0) return 0;
  const tierWeights = { legendary: 25, epic: 10, rare: 5, common: 2 };
  const base = watches.reduce((sum, w) => {
    const brand = BRANDS.find((b) => b.id === w.brandId);
    return sum + (tierWeights[brand?.tier || 'common'] || 2);
  }, 0);
  const varietyBonus = [...new Set(watches.map((w) => w.brandId))].length * 3;
  return base + varietyBonus + watches.length * 1;
}

export default function MePage() {
  const [watches, setWatches] = useState<Watch[]>([]);

  useEffect(() => {
    const load = () => setWatches(getWatches());
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const power = computeCollectionPower(watches);
  const uniqueBrands = [...new Set(watches.map((w) => w.brandId))].length;
  const tierCounts = watches.reduce(
    (acc, w) => {
      const brand = BRANDS.find((b) => b.id === w.brandId);
      const t = brand?.tier || 'common';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="relative py-10 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(245, 197, 66, 0.08) 0%, transparent 55%)',
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-yellow-400 transition-colors mb-8">
            ← Back to Home
          </Link>

          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
              style={{ background: 'linear-gradient(135deg, #F5C542, #F59E0B)' }}
            >
              👑
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Collector</h1>
            <p className="text-gray-500 text-xs">@{watches.length > 0 ? `watch_collector_${watches.length}` : 'new_member'}</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <div
          className="p-6 rounded-2xl"
          style={{ background: '#111118', border: '1px solid #1e1e2e' }}
        >
          {/* Collection Power - big */}
          <div className="text-center mb-6">
            <div className="text-[10px] tracking-widest text-gray-500 mb-2">COLLECTION POWER</div>
            <div className="text-6xl font-black" style={{ color: '#F5C542' }}>{power}</div>
          </div>

          {/* Stats row */}
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{watches.length}</div>
              <div className="text-[10px] tracking-widest text-gray-500 mt-1">PIECES</div>
            </div>
            <div className="w-px h-10" style={{ background: '#1e1e2e' }} />
            <div className="text-center">
              <div className="text-2xl font-black text-white">{uniqueBrands}</div>
              <div className="text-[10px] tracking-widest text-gray-500 mt-1">BRANDS</div>
            </div>
            <div className="w-px h-10" style={{ background: '#1e1e2e' }} />
            <div className="flex gap-4">
              {(['legendary', 'epic', 'rare', 'common'] as const).map((tier) => {
                const config = TIER_CONFIG[tier];
                const count = tierCounts[tier] || 0;
                return (
                  <div key={tier} className="text-center">
                    <div className="text-lg font-black" style={{ color: config.text }}>{count}</div>
                    <div className="text-[8px] tracking-widest" style={{ color: config.accent }}>{tier.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        {watches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⌚</div>
            <h3 className="text-xl font-bold text-white mb-2">No Watches Yet</h3>
            <p className="text-gray-400 mb-6">Start building your collection</p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 text-sm font-semibold rounded-full transition-all"
              style={{
                background: 'linear-gradient(135deg, #F5C542, #F59E0B)',
                color: '#0a0a0a',
              }}
            >
              Add Your First Watch
            </Link>
          </div>
        ) : (
          <div>
            <div className="text-[10px] tracking-widest text-gray-500 mb-4 uppercase">My Collection</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watches.map((watch) => {
                const brand = BRANDS.find((b) => b.id === watch.brandId) || BRANDS[0];
                const config = TIER_CONFIG[brand.tier];

                return (
                  <Link key={watch.id} href={`/card/${watch.id}`}>
                    <div
                      className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]"
                      style={{
                        background: config.bg,
                        boxShadow: `0 4px 20px ${config.border}15`,
                      }}
                    >
                      <div
                        className="aspect-square flex items-center justify-center overflow-hidden"
                        style={{ background: '#00000020' }}
                      >
                        {watch.imageUrl ? (
                          <img src={watch.imageUrl} alt={watch.model} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                          <span className="text-5xl opacity-60">⌚</span>
                        )}
                      </div>

                      <div
                        className="absolute inset-x-0 bottom-0 p-3"
                        style={{ background: `linear-gradient(transparent, ${config.bg}dd)` }}
                      >
                        <div className="text-[9px] tracking-widest mb-0.5" style={{ color: config.accent }}>
                          {brand.name.toUpperCase()}
                        </div>
                        <div className="text-sm font-bold text-white truncate">{watch.model}</div>
                      </div>

                      <div
                        className="absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-1 rounded-lg"
                        style={{
                          background: `${config.border}30`,
                          color: config.accent,
                          border: `1px solid ${config.border}50`,
                        }}
                      >
                        #{watch.cardNumber.toString().padStart(4, '0')}
                      </div>

                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ background: `linear-gradient(to right, ${config.border}, ${config.accent}80)` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}