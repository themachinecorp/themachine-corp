'use client';

import { Watch } from './types';

const STORAGE_KEY = 'crown_watches';

export function getWatches(): Watch[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveWatch(watch: Watch): void {
  const watches = getWatches();
  watches.push(watch);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watches));
}

export function getNextCardNumber(): number {
  return getWatches().length + 1;
}
