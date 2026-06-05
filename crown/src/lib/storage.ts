'use client';

import { Watch } from '@/lib/types';
import { isConfigured } from './supabase';
import type { User } from '@supabase/supabase-js';

// Lazy import supabase client (~150KB) to keep it out of main page bundle.
// Only loaded when user actually tries to save/load authenticated data.
async function getSupabase() {
  const mod = await import('./supabase');
  return mod.supabase;
}

// ─── Local fallback ────────────────────────────────────────────────

const LOCAL_KEY = 'crown_watches';

function localGetWatches(): Watch[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LOCAL_KEY);
  return data ? JSON.parse(data) : [];
}

function localSaveWatch(watch: Watch): void {
  const watches = localGetWatches();
  watches.push(watch);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(watches));
}

function localGetNextCardNumber(): number {
  return localGetWatches().length + 1;
}

// ─── Supabase-backed storage ────────────────────────────────────────

export async function saveWatch(watch: Watch, user: User): Promise<void> {
  if (!isConfigured) {
    localSaveWatch(watch);
    return;
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from('watches').insert({
    id: watch.id,
    brand_id: watch.brandId,
    model: watch.model,
    year: watch.year ?? null,
    price: watch.price ?? null,
    image_url: watch.imageUrl ?? null,
    owner_name: watch.ownerName,
    card_number: watch.cardNumber,
    user_id: user.id,
    created_at: new Date(watch.createdAt).toISOString(),
    // Socrates philosophy fields
    philosophy_notes: watch.philosophyNotes ?? null,
    time_philosophy: watch.timePhilosophy ?? null,
    philosophy_tags: watch.philosophyTags ?? null,
    rarity: watch.rarity ?? 'common',
  });

  if (error) {
    console.error('Supabase save error:', error);
    // Fallback to localStorage
    localSaveWatch(watch);
  }
}

export async function getWatches(userId?: string): Promise<Watch[]> {
  if (!isConfigured || !userId) {
    return localGetWatches();
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('watches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase get error:', error);
    return localGetWatches();
  }

  if (!data || data.length === 0) return [];

  return data.map((row) => ({
    id: row.id,
    brandId: row.brand_id,
    model: row.model,
    year: row.year ?? undefined,
    price: row.price ?? undefined,
    imageUrl: row.image_url ?? undefined,
    ownerName: row.owner_name,
    cardNumber: row.card_number,
    createdAt: new Date(row.created_at).getTime(),
    // Socrates philosophy fields
    philosophyNotes: row.philosophy_notes ?? undefined,
    timePhilosophy: row.time_philosophy ?? undefined,
    philosophyTags: row.philosophy_tags ?? undefined,
    rarity: row.rarity ?? 'common',
  }));
}

// ─── Delete a watch ───
function localDeleteWatch(id: string): void {
  const watches = localGetWatches().filter((w) => w.id !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(watches));
}

export async function deleteWatch(id: string, user: User): Promise<void> {
  if (!isConfigured) {
    localDeleteWatch(id);
    return;
  }
  const supabase = await getSupabase();
  const { error } = await supabase.from('watches').delete().eq('id', id).eq('user_id', user.id);
  if (error) {
    console.error('Supabase delete error:', error);
    localDeleteWatch(id);
    return;
  }
  // Mirror locally too so /me shows fresh state immediately
  localDeleteWatch(id);
}

// ─── Update a watch (for future edit feature) ───
function localUpdateWatch(id: string, patch: Partial<Watch>): Watch | null {
  const watches = localGetWatches();
  const idx = watches.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  watches[idx] = { ...watches[idx], ...patch };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(watches));
  return watches[idx];
}

export async function updateWatch(id: string, patch: Partial<Watch>, user: User): Promise<Watch | null> {
  if (!isConfigured) {
    return localUpdateWatch(id, patch);
  }
  const supabase = await getSupabase();
  const dbPatch: Record<string, unknown> = {};
  if (patch.brandId !== undefined) dbPatch.brand_id = patch.brandId;
  if (patch.model !== undefined) dbPatch.model = patch.model;
  if (patch.year !== undefined) dbPatch.year = patch.year;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl;
  if (patch.ownerName !== undefined) dbPatch.owner_name = patch.ownerName;
  if (patch.philosophyNotes !== undefined) dbPatch.philosophy_notes = patch.philosophyNotes;
  if (patch.timePhilosophy !== undefined) dbPatch.time_philosophy = patch.timePhilosophy;
  if (patch.philosophyTags !== undefined) dbPatch.philosophy_tags = patch.philosophyTags;
  if (patch.rarity !== undefined) dbPatch.rarity = patch.rarity;
  const { error } = await supabase.from('watches').update(dbPatch).eq('id', id).eq('user_id', user.id);
  if (error) {
    console.error('Supabase update error:', error);
  }
  return localUpdateWatch(id, patch);
}

export async function getNextCardNumber(userId?: string): Promise<number> {
  if (!isConfigured || !userId) {
    return localGetNextCardNumber();
  }

  const supabase = await getSupabase();
  const { count, error } = await supabase
    .from('watches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Supabase count error:', error);
    return 1;
  }

  return (count ?? 0) + 1;
}

// Legacy exports for backward compat (non-async, local-only)
export function getWatchesLegacy(): Watch[] {
  return localGetWatches();
}

export function getNextCardNumberLegacy(): number {
  return localGetNextCardNumber();
}