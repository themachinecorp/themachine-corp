'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Brand, TIER_CONFIG } from '@/lib/brands';
import { Watch } from '@/lib/types';

// ─── Rarity config ─────────────────────────────────────────────────
const RARITY_CONFIG = {
  legendary: {
    border: '#FFD700',
    bg: 'linear-gradient(135deg, #FFD70015, #FFD70008)',
    label: 'LEGENDARY',
    glow: '#FFD700',
    pillBg: '#FFD70020',
    pillColor: '#FFD700',
  },
  epic: {
    border: '#C0C0C0',
    bg: 'linear-gradient(135deg, #C0C0C015, #C0C0C008)',
    label: 'EPIC',
    glow: '#C0C0C0',
    pillBg: '#C0C0C020',
    pillColor: '#C0C0C0',
  },
  rare: {
    border: '#CD7F32',
    bg: 'linear-gradient(135deg, #CD7F3215, #CD7F3208)',
    label: 'RARE',
    glow: '#CD7F32',
    pillBg: '#CD7F3220',
    pillColor: '#CD7F32',
  },
  common: {
    border: '#9CA3AF',
    bg: 'linear-gradient(135deg, #9CA3AF10, #9CA3AF05)',
    label: 'COMMON',
    glow: '#9CA3AF',
    pillBg: '#9CA3AF15',
    pillColor: '#9CA3AF',
  },
};

const TIME_PHILOSOPHY_ICONS: Record<string, string> = {
  metal: '⚔️',
  flow: '🌊',
  precision: '⚖️',
  silence: '🏛️',
};

const TIME_PHILOSOPHY_LABELS: Record<string, string> = {
  metal: '坚韧如金属',
  flow: '流动如水',
  precision: '精准如哲学',
  silence: '沉默如历史',
};

interface WatchCardProps {
  watch: Watch;
  brand: Brand;
}

export default function WatchCard({ watch, brand }: WatchCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const config = TIER_CONFIG[brand.tier];
  const rarity = watch.rarity ?? 'common';
  const rarityConfig = RARITY_CONFIG[rarity];

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
      link.download = `crown-${brand.name.replace(/\s+/g, '-')}-${watch.model.replace(/\s+/g, '-')}-${watch.cardNumber.toString().padStart(4, '0')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/me/`;
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
        className="relative w-[420px] h-[620px] rounded-2xl overflow-hidden"
        style={{ background: config.bg }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={watch.philosophyNotes ? `"${watch.philosophyNotes}"` : undefined}
      >
        {/* Rarity outer glow border — gold/silver/bronze/white */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            padding: '2px',
            background: `linear-gradient(135deg, ${rarityConfig.border}, ${rarityConfig.glow}60, ${rarityConfig.border})`,
            boxShadow: `0 0 24px ${rarityConfig.glow}30`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Inner background */}
        <div className="absolute inset-0 rounded-2xl" style={{ background: config.bg }} />

        {/* Rarity corner badge */}
        <div
          className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{
            background: `${rarityConfig.border}25`,
            border: `1px solid ${rarityConfig.border}60`,
            boxShadow: `0 0 12px ${rarityConfig.glow}25`,
          }}
        >
          <span style={{ color: rarityConfig.border, fontSize: '10px' }}>◆</span>
          <span
            className="text-[9px] font-black tracking-widest"
            style={{ color: rarityConfig.border }}
          >
            {rarityConfig.label}
          </span>
        </div>

        {/* Radial top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-80 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${config.glow}25 0%, transparent 70%)`,
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
        <div className="relative mx-7 h-[220px] rounded-2xl overflow-hidden" style={{ background: '#00000030' }}>
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
            className="text-2xl font-black text-white mb-3 leading-tight"
            style={{ color: config.accent }}
          >
            {watch.model}
          </h2>

          {/* ─── Philosophy Bar (only shown if philosophy data exists) ─── */}
          {(watch.timePhilosophy || (watch.philosophyTags && watch.philosophyTags.length > 0)) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {/* Time philosophy icon + label */}
              {watch.timePhilosophy && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background: rarityConfig.pillBg,
                    border: `1px solid ${rarityConfig.border}40`,
                  }}
                >
                  <span className="text-sm">{TIME_PHILOSOPHY_ICONS[watch.timePhilosophy]}</span>
                  <span className="text-[10px] font-medium" style={{ color: rarityConfig.pillColor }}>
                    {TIME_PHILOSOPHY_LABELS[watch.timePhilosophy]}
                  </span>
                </div>
              )}

              {/* Philosophy tags */}
              {watch.philosophyTags && watch.philosophyTags.map((tag) => (
                <div
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{
                    background: rarityConfig.pillBg,
                    color: rarityConfig.pillColor,
                    border: `1px solid ${rarityConfig.border}40`,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 mb-4">
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

          {/* Philosophy notes hover reveal */}
          {watch.philosophyNotes && (
            <div
              className="mb-4 px-3 py-2 rounded-lg text-xs italic transition-all duration-300"
              style={{
                background: `${rarityConfig.border}10`,
                border: `1px solid ${rarityConfig.border}30`,
                color: '#9CA3AF',
                opacity: hovered ? 1 : 0,
                maxHeight: hovered ? '100px' : '0',
                overflow: 'hidden',
              }}
            >
              "{watch.philosophyNotes}"
            </div>
          )}

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