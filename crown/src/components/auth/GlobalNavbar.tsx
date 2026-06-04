'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import GlobalUserButton from './GlobalUserButton';

/**
 * Global site navbar — fixed top, used on every page.
 *
 * Logo is a smart link: when user is on a non-crown page (basePath === ''),
 * the logo takes them to /crown/ (the app). When already in crown, it
 * points to the crown home.
 */
export default function GlobalNavbar() {
  const { basePath } = useAuth();
  const homeHref = `${basePath}/`;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,8,12,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(160,175,200,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2 group">
          <span
            className="text-2xl transition-transform duration-300 group-hover:scale-110"
            style={{ filter: 'drop-shadow(0 0 8px rgba(180,195,215,0.4))' }}
          >
            👑
          </span>
          <span
            className="text-sm font-black tracking-[0.25em] hidden sm:block"
            style={{
              background: 'linear-gradient(135deg, #94A3B8, #CBD5E1, #94A3B8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CROWN
          </span>
        </Link>

        {/* Right side: optional tagline + global user button */}
        <div className="flex items-center gap-3">
          <span
            className="hidden md:inline text-[10px] tracking-widest"
            style={{ color: 'rgba(148,163,184,0.45)', fontFamily: 'var(--font-mono)' }}
          >
            STEEL EDITION
          </span>
          <GlobalUserButton />
        </div>
      </div>
    </header>
  );
}
