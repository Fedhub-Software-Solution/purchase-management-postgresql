import type { FinType, FinStatus } from '../../lib/api/slices/finance';

export type FinanceFilters = {
  searchTerm: string;
  typeFilter: FinType | 'all';
  categoryFilter: string;
  statusFilter: FinStatus | 'all';
  paymentMethodFilter: string;
};

export type FinanceFormData = {
  type: FinType;
  category: string;
  amount: string;
  description: string;
  date: string; // yyyy-mm-dd
  paymentMethod: string;
  status: FinStatus;
  /** Optional: who the amount was spent by */
  amountSpentBy: string;
};

export type FinanceBulkImportPreviewRow = {
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
  status: string;
  amountSpentBy?: string;
  remarks: string;
};

export interface FinanceListProps {
  records: any[];
  filteredRecords: any[];
  filters: FinanceFilters;
  onFiltersChange: (filters: FinanceFilters) => void;
  onView?: (record: any) => void;
  onEdit: (record: any) => void;
  onDelete: (recordId: string) => void;
  onCreateNew: () => void;
  isFetching: boolean;
  isDeleting: boolean;
}

