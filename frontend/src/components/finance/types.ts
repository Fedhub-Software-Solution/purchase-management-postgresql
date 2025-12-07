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
  reference: string;
  taxYear: string;
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

