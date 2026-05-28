'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AuthPage() {
  const { signInWithEmail, signInWithGoogle, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
        <div className="text-center p-8 rounded-3xl" style={{ background: '#0e0e1a', border: '1px solid rgba(148,163,184,0.15)' }}>
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-xl font-black mb-2" style={{ color: '#e0e0ec' }}>Setup Required</h1>
          <p className="text-sm mb-6" style={{ color: '#686880' }}>Add Supabase credentials to enable login.</p>
          <Link href="/" className="px-6 py-3 text-sm font-bold rounded-xl inline-block"
            style={{ background: 'linear-gradient(135deg, #475569, #64748B, #94A3B8)', color: '#08080c' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signInWithEmail(email);
    if (result.error) { setError(result.error); setLoading(false); }
    else { setSent(true); setLoading(false); }
  };

  const handleGoogle = async () => {
    setError('');
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(50,50,80,.4) 0%, #09090f 60%)' }}>
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3" style={{ filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' }}>◈</div>
        <h1 className="text-lg font-black tracking-widest" style={{ color: '#e0e0ec', letterSpacing: '0.2em' }}>THEMATHINK</h1>
        <p className="text-[9px] mt-2" style={{ color: '#686880' }}>UNIFIED AUTH · ONE LOGIN · ALL PRODUCTS</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'linear-gradient(160deg, #13151e 0%, #0d0f17 100%)', border: '1px solid rgba(148,163,184,0.15)' }}>
        {!sent ? (
          <>
            <h2 className="text-sm font-black mb-6 text-center" style={{ color: '#e0e0ec' }}>SIGN IN</h2>
            <button onClick={handleGoogle} className="w-full py-3 mb-4 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(145deg, #d0d0dc, #a0a0ac)', color: '#404050', boxShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,0.18)' }} />
              <span className="text-[10px]" style={{ color: '#686880' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,0.18)' }} />
            </div>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(148,163,184,0.2)', color: '#e0e0ec', outline: 'none' }} />
              {error && <div className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-3.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(145deg, #d0d0dc, #a0a0ac)', color: '#404050', boxShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
                {loading ? 'Sending...' : '✦ Send Magic Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-sm font-black" style={{ color: '#e0e0ec' }}>CHECK YOUR INBOX</h2>
            <p className="text-xs" style={{ color: '#686880', lineHeight: '2' }}>
              Secure link sent to<br /><strong style={{ color: '#94A3B8' }}>{email}</strong>
            </p>
            <button onClick={() => { setSent(false); setEmail(''); }} className="text-xs hover:underline" style={{ color: '#686880' }}>
              Use different email
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-[10px]" style={{ color: '#3a3d4e' }}>
        <Link href="/" className="hover:underline">← Back to THEMATHINK</Link>
      </p>
    </div>
  );
}