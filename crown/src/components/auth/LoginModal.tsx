'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

interface LoginModalProps {
  onClose: () => void;
  returnUrl?: string;
}

export default function LoginModal({ onClose, returnUrl }: LoginModalProps) {
  const { signInWithEmail, signInWithGoogle, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="w-full max-w-sm rounded-3xl p-8 text-center"
          style={{ background: 'linear-gradient(145deg, #13151e, #0d0f17)', border: '1px solid rgba(148,163,184,0.15)' }}>
          <div className="text-5xl mb-4">🔧</div>
          <h2 className="text-xl font-black text-white mb-2">Setup Required</h2>
          <p className="text-sm text-gray-400 mb-6">Add Supabase credentials to enable login.</p>
          <button onClick={onClose} className="w-full py-3 text-sm font-bold rounded-xl"
            style={{ background: 'rgba(148,163,184,0.15)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.2)' }}>
            Close
          </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #13151e, #0d0f17)', border: '1px solid rgba(148,163,184,0.15)' }}>
        {/* Top edge */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(180,195,215,0.5), rgba(220,230,245,0.8), rgba(180,195,215,0.5), transparent)' }} />
        <div className="p-8">
          {!sent ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">👑</div>
                <h2 className="text-xl font-black text-white mb-1">Sign in to THEMATHINK</h2>
                <p className="text-sm text-gray-400">One login · All products</p>
              </div>
              <button type="button" onClick={handleGoogle} className="w-full py-3 text-sm font-bold rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(145deg, #d0d0dc, #a0a0ac)', color: '#404050', boxShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
                Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,0.18)' }} />
                <span className="text-[10px]" style={{ color: '#686880' }}>OR</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,0.18)' }} />
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all"
                style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(200,200,212,.18)' }} />
              {error && <div className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(145deg, #d0d0dc, #a0a0ac)', color: '#404050', boxShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
                {loading ? 'Sending...' : '✦ Send Magic Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-5xl">✉️</div>
              <h2 className="text-xl font-black text-white">Check your inbox</h2>
              <p className="text-sm text-gray-300">Secure link sent to <strong>{email}</strong></p>
              <button onClick={() => { setSent(false); setEmail(''); }} className="text-sm text-gray-500 hover:text-gray-300">
                Use different email
              </button>
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full py-3 text-sm text-gray-500 hover:text-gray-300 border-t"
          style={{ borderColor: 'rgba(148,163,184,0.08)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}