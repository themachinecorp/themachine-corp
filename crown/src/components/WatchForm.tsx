'use client';

import React, { useState, useRef } from 'react';
import { BRANDS, TIER_CONFIG } from '@/lib/brands';
import { Watch, generateId } from '@/lib/types';
import { saveWatch as saveWatchToDb, getNextCardNumber } from '@/lib/storage';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

const TIME_PHILOSOPHY_OPTIONS = [
  { value: 'metal', label: '坚韧如金属', icon: '⚔️' },
  { value: 'flow', label: '流动如水', icon: '🌊' },
  { value: 'precision', label: '精准如哲学', icon: '⚖️' },
  { value: 'silence', label: '沉默如历史', icon: '🏛️' },
] as const;

const PHILOSOPHY_TAGS = [
  'Daily Beater',
  'Grail',
  'Philosophy Piece',
  'Legacy',
  'Witness',
] as const;

// ─── Rarity calculator ─────────────────────────────────────────────
export function calculateRarity(params: {
  brandTier: string;
  timePhilosophy?: string;
  philosophyTags?: string[];
  price?: string;
}): 'common' | 'rare' | 'epic' | 'legendary' {
  let score = 0;

  // Brand tier base score
  const tierScores: Record<string, number> = {
    legendary: 40,
    epic: 25,
    rare: 10,
    common: 0,
  };
  score += tierScores[params.brandTier] ?? 0;

  // Time philosophy bonus
  if (params.timePhilosophy) score += 15;

  // Philosophy tags bonus
  const tagCount = params.philosophyTags?.length ?? 0;
  score += tagCount * 10;

  // Price bonus (rough heuristics)
  if (params.price) {
    const p = params.price.replace(/[^0-9]/g, '');
    const priceNum = parseInt(p) || 0;
    if (priceNum >= 500000) score += 20;
    else if (priceNum >= 100000) score += 10;
    else if (priceNum >= 30000) score += 5;
  }

  if (score >= 70) return 'legendary';
  if (score >= 45) return 'epic';
  if (score >= 20) return 'rare';
  return 'common';
}

