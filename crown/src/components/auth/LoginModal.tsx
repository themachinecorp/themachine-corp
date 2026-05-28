'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { signInWithEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
        <div
          className="w-full max-w-sm rounded-3xl p-8 text-center"
          style={{ background: 'linear-gradient(145deg, #13151e, #0d0f17)', border: '1px solid rgba(148,163,184,0.15)' }}
        >
          <div className="text-5xl mb-4">🔧</div>
          <h2 className="text-xl font-black text-white mb-2">Setup Required</h2>
          <p className="text-sm text-gray-400 mb-6">
            To enable multi-user features, add your Supabase credentials to <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">.env.local</code>.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold rounded-xl"
            style={{ background: 'rgba(148,163,184,0.15)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.2)' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signInWithEmail(email);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #13151e, #0d0f17)', border: '1px solid rgba(148,163,184,0.15)' }}
      >
        {/* Top silver edge */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(180,195,215,0.5), rgba(220,230,245,0.8), rgba(180,195,215,0.5), transparent)' }} />

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👑</div>
            <h2 className="text-xl font-black text-white mb-1">Sign in to CROWN</h2>
            <p className="text-sm text-gray-400">
              {sent
                ? 'Check your email for a magic link'
                : 'Enter your email for a magic sign-in link'}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-400/50 transition-all"
              />
              {error && (
                <div className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #475569, #64748B, #94A3B8)',
                  color: '#08080c',
                  boxShadow: '0 4px 20px rgba(148,163,184,0.2)',
                }}
              >
                {loading ? 'Sending...' : '✦ Send Magic Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-5xl">✉️</div>
              <p className="text-sm text-gray-300">
                We sent a secure link to <strong>{email}</strong>. Check your inbox and click the link to sign in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        {/* Bottom edge */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.2), transparent)' }} />

        <button
          onClick={onClose}
          className="w-full py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors border-t"
          style={{ borderColor: 'rgba(148,163,184,0.08)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}