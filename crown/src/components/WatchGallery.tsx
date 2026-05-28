'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS, TIER_CONFIG } from '@/lib/brands';
import { useAuth } from '@/components/auth/AuthProvider';

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

export default function WatchGallery() {
  const { user } = useAuth();
  const [watches, setWatches] = useState<Watch[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getWatches(user?.id);
      setWatches(data);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [user?.id]);

  if (watches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">⌚</div>
        <h3 className="text-xl font-bold text-white mb-2">No Watches Yet</h3>
        <p className="text-gray-400 mb-6">Start building your collection by adding your first watch.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 text-sm font-semibold rounded-full transition-all"
          style={{
            background: 'linear-gradient(135deg, #94A3B8, #64748B)',
            color: '#0a0a0a',
            boxShadow: '0 4px 20px #64748B30',
          }}
        >
          Add Your First Watch
        </Link>
      </div>
    );
  }

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
    <div>
      {/* Stats bar */}
      <div
        className="mb-8 p-5 rounded-2xl flex flex-wrap items-center gap-6"
        style={{ background: '#111118', border: '1px solid #1e1e2e' }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] tracking-widest text-gray-500 mb-1">COLLECTION POWER</span>
          <span className="text-3xl font-black" style={{ color: '#94A3B8' }}>{power}</span>
        </div>
        <div className="w-px h-10" style={{ background: '#1e1e2e' }} />
        <div className="flex flex-col">
          <span className="text-[10px] tracking-widest text-gray-500 mb-1">TOTAL PIECES</span>
          <span className="text-2xl font-bold text-white">{watches.length}</span>
        </div>
        <div className="w-px h-10" style={{ background: '#1e1e2e' }} />
        <div className="flex flex-col">
          <span className="text-[10px] tracking-widest text-gray-500 mb-1">BRANDS</span>
          <span className="text-2xl font-bold text-white">{uniqueBrands}</span>
        </div>
        <div className="w-px h-10" style={{ background: '#1e1e2e' }} />
        <div className="flex flex-row gap-4">
          {Object.entries(tierCounts).map(([tier, count]) => {
            const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
            return (
              <div key={tier} className="flex flex-col items-center">
                <span className="text-[10px] tracking-widest mb-1" style={{ color: config.accent }}>
                  {tier.toUpperCase()}
                </span>
                <span className="text-lg font-bold" style={{ color: config.text }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
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
                {/* Thumbnail */}
                <div
                  className="aspect-square flex items-center justify-center overflow-hidden"
                  style={{ background: '#00000020' }}
                >
                  {watch.imageUrl ? (
                    <img
                      src={watch.imageUrl}
                      alt={watch.model}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span className="text-5xl opacity-60">⌚</span>
                  )}
                </div>

                {/* Gradient overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 p-3"
                  style={{ background: `linear-gradient(transparent, ${config.bg}dd)` }}
                >
                  <div
                    className="text-[9px] tracking-widest mb-0.5"
                    style={{ color: config.accent }}
                  >
                    {brand.name.toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-white truncate">{watch.model}</div>
                </div>

                {/* Card number badge */}
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

                {/* Rarity stripe */}
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
  );
}