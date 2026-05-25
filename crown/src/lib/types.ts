export interface Watch {
  id: string;
  brandId: string;
  model: string;
  year?: number;
  price?: string;
  imageUrl?: string;
  ownerName: string;
  createdAt: number;
  cardNumber: number;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getCardNumber(watches: Watch[]): number {
  return watches.length + 1;
}
