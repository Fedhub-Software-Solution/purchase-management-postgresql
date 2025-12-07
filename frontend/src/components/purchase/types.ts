import type { Purchase, Client, PurchaseItem } from '../../types';

export type PurchaseFilters = {
  search: string;
  status: string;
  client: string;
  sortBy: 'poNumber' | 'createdAt' | 'total';
  sortOrder: 'asc' | 'desc';
};

export type PurchaseFormData = {
  clientId: string;
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
  clients: Client[];
  clientMap: Map<string, Client>;
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

