'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import WatchForm from '@/components/WatchForm';
import WatchGallery from '@/components/WatchGallery';

export default function Home() {
  const [view, setView] = useState<'add' | 'gallery'>('add');
  const [watchCount, setWatchCount] = useState(0);

  useEffect(() => {
    const loadWatches = () => {
      try {
        const data = localStorage.getItem('crown_watches');
        if (data) {
          setWatchCount(JSON.parse(data).length);
        }
      } catch {
        // ignore parse errors
      }
    };
    loadWatches();
    window.addEventListener('storage', loadWatches);
    return () => window.removeEventListener('storage', loadWatches);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Hero Header */}
      <header className="relative py-16 px-6 text-center overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(245, 197, 66, 0.06) 0%, transparent 55%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">👑</span>
            <h1 className="text-4xl font-black tracking-[0.2em] bg-gradient-to-r from-gray-200 via-yellow-200 to-gray-200 bg-clip-text text-transparent">
              CROWN
            </h1>
          </div>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Turn your watch collection into shareable digital identity cards. Every timepiece deserves its moment.
          </p>
          {watchCount > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {watchCount} {watchCount === 1 ? 'watch' : 'watches'} in your collection
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex justify-center gap-1 mb-10 px-4">
        <button
          onClick={() => setView('add')}
          className={`px-7 py-2.5 text-sm font-semibold rounded-full transition-all ${
            view === 'add'
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          + Add Watch
        </button>
        <button
          onClick={() => setView('gallery')}
          className={`px-7 py-2.5 text-sm font-semibold rounded-full transition-all ${
            view === 'gallery'
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          My Collection
        </button>
        <Link
          href="/me"
          className="px-7 py-2.5 text-sm font-semibold rounded-full transition-all bg-white/5 text-gray-400 hover:bg-white/10"
        >
          👑 Me
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {view === 'add' ? (
          <div className="flex flex-col items-center">
            <WatchForm />
          </div>
        ) : (
          <WatchGallery />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-600">
        <span>CROWN — Watch Collection Identity</span>
      </footer>
    </div>
  );
}