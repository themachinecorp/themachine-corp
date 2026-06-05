'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWatches, deleteWatch } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS, TIER_CONFIG } from '@/lib/brands';
import { useAuth } from '@/components/auth/AuthProvider';

function CardDetailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = searchParams.get('id') || '';
  const [watch, setWatch] = useState<Watch | null | 'loading'>('loading');
  const [allWatches, setAllWatches] = useState<Watch[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getWatches(user?.id);
      setAllWatches(data);
      const found = data.find((w) => w.id === id);
      setWatch(found ?? null);
    };
    if (id) load();
  }, [id, user?.id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (watch === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: '#94A3B8', borderTopColor: 'transparent' }} />
          <div className="text-xs tracking-widest uppercase" style={{ color: '#6b6d7e' }}>Loading card…</div>
        </div>
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4 opacity-40">⌧</div>
          <h1 className="text-2xl font-black text-white mb-2">Card not found</h1>
          <p className="text-sm text-gray-400 mb-6">This watch isn't in your collection — it may belong to another user or was deleted.</p>
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

  const brand = BRANDS.find((b) => b.id === watch.brandId) || BRANDS[0];
  const config = TIER_CONFIG[brand.tier];
  const isOwn = !user || allWatches.some((w) => w.id === watch.id);

  const sorted = [...allWatches].sort((a, b) => a.cardNumber - b.cardNumber);
  const idx = sorted.findIndex((w) => w.id === watch.id);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  const dateStr = new Date(watch.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async (platform: 'x' | 'linkedin' | 'native') => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${brand.name} ${watch.model} — Card #${watch.cardNumber.toString().padStart(4, '0')} on CROWN`;
    if (platform === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'native' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${brand.name} ${watch.model}`, text, url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied to clipboard');
    } catch {
      setToast('Could not share');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      if (user) {
        await deleteWatch(watch.id, user);
      } else {
        const local = JSON.parse(localStorage.getItem('crown_watches') || '[]') as Watch[];
        const filtered = local.filter((w) => w.id !== watch.id);
        localStorage.setItem('crown_watches', JSON.stringify(filtered));
        window.dispatchEvent(new StorageEvent('storage', { key: 'crown_watches' }));
      }
      router.push('/me/');
    } catch {
      setToast('Delete failed');
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 backdrop-blur-md" style={{ background: 'rgba(10,10,15,0.85)', borderBottom: '1px solid #1e1e2e' }}>
        <Link href="/me/" className="text-xs font-semibold tracking-widest uppercase transition-colors" style={{ color: '#94A3B8' }}>
          ← Collection
        </Link>
        <div className="flex items-center gap-2">
          {prev && (
            <Link href={`/card/?id=${prev.id}`} className="p-2 rounded-lg transition-colors hover:bg-white/5" aria-label="Previous card" style={{ color: '#6b6d7e' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
          )}
          <span className="text-[10px] font-mono tracking-widest" style={{ color: '#6b6d7e' }}>
            {idx + 1} / {sorted.length}
          </span>
          {next && (
            <Link href={`/card/?id=${next.id}`} className="p-2 rounded-lg transition-colors hover:bg-white/5" aria-label="Next card" style={{ color: '#6b6d7e' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          )}
        </div>
      </nav>

      <div className="px-4 sm:px-6 pt-6 max-w-3xl mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden aspect-[4/5] flex items-center justify-center"
          style={{
            background: `linear-gradient(180deg, ${config.bg} 0%, #0a0a0f 100%)`,
            border: `1px solid ${config.border}50`,
            boxShadow: `0 20px 60px ${config.border}20`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(to right, ${config.border}, ${config.accent})` }} />
          <div
            className="absolute top-4 right-4 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg z-10"
            style={{ background: `${config.border}30`, color: config.accent, border: `1px solid ${config.border}50` }}
          >
            #{watch.cardNumber.toString().padStart(4, '0')}
          </div>
          <div
            className="absolute top-4 left-4 text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-lg z-10"
            style={{ background: `${config.accent}20`, color: config.accent, border: `1px solid ${config.accent}40` }}
          >
            {brand.tier.toUpperCase()}
          </div>

          {watch.imageUrl ? (
            <img src={watch.imageUrl} alt={watch.model} className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <div className="text-[120px] opacity-30">⌚</div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-6" style={{ background: `linear-gradient(transparent, ${config.bg}ee)` }}>
            <div className="text-[10px] tracking-widest mb-1" style={{ color: config.accent }}>
              {brand.name.toUpperCase()} · {brand.country.toUpperCase()}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{watch.model}</h1>
            {watch.year && (
              <div className="text-sm font-mono mt-1" style={{ color: config.text, opacity: 0.7 }}>
                {watch.year} · EST. {brand.founded}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <MetaCell label="CARD #" value={`#${watch.cardNumber.toString().padStart(4, '0')}`} />
          <MetaCell label="YEAR" value={watch.year?.toString() || '—'} />
          <MetaCell label="BRAND TIER" value={brand.tier.toUpperCase()} accent={config.accent} />
          <MetaCell label="ADDED" value={dateStr} />
        </div>

        <div className="mt-6 p-4 rounded-2xl flex items-center gap-3" style={{ background: '#0e0e14', border: '1px solid #1e1e2e' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${config.accent}40, ${config.border}40)`, color: config.accent }}
          >
            {watch.ownerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: '#6b6d7e' }}>COLLECTOR</div>
            <div className="text-sm font-semibold text-white">{watch.ownerName}</div>
          </div>
        </div>

        {watch.timePhilosophy && (
          <div className="mt-3 p-4 rounded-2xl" style={{ background: '#0e0e14', border: '1px solid #1e1e2e' }}>
            <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: '#94A3B8' }}>TIME PHILOSOPHY</div>
            <div className="text-sm font-semibold text-white capitalize mb-1">{watch.timePhilosophy}</div>
            {watch.philosophyNotes && (
              <p className="text-xs leading-relaxed mt-2" style={{ color: '#94A3B8' }}>{watch.philosophyNotes}</p>
            )}
            {watch.philosophyTags && watch.philosophyTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {watch.philosophyTags.map((tag) => (
                  <span key={tag} className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-md" style={{ background: '#94A3B810', color: '#94A3B8', border: '1px solid #94A3B825' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {watch.price && (
          <div className="mt-3 p-4 rounded-2xl" style={{ background: '#0e0e14', border: '1px solid #1e1e2e' }}>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: '#6b6d7e' }}>VALUE</div>
            <div className="text-xl font-bold mt-1" style={{ color: config.accent }}>{watch.price}</div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleShare('x')}
            className="flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-widest uppercase rounded-xl transition-all hover:opacity-90"
            style={{ background: '#fff', color: '#0a0a0f' }}
          >
            𝕏 Share on X
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-widest uppercase rounded-xl transition-all hover:opacity-90"
            style={{ background: '#0a66c2', color: '#fff' }}
          >
            in LinkedIn
          </button>
          <button
            onClick={() => handleShare('native')}
            className="px-4 py-2.5 text-xs font-bold tracking-widest uppercase rounded-xl transition-all hover:bg-white/5"
            style={{ background: 'transparent', color: '#94A3B8', border: '1px solid #94A3B830' }}
            aria-label="Share"
          >
            ⋯ More
          </button>
        </div>

        {isOwn && (
          <div className="mt-6">
            <Link
              href={`/edit/?id=${watch.id}`}
              className="block w-full py-2.5 text-xs font-bold tracking-widest uppercase rounded-xl text-center transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #94A3B8, #64748B)', color: '#0a0a0f' }}
            >
              ✎ Edit this watch
            </Link>
          </div>
        )}

        {isOwn && (
          <div className="mt-2">
            {!confirmDelete ? (
              <button
                onClick={handleDelete}
                className="w-full py-2.5 text-xs font-semibold tracking-widest uppercase rounded-xl transition-colors"
                style={{ background: 'transparent', color: '#6b6d7e', border: '1px solid #1e1e2e' }}
              >
                Remove from collection
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 text-xs font-bold tracking-widest uppercase rounded-xl transition-all"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' }}
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2.5 text-xs font-bold tracking-widest uppercase rounded-xl"
                  style={{ background: 'transparent', color: '#94A3B8', border: '1px solid #1e1e2e' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/me/" className="text-[10px] tracking-widest uppercase transition-colors hover:text-white" style={{ color: '#5a5a6e' }}>
            ◈ CROWN · Brushed Steel Edition
          </Link>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 text-xs font-semibold tracking-wide rounded-xl z-50 shadow-2xl"
          style={{ background: '#1a1a25', color: '#94A3B8', border: '1px solid #94A3B840' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function MetaCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: '#0e0e14', border: '1px solid #1e1e2e' }}>
      <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: '#6b6d7e' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: accent || '#e5e7eb' }}>{value}</div>
    </div>
  );
}

export default function CardDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="inline-block w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#94A3B8', borderTopColor: 'transparent' }} />
      </div>
    }>
      <CardDetailInner />
    </Suspense>
  );
}
