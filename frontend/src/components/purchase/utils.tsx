import { DEFAULT_CURRENCY, convertCurrency } from '../../utils/currency';
import type { PurchaseItem } from '../../types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function getStatusIcon(status: string): ReactNode {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateSubtotal(items: PurchaseItem[]): number {
  return items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item.quantity, item.unitPrice);
    const itemTotalInINR = convertCurrency(itemTotal, item.currency, DEFAULT_CURRENCY);
    return sum + itemTotalInINR;
  }, 0);
}

export function calculateTax(subtotal: number): number {
  return subtotal * 0.18; // 18% GST
}

export function calculateTotal(items: PurchaseItem[]): number {
  const subtotal = calculateSubtotal(items);
  return subtotal + calculateTax(subtotal);
}

export function generatePONumber(existingPOs: string[]): string {
  const year = new Date().getFullYear();
  const existingPOsForYear = existingPOs.filter(
    (po) => typeof po === 'string' && po.startsWith(`PO-${year}`)
  );
  const nextNumber = existingPOsForYear.length + 1;
  return `PO-${year}-${nextNumber.toString().padStart(3, '0')}`;
}

