'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS, TIER_CONFIG } from '@/lib/brands';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';

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

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
  delay: number;
}

function StatCard({ label, value, accent = '#CBD5E1', delay }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`text-center transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="text-2xl sm:text-3xl font-black mb-0.5" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-[10px] tracking-widest uppercase" style={{ color: '#6b6d7e' }}>{label}</div>
    </div>
  );
}

function ProfileCard({ power, count, brands }: { power: number; count: number; brands: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{
        background: 'linear-gradient(145deg, #13151e 0%, #0d0f17 50%, #13151e 100%)',
        border: '1px solid rgba(160, 175, 200, 0.08)',
      }}
    >
      {/* Top silver edge */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(180,195,215,0.35) 30%, rgba(220,230,245,0.7) 50%, rgba(180,195,215,0.35) 70%, transparent 100%)',
      }} />
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(148, 163, 184, 0.07) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 p-6">
        {/* Bottom silver edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(180,195,215,0.2) 40%, rgba(220,230,245,0.5) 50%, rgba(180,195,215,0.2) 60%, transparent 100%)',
        }} />

        {/* Profile row */}
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar — silver ring */}
          <div className="avatar-ring flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: 'linear-gradient(145deg, #090a10, #12141c)',
                border: '1px solid rgba(160,175,200,0.06)',
              }}
            >
              👑
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white truncate">Watch Collector</h1>
            <p className="text-xs mt-0.5" style={{ color: '#6b6d7e' }}>
              @{count > 0 ? `collector_${count}` : 'newcomer'}
            </p>
            {/* Tier badge — all silver */}
            {count > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {power >= 50 ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(148,163,184,0.15)', color: '#CBD5E1', border: '1px solid rgba(148,163,184,0.3)' }}>
                    ★ Legendary
                  </span>
                ) : power >= 20 ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.3)' }}>
                    ◆ Epic
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(71,85,105,0.15)', color: '#94A3B8', border: '1px solid rgba(71,85,105,0.3)' }}>
                    ◆ Rare
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Big power number */}
        <div className="text-center mb-5 py-4 rounded-2xl" style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <div className="text-[9px] tracking-widest uppercase mb-1.5" style={{ color: '#6b6d7e' }}>
            COLLECTION POWER
          </div>
          <div
            className="text-5xl font-black"
            style={{
              background: 'linear-gradient(135deg, #64748B, #CBD5E1, #ffffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {power}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-around">
          <StatCard label="Pieces" value={count} accent="#CBD5E1" delay={200} />
          <div className="w-px h-10" style={{ background: 'rgba(160,175,200,0.08)' }} />
          <StatCard label="Brands" value={brands} accent="#CBD5E1" delay={300} />
          <div className="w-px h-10" style={{ background: 'rgba(160,175,200,0.08)' }} />
          <StatCard label="Score" value={power} accent="#E2E8F0" delay={400} />
        </div>
      </div>
    </div>
  );
}

function WatchCardGridItem({ watch, index }: { watch: Watch; index: number }) {
  const brand = BRANDS.find((b) => b.id === watch.brandId) || BRANDS[0];
  const config = TIER_CONFIG[brand.tier];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 60);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <Link href={`/card/?id=${watch.id}`} className="block">
      <div
        className={`metallic-card relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500 hover:scale-[1.04] hover:z-10 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Image */}
        <div className="aspect-square overflow-hidden" style={{ background: '#00000015' }}>
          {watch.imageUrl ? (
            <img
              src={watch.imageUrl}
              alt={watch.model}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-40">⌚</span>
            </div>
          )}
        </div>

        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `inset 0 0 30px ${config.glow}18` }}
        />

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 p-3"
          style={{ background: `linear-gradient(transparent, ${config.bg}dd)` }}
        >
          <div className="text-[9px] tracking-widest mb-0.5" style={{ color: config.accent }}>
            {brand.name.toUpperCase()}
          </div>
          <div className="text-sm font-bold text-white truncate">{watch.model}</div>
          <div className="text-[10px] font-mono mt-1 opacity-60" style={{ color: config.text }}>
            #{watch.cardNumber.toString().padStart(4, '0')}
          </div>
        </div>

        {/* Top rarity stripe — pure silver edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${config.border}80, ${config.accent}99, ${config.border}80, transparent)`,
          }}
        />

        {/* Card number badge */}
        <div
          className="absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `${config.border}18`,
            color: config.accent,
            border: `1px solid ${config.border}30`,
          }}
        >
          #{watch.cardNumber.toString().padStart(4, '0')}
        </div>
      </div>
    </Link>
  );
}

