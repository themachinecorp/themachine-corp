export interface Brand {
  id: string;
  name: string;
  country: string;
  founded: number;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BRANDS: Brand[] = [
  { id: 'rolex', name: 'Rolex', country: 'Switzerland', founded: 1905, tier: 'legendary' },
  { id: 'patek', name: 'Patek Philippe', country: 'Switzerland', founded: 1839, tier: 'legendary' },
  { id: 'ap', name: 'Audemars Piguet', country: 'Switzerland', founded: 1875, tier: 'legendary' },
  { id: 'vacheron', name: 'Vacheron Constantin', country: 'Switzerland', founded: 1755, tier: 'legendary' },
  { id: 'lange', name: 'A. Lange & Söhne', country: 'Germany', founded: 1845, tier: 'legendary' },
  { id: 'omega', name: 'Omega', country: 'Switzerland', founded: 1848, tier: 'epic' },
  { id: 'cartier', name: 'Cartier', country: 'France', founded: 1847, tier: 'epic' },
  { id: 'iwc', name: 'IWC Schaffhausen', country: 'Switzerland', founded: 1868, tier: 'epic' },
  { id: 'jaeger', name: 'Jaeger-LeCoultre', country: 'Switzerland', founded: 1833, tier: 'epic' },
  { id: 'breguet', name: 'Breguet', country: 'Switzerland', founded: 1775, tier: 'epic' },
  { id: 'blancpain', name: 'Blancpain', country: 'Switzerland', founded: 1735, tier: 'rare' },
  { id: 'zenith', name: 'Zenith', country: 'Switzerland', founded: 1865, tier: 'rare' },
  { id: 'tudor', name: 'Tudor', country: 'Switzerland', founded: 1926, tier: 'rare' },
  { id: 'grand', name: 'Grand Seiko', country: 'Japan', founded: 1960, tier: 'rare' },
  { id: 'glashutte', name: 'Glashütte Original', country: 'Germany', founded: 1845, tier: 'rare' },
  { id: 'panerai', name: 'Panerai', country: 'Italy', founded: 1860, tier: 'rare' },
  { id: 'tag', name: 'TAG Heuer', country: 'Switzerland', founded: 1860, tier: 'common' },
  { id: 'breitling', name: 'Breitling', country: 'Switzerland', founded: 1884, tier: 'common' },
  { id: 'hublot', name: 'Hublot', country: 'Switzerland', founded: 1980, tier: 'common' },
  { id: 'bellross', name: 'Bell & Ross', country: 'France', founded: 1992, tier: 'common' },
  { id: 'longines', name: 'Longines', country: 'Switzerland', founded: 1832, tier: 'common' },
  { id: 'tissot', name: 'Tissot', country: 'Switzerland', founded: 1853, tier: 'common' },
  { id: 'casio', name: 'Casio', country: 'Japan', founded: 1946, tier: 'common' },
  { id: 'apple', name: 'Apple Watch', country: 'USA', founded: 2015, tier: 'common' },
];

// Web3 NFT aesthetic tier configs
export const TIER_CONFIG = {
  common: {
    bg: '#111118',
    border: '#6B7280',
    text: '#9CA3AF',
    accent: '#D1D5DB',
    glow: '#6B7280',
  },
  rare: {
    bg: '#0D1B2A',
    border: '#3B82F6',
    text: '#93C5FD',
    accent: '#60A5FA',
    glow: '#3B82F6',
  },
  epic: {
    bg: '#1A0A2E',
    border: '#A855F7',
    text: '#C084FC',
    accent: '#A855F7',
    glow: '#A855F7',
  },
  legendary: {
    bg: '#0A0A0F',
    border: '#F59E0B',
    text: '#FCD34D',
    accent: '#F5C542',
    glow: '#F59E0B',
  },
};

// Legacy alias for backwards compat
export const TIER_COLORS = TIER_CONFIG;