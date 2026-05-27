'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import WatchForm from '@/components/WatchForm';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS, TIER_CONFIG } from '@/lib/brands';

function WatchCardMini({ watch }: { watch: Watch }) {
  const brand = BRANDS.find((b) => b.id === watch.brandId) || BRANDS[0];
  const config = TIER_CONFIG[brand.tier];

  return (
    <Link href={`/card/${watch.id}`} className="block">
      <div
        className="metallic-card relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:z-10"
      >
        {/* Image */}
        <div className="aspect-[4/5] overflow-hidden" style={{ background: '#00000015' }}>
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

        {/* Hover glow overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 40px ${config.border}18`,
          }}
        />

        {/* Bottom info */}
        <div
          className="absolute inset-x-0 bottom-0 p-3 transition-opacity duration-300"
          style={{ background: `linear-gradient(transparent, ${config.bg}ee)` }}
        >
          <div className="text-[9px] tracking-widest mb-0.5" style={{ color: config.accent }}>
            {brand.name.toUpperCase()}
          </div>
          <div className="text-sm font-bold text-white truncate">{watch.model}</div>
          <div
            className="text-[10px] font-mono mt-1 opacity-60"
            style={{ color: config.text }}
          >
            #{watch.cardNumber.toString().padStart(4, '0')}
          </div>
        </div>

        {/* Top rarity stripe — silver-to-gold edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(to right, rgba(180,195,215,0.3), ${config.border}, ${config.accent}, ${config.border}, rgba(180,195,215,0.3))`,
          }}
        />
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="metallic-card rounded-2xl overflow-hidden">
      <div className="aspect-[4/5] skeleton" />
      <div className="p-3">
        <div className="h-3 w-20 skeleton mb-2" />
        <div className="h-4 w-28 skeleton" />
      </div>
    </div>
  );
}

export default function Home() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'collection'>('home');

  useEffect(() => {
    const load = () => {
      setWatches(getWatches());
      setLoading(false);
    };
    load();
    window.addEventListener('storage', load);
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => {
      window.removeEventListener('storage', load);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* ─── Top Navigation Bar ─── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 glass"
        style={{ borderBottom: '1px solid rgba(160, 175, 200, 0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-2xl transition-transform duration-300 group-hover:scale-110"
              style={{ filter: 'drop-shadow(0 0 8px rgba(245,197,66,0.4))' }}
            >
              👑
            </span>
            <span
              className="text-sm font-black tracking-[0.25em] hidden sm:block"
              style={{
                background: 'linear-gradient(135deg, #F5C542, #FCD34D, #F5C542)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CROWN
            </span>
          </Link>

          {/* Nav Icons */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => { setActiveTab('home'); setShowAddForm(false); }}
              className={`nav-item flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                activeTab === 'home' && !showAddForm
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              title="Home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <button
              onClick={() => { setActiveTab('add'); setShowAddForm(true); }}
              className={`nav-item flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                showAddForm
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              title="Add Watch"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            <Link
              href="/me/"
              onClick={() => setActiveTab('collection')}
              className={`nav-item flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                activeTab === 'collection'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              title="My Collection"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="mobile-nav-safe">
        {/* Hero Section */}
        {!showAddForm && (
          <section
            className={`relative pt-14 min-h-[75vh] flex flex-col items-center justify-center px-4 overflow-hidden transition-all duration-700 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Deep space base */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, #0c0d14 0%, #090a10 50%, #0b0c12 100%)' }} />

            {/* Brushed steel diagonal bands */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(
                  115deg,
                  transparent 0px,
                  transparent 3px,
                  rgba(160, 170, 195, 0.02) 3px,
                  rgba(160, 170, 195, 0.02) 5px
                )`,
              }} />
              {/* Silver metallic highlight */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20" style={{
                background: 'radial-gradient(ellipse, rgba(180, 195, 220, 0.12) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }} />
              {/* Gold accent glow */}
              <div className="absolute top-20 left-[60%] w-[300px] h-[200px] rounded-full opacity-10" style={{
                background: 'radial-gradient(circle, rgba(245, 197, 66, 0.15) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }} />
            </div>

            {/* Noise texture */}
            <div className="absolute inset-0 pointer-events-none noise-texture" />

            {/* Silver top edge glow */}
            <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(180,195,215,0.3) 30%, rgba(245,197,66,0.6) 50%, rgba(180,195,215,0.3) 70%, transparent 100%)',
            }} />

            <div className="relative z-10 text-center max-w-2xl mx-auto stagger-children">
              {/* Crown — animated spin with glow */}
              <div
                className="text-7xl mb-6 animate-crown-spin"
                style={{ filter: 'drop-shadow(0 0 20px rgba(245,197,66,0.3))' }}
              >
                👑
              </div>

              {/* Headline — silver + gold shimmer */}
              <h1
                className="text-4xl sm:text-5xl font-black mb-4 leading-tight"
                style={{
                  background: 'linear-gradient(135deg, #c8ccd6 0%, #ffffff 30%, #F5C542 55%, #FCD34D 75%, #c8ccd6 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'silver-shimmer 4s ease infinite',
                }}
              >
                Your Watch.
                <br />
                <span style={{ color: '#ffffff', WebkitTextFillColor: 'white' }}>Your Legacy.</span>
              </h1>

              {/* Sub */}
              <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
                Turn your timepiece collection into shareable digital identity cards. Every watch tells a story.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => { setShowAddForm(true); setActiveTab('add'); }}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold rounded-full transition-all animate-pulse-glow gold-btn"
                >
                  ✦ Add Your Watch
                </button>
                <Link
                  href="/me/"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold rounded-full transition-all glass hover:bg-white/10 silver-btn"
                >
                  👑 View Collection
                </Link>
              </div>

              {/* Stats pills */}
              {watches.length > 0 && (
                <div className="flex gap-4 justify-center mt-8 animate-fade-in">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
                    <span style={{ color: '#F5C542' }}>⌚</span>
                    <span className="text-sm text-gray-300">{watches.length} cards</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
                    <span style={{ color: '#F5C542' }}>🏆</span>
                    <span className="text-sm text-gray-300">{[...new Set(watches.map(w => w.brandId))].length} brands</span>
                  </div>
                </div>
              )}
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <span className="text-[10px] tracking-widest" style={{ color: '#4a4d5e' }}>SCROLL</span>
              <div className="w-px h-6" style={{ background: 'linear-gradient(to bottom, rgba(180,195,215,0.4), transparent)' }} />
            </div>
          </section>
        )}

        {/* ─── Add Watch Form ─── */}
        {showAddForm && (
          <section
            className={`pt-24 pb-12 px-4 transition-all duration-500 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-gray-500 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors silver-btn rounded-full px-4 py-2"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-black text-white mb-1">Add a Watch</h2>
                <p className="text-sm text-gray-400">Create your digital watch card</p>
              </div>
              <div className="metallic-card rounded-3xl p-6">
                <WatchForm />
              </div>
            </div>
          </section>
        )}

        {/* ─── Gallery Section ─── */}
        {!showAddForm && (
          <section className="max-w-7xl mx-auto px-4 pb-16">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">
                  {watches.length > 0 ? 'Latest Cards' : 'Featured Watches'}
                </h2>
                <p className="text-xs" style={{ color: '#88889a' }}>
                  {watches.length > 0 ? `${watches.length} cards in the vault` : 'Be the first to add a watch'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#88889a' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F5C542' }} />
                Live
              </div>
            </div>

            {/* Masonry grid */}
            {loading ? (
              <div className="masonry-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : watches.length === 0 ? (
              <div className="metallic-card rounded-3xl p-12 text-center">
                <div className="text-6xl mb-4 animate-float">⌚</div>
                <h3 className="text-xl font-bold text-white mb-2">The Vault is Empty</h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                  No watch cards yet. Be the first to immortalize your collection on-chain.
                </p>
                <button
                  onClick={() => { setShowAddForm(true); setActiveTab('add'); }}
                  className="px-8 py-3 text-sm font-bold rounded-full gold-btn"
                >
                  ✦ Create First Card
                </button>
              </div>
            ) : (
              <div className="masonry-grid stagger-children">
                {watches.slice().reverse().map((watch) => (
                  <WatchCardMini key={watch.id} watch={watch} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass lg:hidden"
        style={{ borderTop: '1px solid rgba(160, 175, 200, 0.06)' }}
      >
        <div className="h-16 flex items-center justify-around px-2">
          <button
            onClick={() => { setShowAddForm(false); setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'home' && !showAddForm ? 'text-white' : 'text-gray-500'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'home' && !showAddForm ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-[9px] tracking-wider">Home</span>
          </button>

          <button
            onClick={() => { setShowAddForm(true); setActiveTab('add'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              showAddForm ? 'text-white' : 'text-gray-500'
            }`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center -mt-4 transition-all"
              style={{
                background: showAddForm
                  ? 'linear-gradient(135deg, #F5C542, #F59E0B)'
                  : 'linear-gradient(145deg, #1e2030, #14161e)',
                border: showAddForm ? 'none' : '1px solid rgba(160,175,200,0.12)',
                boxShadow: showAddForm ? '0 4px 16px rgba(245, 197, 66, 0.4)' : 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showAddForm ? '#08080c' : '#888'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span className={`text-[9px] tracking-wider ${showAddForm ? 'text-white' : 'text-gray-500'}`}>Add</span>
          </button>

          <Link
            href="/me/"
            onClick={() => setActiveTab('collection')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'collection' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'collection' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-[9px] tracking-wider">Collection</span>
          </Link>
        </div>
      </nav>

      {/* ─── Footer ─── */}
      {!showAddForm && (
        <footer className="text-center py-8 px-4 text-[11px]" style={{ color: '#3a3d4e' }}>
          <span>CROWN — Watch Collection Identity</span>
        </footer>
      )}
    </div>
  );
}