'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';

export default function AuthPage() {
  const { session, loading } = useAuth();
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (!loading && session) {
      // Already logged in — redirect to /me/
      window.location.href = '/me/';
    }
  }, [session, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">👑</div>
          <div className="text-sm tracking-widest" style={{ color: '#686880' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <LoginModal
          onClose={() => { setShowModal(false); window.location.href = '/'; }}
          returnUrl="/me/"
        />
      )}
    </>
  );
}