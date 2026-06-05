'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS } from '@/lib/brands';
import { useAuth } from '@/components/auth/AuthProvider';
import { isConfigured as isConfiguredSupabase } from '@/lib/supabase-config';

// Defer heavy components (WatchForm 21KB + LoginModal) until first interaction
const WatchForm = dynamic(() => import('@/components/WatchForm'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>Loading form…</div>,
});
const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), {
  ssr: false,
});

const SILVER = {
  stripe: 'rgba(180,195,215,0.5)',
  stripeBright: 'rgba(220,230,245,0.8)',
  glow: 'rgba(148,163,184,0.12)',
  accent: '#94A3B8',
  text: '#94A3B8',
  bg: '#111118',
};

/* ─── Editor's Pick — Seeded Curated Watches ─── */
const EDITORS_PICK_WATCHES: Watch[] = [
  { id: 'ep-001', brandId: 'rolex', model: 'Submariner Date', cardNumber: 7, imageUrl: '', ownerName: 'Crown Curator', createdAt: Date.parse('2026-01-15'), timePhilosophy: 'metal', philosophyNotes: 'The Diver. Forged for the abyss.' },
  { id: 'ep-002', brandId: 'omega', model: 'Speedmaster Pro', cardNumber: 19, imageUrl: '', ownerName: 'Crown Curator', createdAt: Date.parse('2026-01-22'), timePhilosophy: 'precision', philosophyNotes: 'Moonwatch. Certified by NASA.' },
  { id: 'ep-003', brandId: 'patek', model: 'Nautilus 5711', cardNumber: 42, imageUrl: '', ownerName: 'Crown Curator', createdAt: Date.parse('2026-02-03'), timePhilosophy: 'silence', philosophyNotes: 'The Grail. Discontinued, never forgotten.' },
  { id: 'ep-004', brandId: 'grand', model: 'Snowflake SBGA211', cardNumber: 56, imageUrl: '', ownerName: 'Crown Curator', createdAt: Date.parse('2026-02-14'), timePhilosophy: 'flow', philosophyNotes: 'Winter Sky. Spring drive, hand-finished.' },
  { id: 'ep-005', brandId: 'ap', model: 'Royal Oak 15500', cardNumber: 73, imageUrl: '', ownerName: 'Crown Curator', createdAt: Date.parse('2026-03-01'), timePhilosophy: 'metal', philosophyNotes: 'Tapisserie. Eight decades of steel geometry.' },
  { id: 'ep-006', brandId: 'tudor', model: 'Black Bay 58', cardNumber: 89, imageUrl: '', ownerName: 'Crown Curator', createdAt: Date.parse('2026-03-18'), timePhilosophy: 'precision', philosophyNotes: 'Boutique Edition. The modern classic.' },
];

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
    <Link href={`/me/`} prefetch={false} className="block">
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

