import type { Purchase, Supplier, PurchaseItem } from '../../types';

export type PurchaseFilters = {
  search: string;
  status: string;
  supplier: string;
  sortBy: 'poNumber' | 'createdAt' | 'total' | 'supplier' | 'status';
  sortOrder: 'asc' | 'desc';
};

export type PurchaseFormData = {
  supplierId: string;
  clientId: string;
  date: string;
  status: Purchase['status'];
  notes: string;
};

export type NewItemFormData = {
  name: string;
  model: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  uom: string;
  currency: string;
};

export interface PurchaseListProps {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  suppliers: Supplier[];
  supplierMap: Map<string, Supplier>;
  filters: PurchaseFilters;
  onFiltersChange: (filters: PurchaseFilters) => void;
  onView: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchaseId: string) => void;
  onCreateNew: () => void;
  isFetching: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
}

