'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Brand, TIER_CONFIG } from '@/lib/brands';
import { Watch } from '@/lib/types';

interface WatchCardProps {
  watch: Watch;
  brand: Brand;
}

export default function WatchCard({ watch, brand }: WatchCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const config = TIER_CONFIG[brand.tier];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `CROWN-${watch.cardNumber.toString().padStart(4, '0')}-${brand.name.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/card/${watch.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card */}
      <div
        ref={cardRef}
        className="relative w-[420px] h-[600px] rounded-2xl overflow-hidden"
        style={{ background: config.bg }}
      >
        {/* Outer glow border */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            padding: '1.5px',
            background: `linear-gradient(135deg, ${config.border}, ${config.accent}40, ${config.border})`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Inner background */}
        <div className="absolute inset-0 rounded-2xl" style={{ background: config.bg }} />

        {/* Radial top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-80 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${config.glow}30 0%, transparent 70%)`,
          }}
        />

        {/* Top bar */}
        <div className="relative px-7 pt-7 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👑</span>
            <span
              className="text-sm font-black tracking-[0.25em]"
              style={{ color: config.accent }}
            >
              CROWN
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: `${config.border}18`,
              border: `1px solid ${config.border}40`,
            }}
          >
            <span className="text-xs" style={{ color: config.accent }}>★</span>
            <span
              className="text-[10px] font-bold tracking-widest"
              style={{ color: config.text }}
            >
              {brand.tier.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Watch image zone */}
        <div className="relative mx-7 h-[240px] rounded-2xl overflow-hidden" style={{ background: '#00000030' }}>
          {watch.imageUrl ? (
            <img
              src={watch.imageUrl}
              alt={watch.model}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <span className="text-7xl">⌚</span>
              <span className="text-xs tracking-widest" style={{ color: config.text }}>
                NO IMAGE
              </span>
            </div>
          )}
          {/* Diagonal shine */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(125deg, ${config.accent}08 0%, transparent 45%, ${config.border}08 100%)`,
            }}
          />
          {/* Bottom fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: `linear-gradient(to top, ${config.bg}, transparent)` }}
          />
        </div>

        {/* Info section */}
        <div className="relative px-7 pt-5 pb-6">
          {/* Brand tag */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(to right, transparent, ${config.border}50)` }}
            />
            <span
              className="text-[9px] tracking-[0.4em] font-semibold px-3"
              style={{ color: config.text }}
            >
              {brand.name.toUpperCase()}
            </span>
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(to left, transparent, ${config.border}50)` }}
            />
          </div>

          {/* Model name */}
          <h2
            className="text-2xl font-black text-white mb-4 leading-tight"
            style={{ color: config.accent }}
          >
            {watch.model}
          </h2>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {watch.year && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-widest text-gray-500">YR</span>
                <span className="text-sm font-medium" style={{ color: config.text }}>
                  {watch.year}
                </span>
              </div>
            )}
            {watch.price && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-widest text-gray-500">VAL</span>
                <span className="text-sm font-medium" style={{ color: config.text }}>
                  {watch.price}
                </span>
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: `1px solid ${config.border}25` }}
          >
            <div className="flex flex-col">
              <span className="text-[8px] tracking-widest text-gray-600 mb-0.5">OWNER</span>
              <span className="text-sm font-bold" style={{ color: config.text }}>
                {watch.ownerName}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] tracking-widest text-gray-600 mb-0.5">CARD NO.</span>
              <span
                className="text-lg font-black tracking-wider font-mono"
                style={{ color: config.accent }}
              >
                #{watch.cardNumber.toString().padStart(4, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom corner decoration */}
        <div
          className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none opacity-8"
          style={{
            background: `radial-gradient(circle at bottom right, ${config.border}, transparent 60%)`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-px h-20 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${config.accent}60, transparent)` }}
        />
        <div
          className="absolute bottom-0 right-0 h-px w-20 pointer-events-none"
          style={{ background: `linear-gradient(to left, ${config.accent}60, transparent)` }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="px-7 py-3 text-sm font-bold rounded-full transition-all"
          style={{
            background: `linear-gradient(135deg, ${config.accent}, ${config.border})`,
            color: brand.tier === 'common' ? '#0a0a0a' : '#0a0a0a',
            boxShadow: `0 4px 20px ${config.accent}30`,
          }}
        >
          ↓ Download PNG
        </button>
        <button
          onClick={handleCopyLink}
          className="px-7 py-3 text-sm font-semibold rounded-full transition-all border"
          style={{
            background: 'transparent',
            color: copied ? '#22c55e' : '#ffffff',
            borderColor: copied ? '#22c55e50' : 'rgba(255,255,255,0.2)',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}