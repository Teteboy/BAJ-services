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

export function exportToCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('baj_token') ?? ''}` } });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    window.open(url, '_blank');
  }
}