// ─── Component ──────────────────────────────────────────────────────
export default function WatchForm() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Basic fields
  const [ownerName, setOwnerName] = useState('');
  const [brandId, setBrandId] = useState('rolex');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Socrates philosophy fields
  const [philosophyNotes, setPhilosophyNotes] = useState('');
  const [timePhilosophy, setTimePhilosophy] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [socratesOpen, setSocratesOpen] = useState(false);

  const selectedBrand = BRANDS.find((b) => b.id === brandId);

  // Tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 3 ? [...prev, tag] : prev
    );
  };

  // File handling
  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImagePreview(url);
      setImageUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowLogin(true); return; }
    if (!model || !ownerName) return;

    setIsSubmitting(true);

    // Calculate rarity based on brand + philosophy
    const rarity = calculateRarity({
      brandTier: selectedBrand?.tier ?? 'common',
      timePhilosophy: timePhilosophy || undefined,
      philosophyTags: selectedTags.length > 0 ? selectedTags : undefined,
      price: price || undefined,
    });

    const watch: Watch = {
      id: generateId(),
      brandId,
      model,
      year: year ? parseInt(year) : undefined,
      price: price || undefined,
      imageUrl: imageUrl || undefined,
      ownerName,
      createdAt: Date.now(),
      cardNumber: await getNextCardNumber(user?.id),
      philosophyNotes: philosophyNotes || undefined,
      timePhilosophy: (timePhilosophy as Watch['timePhilosophy']) || undefined,
      philosophyTags: selectedTags.length > 0 ? selectedTags : undefined,
      rarity,
    };

    await saveWatchToDb(watch, user!);
    router.push(`/card/${watch.id}`);
  };

  const tierColors: Record<string, { accent: string; bg: string }> = {
    legendary: { accent: '#FFD700', bg: '#1a1500' },
    epic: { accent: '#94A3B8', bg: '#111827' },
    rare: { accent: '#3B82F6', bg: '#0f172a' },
    common: { accent: '#6B7280', bg: '#11111' },
  };
  const colors = tierColors[selectedBrand?.tier ?? 'common'];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md">
      {/* Owner Name */}
      <div>
        <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
          Your Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="e.g. Alex Chen"
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-400/50 focus:ring-2 focus:ring-gray-400/20 transition-all"
        />
      </div>

      {/* Brand */}
      <div>
        <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
          Brand <span className="text-red-400">*</span>
        </label>
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gray-400/50 focus:ring-2 focus:ring-gray-400/20 transition-all appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '20px',
          }}
        >
          {BRANDS.map((brand) => (
            <option key={brand.id} value={brand.id} style={{ background: '#111118' }}>
              {brand.name} [{brand.tier}]
            </option>
          ))}
        </select>
        {selectedBrand && (
          <p className="mt-1.5 text-xs text-gray-500">
            Tier: <span className="font-semibold uppercase" style={{ color: colors.accent }}>{selectedBrand.tier}</span>
          </p>
        )}
      </div>

      {/* Model */}
      <div>
        <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
          Model <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. Submariner Date"
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-400/50 focus:ring-2 focus:ring-gray-400/20 transition-all"
        />
      </div>

      {/* Year & Price Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2023"
            min="1800"
            max={new Date().getFullYear()}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-400/50 focus:ring-2 focus:ring-gray-400/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
            Price
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. ¥85,000"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-400/50 focus:ring-2 focus:ring-gray-400/20 transition-all"
          />
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
          Watch Photo
        </label>
        <div
          className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
            dragOver ? 'border-2 border-dashed border-gray-400 bg-gray-400/5' : ''
          }`}
          style={{
            background: imagePreview ? 'transparent' : '#00000020',
            border: imagePreview ? 'none' : '2px dashed #333',
            minHeight: '140px',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <div className="relative" style={{ height: '140px' }}>
              <img
                src={imagePreview}
                alt="Watch preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-sm text-white">Click to replace</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-4xl opacity-50">📸</span>
              <span className="text-sm text-gray-500">
                Drop image or <span className="text-gray-300 underline">browse</span>
              </span>
              <span className="text-xs text-gray-600">JPG, PNG, WebP · Max 10MB</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Story */}
      <div>
        <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
          Story
        </label>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="The story behind this watch..."
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-400/50 focus:ring-2 focus:ring-gray-400/20 transition-all resize-none"
        />
      </div>

      {/* ─── Socrates Philosophy Section ─── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          borderColor: socratesOpen ? '#FFD70040' : '#333',
          background: '#00000020',
        }}
      >
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setSocratesOpen(!socratesOpen)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏛️</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">时间哲学锻造所</p>
              <p className="text-xs text-gray-500"> Socrates' Questions — Optional but encouraged</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {socratesOpen && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FFD70020', color: '#FFD700' }}>
                ✦ Socrates Active
              </span>
            )}
            <span
              className="text-gray-400 transition-transform"
              style={{ transform: socratesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </div>
        </button>

        {/* Socrates Questions */}
        {socratesOpen && (
          <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: '#FFD70020' }}>
            {/* Q1: philosophy notes */}
            <div className="pt-4">
              <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
                <span className="text-yellow-500 mr-1">✦</span>
                这块表见证了哪些时刻？
              </label>
              <p className="text-xs text-gray-600 mb-2">What moments has this watch witnessed? (留空也行 — optional)</p>
              <textarea
                value={philosophyNotes}
                onChange={(e) => setPhilosophyNotes(e.target.value)}
                placeholder="人生转折点、难忘旅程、重要决定..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/30 focus:ring-2 focus:ring-yellow-500/10 transition-all resize-none"
              />
            </div>

            {/* Q2: time philosophy */}
            <div>
              <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
                <span className="text-yellow-500 mr-1">✦</span>
                它为什么代表你的时间观？
              </label>
              <p className="text-xs text-gray-600 mb-3">What does this watch say about your philosophy of time?</p>
              <div className="grid grid-cols-2 gap-2">
                {TIME_PHILOSOPHY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimePhilosophy(timePhilosophy === opt.value ? '' : opt.value)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all"
                    style={{
                      borderColor: timePhilosophy === opt.value ? colors.accent : '#333',
                      background: timePhilosophy === opt.value ? `${colors.accent}15` : 'transparent',
                      color: timePhilosophy === opt.value ? colors.accent : '#9CA3AF',
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: philosophy tags */}
            <div>
              <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
                <span className="text-yellow-500 mr-1">✦</span>
                给它一个哲学标签
              </label>
              <p className="text-xs text-gray-600 mb-3">Choose up to 3 philosophy tags</p>
              <div className="flex flex-wrap gap-2">
                {PHILOSOPHY_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      disabled={!selected && selectedTags.length >= 3}
                      className="px-3 py-1.5 rounded-full text-xs border transition-all"
                      style={{
                        borderColor: selected ? colors.accent : '#333',
                        background: selected ? `${colors.accent}20` : 'transparent',
                        color: selected ? colors.accent : '#6B7280',
                        cursor: !selected && selectedTags.length >= 3 ? 'not-allowed' : 'pointer',
                        opacity: !selected && selectedTags.length >= 3 ? 0.4 : 1,
                      }}
                    >
                      {selected && <span className="mr-1">✓ </span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !model || !ownerName}
        className="w-full py-3.5 font-bold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #94A3B8, #64748B)',
          color: '#0a0a0a',
          boxShadow: '0 4px 20px #94A3B830',
        }}
      >
        {isSubmitting ? 'Creating Card...' : '✦ Forge My Time Philosophy →'}
      </button>
    </form>
  );
}