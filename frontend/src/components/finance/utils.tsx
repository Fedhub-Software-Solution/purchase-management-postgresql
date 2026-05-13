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

const FINANCE_STATUSES: FinStatus[] = ['completed', 'pending', 'failed'];
const FINANCE_TYPES: FinType[] = ['invested', 'expense', 'tds'];

export function normalizeFinanceStatus(value: unknown): FinStatus {
  const normalized = String(value ?? 'completed').trim().toLowerCase();
  return FINANCE_STATUSES.includes(normalized as FinStatus)
    ? (normalized as FinStatus)
    : 'completed';
}

export function isValidFinanceStatus(value: unknown): value is FinStatus {
  return FINANCE_STATUSES.includes(String(value ?? '').trim().toLowerCase() as FinStatus);
}

export function normalizeFinanceType(value: unknown): FinType {
  const normalized = String(value ?? 'expense').trim().toLowerCase();
  return FINANCE_TYPES.includes(normalized as FinType) ? (normalized as FinType) : 'expense';
}

export function collectBulkImportRowIssues(record: {
  category?: string;
  amount?: number | string;
  description?: string;
  date?: string;
  paymentMethod?: string;
  status?: string;
}): string[] {
  const issues: string[] = [];
  const dateValue = String(record.date || '').trim();

  if (!String(record.category || '').trim()) issues.push('category is required');
  if (!String(record.description || '').trim()) issues.push('description is required');
  if (!String(record.paymentMethod || '').trim()) issues.push('payment method is required');
  if (!isValidFinanceStatus(record.status)) {
    issues.push(`status must be completed, pending, or failed (got "${record.status || ''}")`);
  }
  if (!Number.isFinite(Number(record.amount)) || Number(record.amount) <= 0) {
    issues.push('amount must be greater than 0');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || Number.isNaN(new Date(dateValue).getTime())) {
    issues.push('invalid date format (use YYYY-MM-DD or DD/MM/YYYY)');
  }

  return issues;
}

export const toDate = (iso?: string | Date) => {
  if (!iso) return new Date();
  if (iso instanceof Date) return iso;
  const value = String(iso).trim();
  const datePrefix = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (datePrefix) {
    const year = Number(datePrefix[1]);
    const month = Number(datePrefix[2]) - 1;
    const day = Number(datePrefix[3]);
    // Keep finance dates as calendar dates (avoid timezone day shifts).
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  return new Date(value);
};

export const yyyyMmDd = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

