'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getWatches } from '@/lib/storage';
import { Watch } from '@/lib/types';
import { BRANDS } from '@/lib/brands';
import WatchCard from '@/components/WatchCard';

export default function CardPage() {
  const params = useParams();
  const [watch, setWatch] = useState<Watch | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const watches = getWatches();
    const found = watches.find((w) => w.id === id);
    if (found) {
      setWatch(found);
    } else {
      setNotFound(true);
    }
  }, [params.id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Card Not Found</h1>
          <p className="text-gray-400 mb-6">This watch card doesn't exist or has been removed.</p>
          <Link href="/" className="text-gray-400 hover:text-gray-200 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const brand = BRANDS.find((b) => b.id === watch.brandId) || BRANDS[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4" style={{ background: '#0a0a0a' }}>
      <WatchCard watch={watch} brand={brand} />
      <Link
        href="/"
        className="mt-8 text-gray-500 hover:text-gray-300 text-sm transition-colors"
      >
        ← Add Another Watch
      </Link>
    </div>
  );
}
