import type { Client } from '../../types';

export type KPIStats = {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  paidRevenue: number;
  pendingInvoices: number;
  pendingRevenue: number;
  overdueInvoices: number;
  overdueRevenue: number;
};

export type InvoiceFilters = {
  search: string;
  status: string;
  client: string;
  dateRange: string;
};

export type InvoiceFormData = {
  clientId: string;
  dueDate: string;
  notes: string;
  paymentTerms: string;
};

export type { Client };

