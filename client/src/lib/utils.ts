import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `${amount.toLocaleString('en-GB')} XAF`;
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export function statusColor(status: string): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'VALIDATED':
    case 'CONFIRMED':
      return 'brand';
    case 'DELIVERED':
    case 'PAID':
      return 'success';
    case 'MODIFIED':
      return 'info';
    case 'REJECTED':
    case 'CANCELLED':
      return 'danger';
    default:
      return 'default';
  }
}

export function invoiceStatusColor(status: string): BadgeVariant {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PENDING':
    case 'SENT':
      return 'warning';
    case 'OVERDUE':
      return 'danger';
    case 'DRAFT':
    default:
      return 'default';
  }
}
