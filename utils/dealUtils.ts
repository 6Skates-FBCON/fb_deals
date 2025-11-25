import { Database } from '@/lib/supabase';

type Deal = Database['public']['Tables']['deals']['Row'];

export type DealStatus = 'coming_soon' | 'active' | 'sold_out' | 'expired';

export function getDealStatus(deal: Deal): DealStatus {
  const now = new Date();
  const startDate = new Date(deal.start_date);
  const endDate = new Date(deal.end_date);

  if (now < startDate) {
    return 'coming_soon';
  }

  if (now > endDate) {
    return 'expired';
  }

  if (deal.quantity_remaining <= 0) {
    return 'sold_out';
  }

  return 'active';
}

export function getTimeRemaining(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Deal ended';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 1) {
    return `Ends in ${days} days`;
  }

  if (days === 1) {
    return 'Ends tomorrow';
  }

  if (hours > 0) {
    return `Ends in ${hours}h ${minutes}m`;
  }

  return `Ends in ${minutes}m`;
}

export function getCountdownDisplay(endDate: string): {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
