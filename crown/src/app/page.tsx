'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import WatchForm from '@/components/WatchForm';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS } from '@/lib/brands';

const SILVER = {
  stripe: 'rgba(180,195,215,0.5)',
  stripeBright: 'rgba(220,230,245,0.8)',
  glow: 'rgba(148,163,184,0.12)',
  accent: '#94A3B8',
  text: '#94A3B8',
  bg: '#111118',
};

/* ─── Live Clock ─── */
function LiveClock() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `UTC+8 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(`UTC+8 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="live-timestamp flicker" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(148,163,184,0.65)', letterSpacing: '0.08em' }}>{time}</span>;
}

/* ─── Particle Field ─── */
function ParticleField() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const particles: { el: HTMLDivElement; x: number; y: number; speed: number; size: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const div = document.createElement('div');
      div.className = 'particle';
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const speed = 8 + Math.random() * 20;
      const size = 1 + Math.random() * 2;
      div.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-duration:${speed}s;animation-delay:${-Math.random() * speed}s`;
      el.appendChild(div);
      particles.push({ el: div, x, y, speed, size });
    }
    return () => { particles.forEach(p => p.el.remove()); };
  }, []);
  return <div ref={ref} className="particle-field" />;
}

/* ─── Watch Card — Steel Edition ─── */
function WatchCardMini({ watch }: { watch: Watch }) {
  const brand = BRANDS.find((b) => b.id === watch.brandId) || BRANDS[0];
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/me/`} className="block">
      <div
        className="watch-card-wrapper rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:z-10"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {/* Image */}
        <div className="steel-bezel" style={{ overflow: 'hidden', background: '#08080e', marginBottom: 0 }}>
          {watch.imageUrl ? (
            <img
              src={watch.imageUrl}
              alt={watch.model}
              className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-110"
              crossOrigin="anonymous"
              style={{ filter: hov ? 'brightness(1.08) contrast(1.06) saturate(0.88)' : 'brightness(0.78) contrast(1.06) saturate(0.88)' }}
            />
          ) : (
            <div className="w-full aspect-[4/5] flex items-center justify-center" style={{ background: '#08080e' }}>
              <span className="text-6xl opacity-30">⌚</span>
            </div>
          )}
          {/* Brushed steel top band */}
          <div className="brushed-h" style={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: '18%', opacity: 0.95 }} />
          {/* Brushed steel bottom band */}
          <div className="brushed-h" style={{ position: 'absolute', bottom: 0, left: '18%', right: '18%', height: '18%', opacity: 0.95 }} />
          {/* Dark gradient bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(8,8,14,0.9), transparent)' }} />
          {/* Scan line */}
          <div className="scan-line" />
          {/* Silver corner brackets */}
          <div className="corner-tl" />
          <div className="corner-tr" />
          <div className="corner-bl" />
          <div className="corner-br" />
          {/* Crown crown-worn indicator */}
          <div style={{ position: 'absolute', top: 8, right: 8, width: 4, height: 22, background: 'linear-gradient(180deg,rgba(226,232,240,0.35) 0%,rgba(148,163,184,0.25) 50%,rgba(226,232,240,0.35) 100%)', borderRadius: 1 }} />
        </div>
        {/* Info */}
        <div className="p-3" style={{ background: '#0c0c11' }}>
          <div className="text-[9px] tracking-widest mb-0.5" style={{ color: SILVER.accent, fontFamily: 'var(--font-mono)' }}>
            {brand.name.toUpperCase()}
          </div>
          <div className="text-sm font-bold text-white truncate">{watch.model}</div>
          <div className="text-[10px] font-mono mt-1" style={{ color: 'rgba(148,163,184,0.5)' }}>
            #{watch.cardNumber.toString().padStart(4, '0')}
          </div>
        </div>
        {/* Top silver edge */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${SILVER.stripe}, ${SILVER.stripeBright}, ${SILVER.stripe}, transparent)` }} />
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="watch-card-wrapper rounded-2xl overflow-hidden">
      <div className="aspect-[4/5] skeleton" />
      <div className="p-3" style={{ background: '#0c0c11' }}>
        <div className="h-3 w-20 skeleton mb-2" />
        <div className="h-4 w-28 skeleton" />
      </div>
    </div>
  );
}

/* ─── Mobile Bottom Nav ─── */
function MobileBottomNav({ activeTab, showAddForm, onTab }: {
  activeTab: string; showAddForm: boolean;
  onTab: (tab: 'home'|'add'|'collection') => void;
}) {
  return (
    <nav className="mobile-bottom-nav lg:hidden">
      <button onClick={() => onTab('home')} className={`mobile-bottom-nav-btn ${activeTab === 'home' && !showAddForm ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Home
      </button>
      <button onClick={() => onTab('add')} className={`mobile-bottom-nav-btn ${showAddForm ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Add
      </button>
      <Link href="/me/" onClick={() => onTab('collection')} className={`mobile-bottom-nav-btn ${activeTab === 'collection' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Collection
      </Link>
    </nav>
  );
}

export default function Home() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'collection'>('home');

  useEffect(() => {
    const load = () => { setWatches(getWatches()); setLoading(false); };
    load();
    window.addEventListener('storage', load);
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => { window.removeEventListener('storage', load); clearTimeout(t); };
  }, []);

  const handleTab = (tab: 'home' | 'add') => {
    setActiveTab(tab);
    setShowAddForm(tab === 'add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--deep-space)' }}>
      {/* ─── HUD Background Effects ─── */}
      <div className="hud-grid" />
      <ParticleField />
      <div className="holo-overlay" />

      {/* ─── Top Navigation Bar ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 navbar">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px rgba(180,195,215,0.4))' }}>👑</span>
            <span className="text-sm font-black tracking-[0.25em] hidden sm:block hero-title" style={{ fontSize: 13 }}>CROWN</span>
          </Link>
          <div className="flex items-center gap-3" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <span style={{ color: 'rgba(148,163,184,0.5)', letterSpacing: '0.1em' }}>STEEL EDITION</span>
            <span style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />
            <LiveClock />
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="page-content">
        <div className="mobile-nav-safe">

          {/* Hero */}
          {!showAddForm && (
            <section className={`relative pt-14 min-h-[75vh] flex flex-col items-center justify-center px-4 overflow-hidden transition-all duration-700 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ animation: heroVisible ? 'fadeIn 0.6s ease-out' : 'none' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, #0c0d14 0%, #090a10 50%, #0b0c12 100%)' }} />
              <div className="absolute inset-0 noise-texture" />
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(180,195,215,0.3), rgba(220,230,245,0.7), rgba(180,195,215,0.3), transparent)' }} />
              <div className="relative z-10 text-center max-w-2xl mx-auto stagger-children">
                <div className="text-7xl mb-6" style={{ filter: 'drop-shadow(0 0 20px rgba(180,195,215,0.35))' }}>👑</div>
                <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight hero-title">
                  Your Watch.<br /><span style={{ color: '#ffffff' }}>Your Legacy.</span>
                </h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
                  Precision Craft · STEEL EDITION
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => handleTab('add')} className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold rounded-full transition-all animate-pulse-glow"
                    style={{ background: 'linear-gradient(135deg, #475569, #64748B, #94A3B8, #CBD5E1)', color: '#08080c', fontWeight: 700 }}>
                    ✦ Add Your Watch
                  </button>
                  <Link href="/me/" className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold rounded-full glass hover:bg-white/10 transition-all">
                    👑 View Collection
                  </Link>
                </div>
                {watches.length > 0 && (
                  <div className="flex gap-4 justify-center mt-8">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
                      <span style={{ color: '#94A3B8' }}>⌚</span>
                      <span className="text-sm text-gray-300">{watches.length} cards</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
                      <span style={{ color: '#94A3B8' }}>🏆</span>
                      <span className="text-sm text-gray-300">{[...new Set(watches.map(w => w.brandId))].length} brands</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Add Form */}
          {showAddForm && (
            <section className="pt-24 pb-16 px-4">
              <div className="max-w-md mx-auto">
                <button onClick={() => handleTab('home')} className="text-xs mb-4 inline-flex items-center gap-1 transition-colors silver-btn rounded-full px-4 py-2" style={{ color: '#6b6d7e' }}>
                  ← Back
                </button>
                <h2 className="text-2xl font-black text-white mb-1">Add a Watch</h2>
                <p className="text-sm text-gray-400 mb-6">Precision Craft · Steel Edition</p>
                <div className="metallic-card rounded-3xl p-6">
                  <WatchForm />
                </div>
              </div>
            </section>
          )}

          {/* Gallery */}
          {!showAddForm && (
            <section className="max-w-7xl mx-auto px-4 pb-16">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">
                    {watches.length > 0 ? 'Latest Cards' : 'Featured Watches'}
                  </h2>
                  <p className="text-xs" style={{ color: '#88889a', fontFamily: 'var(--font-mono)' }}>
                    {watches.length > 0 ? `${watches.length} cards in the vault` : 'Be the first to add a watch'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#88889a', fontFamily: 'var(--font-mono)' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#94A3B8' }} />
                  LIVE
                </div>
              </div>
              {loading ? (
                <div className="watch-grid">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : watches.length === 0 ? (
                <div className="metallic-card rounded-3xl p-12 text-center">
                  <div className="text-6xl mb-4 animate-float">⌚</div>
                  <h3 className="text-xl font-bold text-white mb-2">The Vault is Empty</h3>
                  <p className="text-gray-400 mb-6 max-w-sm mx-auto">No watch cards yet. Be the first to immortalize your collection.</p>
                  <button onClick={() => handleTab('add')} className="px-8 py-3 text-sm font-bold rounded-full transition-all"
                    style={{ background: 'linear-gradient(135deg, #475569, #64748B, #94A3B8)', color: '#08080c', fontWeight: 700 }}>
                    ✦ Create First Card
                  </button>
                </div>
              ) : (
                <div className="watch-grid stagger-children">
                  {watches.slice().reverse().map((watch) => <WatchCardMini key={watch.id} watch={watch} />)}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav activeTab={activeTab} showAddForm={showAddForm} onTab={(tab) => tab === 'home' ? handleTab('home') : handleTab('add')} />

        {!showAddForm && (
          <footer className="text-center py-8 px-4 text-[11px]" style={{ color: '#3a3d4e', fontFamily: 'var(--font-mono)' }}>
            CROWN — STEEL EDITION · Info-Architecture
          </footer>
        )}
      </div>
    </div>
  );
}