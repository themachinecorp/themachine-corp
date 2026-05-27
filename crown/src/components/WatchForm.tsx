'use client';

import React, { useState, useRef } from 'react';
import { BRANDS } from '@/lib/brands';
import { Watch, generateId } from '@/lib/types';
import { saveWatch, getNextCardNumber } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function WatchForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandId, setBrandId] = useState('rolex');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    if (!model || !ownerName) return;

    setIsSubmitting(true);

    const watch: Watch = {
      id: generateId(),
      brandId,
      model,
      year: year ? parseInt(year) : undefined,
      price: price || undefined,
      imageUrl: imageUrl || undefined,
      ownerName,
      createdAt: Date.now(),
      cardNumber: getNextCardNumber(),
    };

    saveWatch(watch);
    router.push(`/card/${watch.id}`);
  };

  const selectedBrand = BRANDS.find((b) => b.id === brandId);

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
            Tier: <span className="font-semibold uppercase" style={{ color: selectedBrand.tier === 'legendary' ? '#94A3B8' : selectedBrand.tier === 'epic' ? '#A855F7' : selectedBrand.tier === 'rare' ? '#3B82F6' : '#6B7280' }}>{selectedBrand.tier}</span>
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
        {isSubmitting ? 'Creating Card...' : '✦ Generate My Card →'}
      </button>
    </form>
  );
}