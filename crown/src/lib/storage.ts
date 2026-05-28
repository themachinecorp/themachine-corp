'use client';

import { Watch } from '@/lib/types';
import { supabase, isConfigured } from './supabase';
import { User } from '@supabase/supabase-js';

// Fallback localStorage for when Supabase is not configured
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
  }));
}

export async function getNextCardNumber(userId?: string): Promise<number> {
  if (!isConfigured || !userId) {
    return localGetNextCardNumber();
  }

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