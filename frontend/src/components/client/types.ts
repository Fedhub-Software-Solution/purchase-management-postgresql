import type { Client } from '../../types';

export type ClientFilters = {
  search: string;
  state: string;
  status: string;
  sortBy: 'company' | 'createdAt' | 'city';
  sortOrder: 'asc' | 'desc';
};

export type ClientFormData = {
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  gstNumber: string;
  msmeNumber: string;
  panNumber: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
};

export interface ClientListProps {
  clients: Client[];
  filteredClients: Client[];
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onCreateNew: () => void;
  isFetching: boolean;
  isDeleting: boolean;
}

