import type { FinStatus, FinType } from '../../lib/api/slices/finance';

export const categoryOptions: Record<FinType, string[]> = {
  invested: ['Equipment', 'Technology', 'Marketing', 'R&D', 'Infrastructure', 'Training'],
  expense: [
    'Office Rent',
    'Utilities',
    'Software Licenses',
    'Travel',
    'Supplies',
    'Professional Services',
  ],
  tds: ['Professional Services', 'Rent', 'Interest', 'Commission', 'Contractor Payments', 'Other'],
};

export const paymentMethods = ['Bank Transfer', 'UPI', 'Credit Card', 'Debit Card', 'Cash', 'Cheque'];

export const toDate = (iso?: string | Date) => {
  if (!iso) return new Date();
  if (iso instanceof Date) return iso;
  return new Date(iso);
};

export const yyyyMmDd = (d: Date) => d.toISOString().slice(0, 10);

export const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'invested':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'expense':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'tds':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

