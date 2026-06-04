'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

/**
 * Global user button — appears in the top-right of EVERY page.
 * Three states: loading skeleton | signed-out CTA | signed-in avatar + menu.
 *
 * Works on any basePath because all auth-aware links are built from
 * useAuth().basePath at render time.
 */
export default function GlobalUserButton() {
  const { user, loading, signOut, basePath, isConfigured } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div
        aria-hidden
        className="rounded-full"
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(145deg, #1e2030, #14161e)',
          border: '1px solid rgba(160,175,200,0.12)',
        }}
      />
    );
  }

  // ── Not configured (env missing): disable, but still render label ──
  if (!isConfigured) {
    return (
      <Link
        href={`${basePath}/login/`}
        className="text-[10px] tracking-widest px-3 py-1.5 rounded-full"
        style={{
          color: '#686880',
          background: 'rgba(148,163,184,0.08)',
          border: '1px solid rgba(148,163,184,0.18)',
        }}
      >
        SETUP
      </Link>
    );
  }

  // ── Signed out: "Sign In" button → /crown/login/ ──
  if (!user) {
    return (
      <Link
        href={`${basePath}/login/`}
        className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] px-3 sm:px-4 py-2 rounded-full transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #475569, #64748B, #94A3B8)',
          color: '#08080c',
          boxShadow: '0 2px 8px rgba(0,0,0,.4)',
        }}
      >
        SIGN IN
      </Link>
    );
  }

  // ── Signed in: avatar + dropdown ──
  const email = user.email || 'Signed in';
  const initial = (email[0] || '?').toUpperCase();
  const avatarUrl =
    (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || '';

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    // Refresh current route so server-rendered guards re-evaluate
    router.refresh();
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center justify-center rounded-full transition-all hover:scale-105"
        style={{
          width: 36,
          height: 36,
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover`
            : 'linear-gradient(135deg, #475569, #64748B, #94A3B8)',
          color: '#08080c',
          fontWeight: 800,
          fontSize: 13,
          border: '1px solid rgba(180,195,215,0.4)',
          boxShadow: '0 2px 10px rgba(148,163,184,0.25)',
          cursor: 'pointer',
        }}
      >
        {avatarUrl ? '' : initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #13151e 0%, #0d0f17 100%)',
            border: '1px solid rgba(160,175,200,0.18)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            zIndex: 60,
          }}
        >
          {/* Account header */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid rgba(160,175,200,0.10)' }}
          >
            <div className="text-[10px] tracking-widest" style={{ color: '#686880' }}>
              SIGNED IN AS
            </div>
            <div
              className="text-xs font-bold mt-0.5 truncate"
              style={{ color: '#e0e0ec' }}
              title={email}
            >
              {email}
            </div>
          </div>

          <Link
            href={`${basePath}/me/`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-xs font-bold tracking-wider transition-all"
            style={{ color: '#CBD5E1' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span style={{ marginRight: 8 }}>👑</span>MY COLLECTION
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-xs font-bold tracking-wider transition-all"
            style={{
              color: '#f87171',
              borderTop: '1px solid rgba(160,175,200,0.08)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span style={{ marginRight: 8 }}>↩</span>SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}
