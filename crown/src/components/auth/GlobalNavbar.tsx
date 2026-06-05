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
            className="watch-mark transition-transform duration-300 group-hover:scale-110"
            style={{ width: 22, height: 22, display: 'block', color: '#E8ECF2', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.5))' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="watch-live" style={{ width: '100%', height: '100%' }}>
              {/* Needle hands — both rotate around (12, 12). Live time. */}
              <polygon className="wm-hour" points="12,1.5 12.7,11.4 12.7,12 11.3,12 11.3,11.4"/>
              <polygon className="wm-min" points="12,0.2 12.5,11.4 12.5,12 11.5,12 11.5,11.4"/>
              <circle cx="12" cy="12" r="0.8"/>
            </svg>
          </span>
          <span
            className="text-sm font-black tracking-[0.30em] hidden sm:block"
            style={{
              background: 'linear-gradient(180deg, #E8ECF2 0%, #7B8493 100%)',
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