function SkeletonGridItem() {
  return (
    <div className="metallic-card rounded-2xl overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3">
        <div className="h-2.5 w-16 skeleton mb-2" />
        <div className="h-4 w-24 skeleton" />
      </div>
    </div>
  );
}

function TierBar({ watches }: { watches: Watch[] }) {
  const tierCounts = watches.reduce(
    (acc, w) => {
      const brand = BRANDS.find((b) => b.id === w.brandId);
      const t = brand?.tier || 'common';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const tiers = ['legendary', 'epic', 'rare', 'common'] as const;
  const total = watches.length || 1;

  return (
    <div className="metallic-card rounded-2xl p-4 flex items-center gap-4">
      <span className="text-[10px] tracking-widest uppercase" style={{ color: '#6b6d7e', whiteSpace: 'nowrap' }}>TIER</span>
      <div className="flex-1 flex gap-1.5">
        {tiers.map((tier) => {
          const config = TIER_CONFIG[tier];
          const count = tierCounts[tier] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={tier} className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] tracking-widest uppercase" style={{ color: config.accent }}>
                  {tier[0].toUpperCase()}
                </span>
                <span className="text-[8px] font-mono" style={{ color: config.text }}>{pct}%</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(160,175,200,0.05)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(to right, ${config.border}, ${config.accent})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SortKey = 'newest' | 'oldest' | 'tier' | 'brand' | 'cardnum';
type TierFilter = 'all' | 'legendary' | 'epic' | 'rare' | 'common';

// Today's Pick — rotates deterministically (one per day) through the collection.
// Same watch shown all day, then switches at local midnight.
function TodaysPick({ watches }: { watches: Watch[] }) {
  if (watches.length === 0) return null;
  // Day index: number of days since a fixed epoch
  const epoch = new Date('2026-01-01').getTime();
  const dayIndex = Math.floor((Date.now() - epoch) / (24 * 60 * 60 * 1000));
  // Weight higher-tier watches to be picked more often
  const tierWeight = { legendary: 8, epic: 4, rare: 2, common: 1 } as const;
  const weighted: number[] = [];
  watches.forEach((w, i) => {
    const tier = (BRANDS.find((b) => b.id === w.brandId)?.tier || 'common') as keyof typeof tierWeight;
    const weight = tierWeight[tier];
    for (let n = 0; n < weight; n++) weighted.push(i);
  });
  const idx = weighted[dayIndex % weighted.length];
  const pick = watches[idx];
  const brand = BRANDS.find((b) => b.id === pick.brandId) || BRANDS[0];
  const config = TIER_CONFIG[brand.tier];
  const pickDate = new Date(Date.now() - (Date.now() - epoch) % (24 * 60 * 60 * 1000));
  const dateStr = pickDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Link
      href={`/card/?id=${pick.id}`}
      className="block rounded-2xl overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, ${config.bg} 0%, #0d0f17 100%)`,
        border: `1px solid ${config.border}50`,
        boxShadow: `0 4px 24px ${config.border}10`,
      }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: '#00000040' }}
        >
          {pick.imageUrl ? (
            <img src={pick.imageUrl} alt={pick.model} className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <span className="text-3xl opacity-50">⌚</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] tracking-widest font-bold uppercase" style={{ color: config.accent }}>
              ✦ TODAY'S PICK · {dateStr}
            </span>
            <span className="text-[9px] tracking-widest uppercase" style={{ color: '#5a5a6e' }}>
              · {brand.tier}
            </span>
          </div>
          <h3 className="text-base font-black text-white truncate">{pick.model}</h3>
          <p className="text-[11px] truncate" style={{ color: config.text, opacity: 0.7 }}>
            {brand.name}
            {pick.year ? ` · ${pick.year}` : ''}
            {' · '}
            <span style={{ color: '#94A3B8' }}>#{pick.cardNumber.toString().padStart(4, '0')}</span>
          </p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#5a5a6e' }} className="flex-shrink-0">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>
    </Link>
  );
}

export default function MePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'collection'>('collection');
  const [showLogin, setShowLogin] = useState(false);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    const load = async () => {
      const data = await getWatches(user?.id);
      setWatches(data);
      setLoading(false);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [user?.id]);

  const power = computeCollectionPower(watches);
  const uniqueBrands = [...new Set(watches.map((w) => w.brandId))].length;

  // Filter + sort
  const filtered = (() => {
    const q = query.trim().toLowerCase();
    let list = watches;
    if (tierFilter !== 'all') {
      list = list.filter((w) => {
        const b = BRANDS.find((x) => x.id === w.brandId);
        return b?.tier === tierFilter;
      });
    }
    if (q) {
      list = list.filter((w) => {
        const b = BRANDS.find((x) => x.id === w.brandId);
        return (
          w.model.toLowerCase().includes(q) ||
          (b?.name || '').toLowerCase().includes(q) ||
          (w.year ? String(w.year).includes(q) : false) ||
          (w.philosophyNotes || '').toLowerCase().includes(q) ||
          ((w.philosophyTags || []).some((t) => t.toLowerCase().includes(q)))
        );
      });
    }
    const tierRank = { legendary: 4, epic: 3, rare: 2, common: 1 } as const;
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'tier': {
          const ta = tierRank[(BRANDS.find((x) => x.id === a.brandId)?.tier || 'common')];
          const tb = tierRank[(BRANDS.find((x) => x.id === b.brandId)?.tier || 'common')];
          return tb - ta;
        }
        case 'brand': {
          const ba = BRANDS.find((x) => x.id === a.brandId)?.name || '';
          const bb = BRANDS.find((x) => x.id === b.brandId)?.name || '';
          return ba.localeCompare(bb);
        }
        case 'cardnum': return b.cardNumber - a.cardNumber;
        default: return 0;
      }
    });
    return sorted;
  })();

  const hasActiveFilter = query !== '' || tierFilter !== 'all' || sort !== 'newest';
  const clearFilters = () => { setQuery(''); setTierFilter('all'); setSort('newest'); };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Global navbar (logo + user button) is rendered by root layout */}

      {/* ─── Main Content ─── */}
      <div className="mobile-nav-safe">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-16">

          {/* Back button + title */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs transition-colors silver-btn rounded-full px-4 py-2"
              style={{ color: '#6b6d7e' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Home
            </Link>
            <span style={{ color: '#3a3d4e' }}>/</span>
            <span className="text-xs" style={{ color: '#88889a' }}>My Collection</span>
          </div>

          {/* Profile card */}
          {!loading && (
            <ProfileCard
              power={power}
              count={watches.length}
              brands={uniqueBrands}
            />
          )}
          {loading && (
            <div className="rounded-3xl p-6 mb-4" style={{
              background: 'linear-gradient(145deg, #13151e 0%, #0d0f17 50%, #13151e 100%)',
              border: '1px solid rgba(160, 175, 200, 0.08)',
            }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full skeleton" />
                <div className="flex-1">
                  <div className="h-6 w-32 skeleton mb-2" />
                  <div className="h-3 w-24 skeleton" />
                </div>
              </div>
              <div className="h-16 rounded-2xl skeleton mb-4" />
              <div className="flex justify-around">
                <div className="h-10 w-16 skeleton" />
                <div className="h-10 w-16 skeleton" />
                <div className="h-10 w-16 skeleton" />
              </div>
            </div>
          )}

          {/* Tier breakdown bar */}
          {!loading && watches.length > 0 && (
            <div className="mt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <TierBar watches={watches} />
            </div>
          )}

          {/* Today's Pick — deterministic daily rotation through collection */}
          {!loading && watches.length > 0 && (
            <div className="mt-4">
              <TodaysPick watches={watches} />
            </div>
          )}

          {/* Gallery Section */}
          <div className="mt-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">My Vault</h2>
                <p className="text-xs" style={{ color: '#88889a' }}>
                  {loading ? '...' : `${watches.length} cards`}
                </p>
              </div>
              {watches.length > 0 && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#88889a' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#94A3B8' }} />
                  On-chain
                </div>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonGridItem key={i} />
                ))}
              </div>
            ) : watches.length === 0 ? (
              <div className="metallic-card rounded-3xl p-12 text-center">
                <div className="text-6xl mb-4 animate-float">👑</div>
                <h3 className="text-xl font-bold text-white mb-2">Your Vault is Empty</h3>
                <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                  Start your collection by adding your first timepiece.
                </p>
                <Link
                  href="/"
                  className="inline-block px-8 py-3 text-sm font-bold rounded-full transition-all silver-btn"
                  style={{ background: 'linear-gradient(135deg, #475569, #64748B, #94A3B8)', color: '#08080c', fontWeight: 700 }}
                >
                  ✦ Add First Watch
                </Link>
              </div>
            ) : (
              <>
              {/* Filter bar */}
              <div className="mb-4 p-3 rounded-2xl flex flex-wrap items-center gap-2" style={{ background: '#0e0e14', border: '1px solid #1e1e2e' }}>
                <div className="relative flex-1 min-w-[160px]">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#5a5a6e' }}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search model, brand, year, tag…"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg outline-none transition-colors"
                    style={{ background: '#0a0a12', border: '1px solid #1e1e2e', color: '#e5e7eb' }}
                    aria-label="Search watches"
                  />
                </div>
                <div className="flex items-center gap-1 flex-wrap" role="tablist" aria-label="Filter by tier">
                  {(['all', 'legendary', 'epic', 'rare', 'common'] as TierFilter[]).map((t) => {
                    const active = tierFilter === t;
                    const accent = t === 'all' ? '#94A3B8' : TIER_CONFIG[t].accent;
                    return (
                      <button
                        key={t}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTierFilter(t)}
                        className="px-2.5 py-1 text-[9px] tracking-widest uppercase font-bold rounded-lg transition-all"
                        style={{
                          background: active ? `${accent}20` : 'transparent',
                          color: active ? accent : '#6b6d7e',
                          border: `1px solid ${active ? `${accent}50` : '#1e1e2e'}`,
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="text-[10px] font-semibold tracking-wide px-2.5 py-2 rounded-lg outline-none cursor-pointer"
                  style={{ background: '#0a0a12', border: '1px solid #1e1e2e', color: '#94A3B8' }}
                  aria-label="Sort by"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="tier">Rarity ↓</option>
                  <option value="brand">A → Z</option>
                  <option value="cardnum">Card #</option>
                </select>
                {hasActiveFilter && (
                  <button onClick={clearFilters} className="text-[9px] tracking-widest uppercase font-semibold px-2.5 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }} aria-label="Clear all filters">
                    ✕ Clear
                  </button>
                )}
                <span className="ml-auto text-[9px] tracking-widest uppercase" style={{ color: '#5a5a6e' }}>
                  {filtered.length} / {watches.length}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-10 rounded-2xl" style={{ background: '#0e0e14', border: '1px solid #1e1e2e' }}>
                  <div className="text-3xl mb-2 opacity-40">⌖</div>
                  <p className="text-xs text-gray-400">No matches.</p>
                  <button onClick={clearFilters} className="mt-2 text-[10px] font-semibold tracking-wider underline" style={{ color: '#94A3B8' }}>
                    Clear filters
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
                {filtered.map((watch, i) => (
                  <WatchCardGridItem key={watch.id} watch={watch} index={i} />
                ))}
              </div>
              )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass lg:hidden"
        style={{ borderTop: '1px solid rgba(160, 175, 200, 0.06)' }}
      >
        <div className="h-16 flex items-center justify-around px-2">
          <Link
            href="/"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'home' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-[9px] tracking-wider">Home</span>
          </Link>

          <button
            onClick={() => { setActiveTab('add'); setShowAddForm(true); }}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'add' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center -mt-4 transition-all"
              style={{
                background: activeTab === 'add'
                  ? 'linear-gradient(135deg, #64748B, #94A3B8, #CBD5E1, #94A3B8)'
                  : 'linear-gradient(145deg, #1e2030, #14161e)',
                border: activeTab === 'add' ? 'none' : '1px solid rgba(160,175,200,0.12)',
                boxShadow: activeTab === 'add' ? '0 4px 16px rgba(148,163,184,0.3)' : 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'add' ? '#08080c' : '#64748B'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span className={`text-[9px] tracking-wider ${activeTab === 'add' ? 'text-white' : 'text-gray-500'}`}>Add</span>
          </button>

          <button
            onClick={() => setActiveTab('collection')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'collection' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'collection' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-[9px] tracking-wider">Collection</span>
          </button>
        </div>
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}