/* ─── Waitlist Block ─── */
function WaitlistBlock() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [count, setCount] = useState<number | null>(null);

  // Load existing count on mount (local + would-be Supabase)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('crown-waitlist');
      const list: string[] = stored ? JSON.parse(stored) : [];
      setCount(list.length);
    } catch {
      setCount(0);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      // Local store (durable across page reloads)
      const stored = localStorage.getItem('crown-waitlist');
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(trimmed)) list.push(trimmed);
      localStorage.setItem('crown-waitlist', JSON.stringify(list));
      // Also fire-and-forget to Supabase via dynamic import (won't block first paint)
      try {
        const mod = await import('@/lib/supabase');
        if (mod.isConfigured) {
          await mod.supabase.from('waitlist').upsert({ email: trimmed, source: 'crown-hero' }, { onConflict: 'email' });
        }
      } catch { /* supabase not configured, local store is enough */ }
      setCount(list.length);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="hero-waitlist mt-16 md:mt-24">
      <div className="hero-waitlist-card">
        <div className="hero-waitlist-eyebrow">
          <span className="hero-waitlist-dot" aria-hidden="true" />
          <span>JOIN THE LIST</span>
        </div>
        <h3 className="hero-waitlist-title">
          Be first when the doors open.
        </h3>
        <p className="hero-waitlist-sub">
          Brushed Steel Edition launches with a small batch.
          Subscribers get early access + founder pricing.
        </p>

        {status === 'success' ? (
          <div className="hero-waitlist-success" role="status">
            <span className="hero-waitlist-check">✓</span>
            <span>You're on the list. Check your inbox.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="hero-waitlist-form" noValidate>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
              className="hero-waitlist-input"
              aria-label="Email address"
              aria-invalid={status === 'error'}
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="hero-waitlist-btn"
            >
              {status === 'submitting' ? '…' : '✦ NOTIFY ME'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="hero-waitlist-error" role="alert">
            Please enter a valid email.
          </p>
        )}

        {count !== null && count > 0 && (
          <p className="hero-waitlist-count">
            <strong>{count.toLocaleString()}</strong> {count === 1 ? 'collector' : 'collectors'} on the list
          </p>
        )}
      </div>
    </div>
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
      <Link href="/me/" prefetch={false} onClick={() => onTab('collection')} className={`mobile-bottom-nav-btn ${activeTab === 'collection' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Collection
      </Link>
    </nav>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  console.log('DBG isConfigured:', isConfiguredSupabase);
  console.log('DBG user:', user);
  console.log('DBG authLoading:', authLoading);
  const [showAddForm, setShowAddForm] = useState(false);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'collection'>('home');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getWatches(user?.id);
      setWatches(data);
      setLoading(false);
    };
    load();
    window.addEventListener('storage', load);
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => { window.removeEventListener('storage', load); clearTimeout(t); };
  }, [user?.id]);

  const handleTab = (tab: 'home' | 'add') => {
    setActiveTab(tab);
    setShowAddForm(tab === 'add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--deep-space)' }}>
      {/* ─── HUD Background Effects (decorative, deferred via CSS content-visibility) ─── */}
      <div className="hud-grid" aria-hidden="true" style={{ contentVisibility: 'auto' }} />
      <div className="particle-field" aria-hidden="true" style={{ contentVisibility: 'auto' }} />
      <div className="holo-overlay" aria-hidden="true" style={{ contentVisibility: 'auto' }} />

      {/* ─── Main Content ─── */}
      {/* (Top navbar provided globally by <GlobalNavbar /> in root layout) */}
      <div className="page-content">
        <div className="mobile-nav-safe">

          {/* Hero — v3.1 Brushed Steel × Water — Centered punch + Left-aligned trust */}
          {!showAddForm && (
            <section className={`relative pt-16 md:pt-28 pb-12 flex flex-col items-center md:items-start justify-center px-4 md:px-12 overflow-hidden transition-all duration-700 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ animation: heroVisible ? 'fadeIn 0.6s ease-out' : 'none' }}>
              {/* Top half: dial + H1 + CTA — center-punch group */}
              <div className="hero-punch text-center max-w-2xl mx-auto w-full">
                {/* Octagonal machined dial — live time */}
                <div className="dial-stack">
                  <div className="dial-ripple dial-ripple-1" />
                  <div className="dial-ripple dial-ripple-2" />
                  <div className="dial-ripple dial-ripple-3" />
                  <div className="dial-bezel" />
                  <div className="dial-face">
                    <div className="dial-crown">
                      <svg viewBox="0 0 192 192" fill="currentColor" stroke="none" className="watch-live">
                        {/* Hour: tip y=24, length 72 (~77% of minute). Pivot (96,96). */}
                        <polygon className="wm-hour" points="96,24 98.7,90 98.7,96 93.3,96 93.3,90"/>
                        {/* Minute: tip y=3, length 93. */}
                        <polygon className="wm-min" points="96,3 97.8,90 97.8,96 94.2,96 94.2,90"/>
                        <circle cx="96" cy="96" r="3.5"/>
                      </svg>
                    </div>
                    <div className="dial-index dial-index-12" />
                    <div className="dial-index dial-index-3" />
                    <div className="dial-index dial-index-6" />
                    <div className="dial-index dial-index-9" />
                  </div>
                </div>

                <div className="hero-eyebrow">
                  <span>BRUSHED STEEL EDITION</span>
                  <span className="sep">·</span>
                  <span>2026</span>
                </div>

                <h1 className="hero-title-brushed">
                  <span className="accent">YOUR WATCH.</span>
                  <br />
                  <span className="accent">YOUR LEGACY.</span>
                  <br />
                  <span className="accent">YOUR CROWN.</span>
                </h1>

                <p className="hero-tagline">FORGED IN METAL · CARRIED BY WATER</p>

                <p className="hero-sub">
                  Turn your timepiece collection into shareable identity cards.
                  Every watch, machined to its moment.
                </p>

                <div className="hero-ctas">
                  <button onClick={() => { if (user) { handleTab('add'); } else { setShowLogin(true); } }} className="btn btn-steel">
                    ✦ ADD YOUR WATCH
                  </button>
                  <Link href="/me/" prefetch={false} className="hero-text-link">
                    Explore 12 community cards →
                  </Link>
                </div>
              </div>

              {/* Bottom half: trust + authority — left-aligned, full-width grid */}
              <div className="hero-trust-block w-full text-left mt-12 md:mt-20">
                {/* Trust Strip — 03 Collectors · 07 Watches · 26 Edition */}
                <div className="hero-trust-strip">
                  <div className="hero-trust-item">
                    <div className="hero-trust-num">03</div>
                    <div className="hero-trust-label">Collectors</div>
                  </div>
                  <div className="hero-trust-sep" />
                  <div className="hero-trust-item">
                    <div className="hero-trust-num">07</div>
                    <div className="hero-trust-label">Watches</div>
                  </div>
                  <div className="hero-trust-sep" />
                  <div className="hero-trust-item">
                    <div className="hero-trust-num">26</div>
                    <div className="hero-trust-label">Edition</div>
                  </div>
                </div>

                {/* Authority Triad — Master · Founded · Seen In */}
                <div className="hero-authority">
                  <div className="authority-card">
                    <div className="authority-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="9" r="4"/>
                        <path d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5"/>
                        <path d="M9 9l1.2 1.2L13 7.5"/>
                      </svg>
                    </div>
                    <div className="authority-text">
                      <div className="authority-title">Master Watchmaker</div>
                      <div className="authority-sub">32 years · Geneva-trained</div>
                    </div>
                  </div>
                  <div className="authority-card">
                    <div className="authority-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 21V8l8-5 8 5v13"/>
                        <path d="M9 21v-7h6v7"/>
                        <path d="M4 13h16"/>
                      </svg>
                    </div>
                    <div className="authority-text">
                      <div className="authority-title">Founded 2024</div>
                      <div className="authority-sub">200+ collectors · 12 cities</div>
                    </div>
                  </div>
                  <div className="authority-card">
                    <div className="authority-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h16v12H4z"/>
                        <path d="M4 6l8 7 8-7"/>
                      </svg>
                    </div>
                    <div className="authority-text">
                      <div className="authority-title">As Seen In</div>
                      <div className="authority-sub">HODINKEE · Gear Patrol · Worn & Wound</div>
                    </div>
                  </div>
                </div>

                {/* Waitlist — collect emails for launch + Gumroad email blast */}
                <WaitlistBlock />
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
                <>
                  {/* Curated Editor's Pick — seeded to fill empty vault state */}
                  <div className="editors-pick-header">
                    <span className="editors-pick-tag">EDITOR'S PICK</span>
                    <span className="editors-pick-sub">Curated by Crown · Steel Edition</span>
                  </div>
                  <div className="watch-grid stagger-children">
                    {EDITORS_PICK_WATCHES.map((watch) => <WatchCardMini key={watch.id} watch={watch} />)}
                  </div>
                </>
              ) : (
                <div className="watch-grid stagger-children">
                  {watches.slice().reverse().map((watch) => <WatchCardMini key={watch.id} watch={watch} />)}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav activeTab={activeTab} showAddForm={showAddForm} onTab={(tab) => { if (tab === 'home') { handleTab('home'); } else { if (user) { handleTab('add'); } else { setShowLogin(true); } } }} />

        {!showAddForm && (
          <footer className="text-center py-8 px-4 text-[11px]" style={{ color: '#3a3d4e', fontFamily: 'var(--font-mono)' }}>
            CROWN — STEEL EDITION · Info-Architecture
          </footer>
        )}
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
// auto-deploy test 2
