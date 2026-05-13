// backend/src/types.ts
export type Status = 'draft' | 'sent' | 'paid' | 'overdue' | 'approved' | 'pending' | 'rejected' | 'active' | 'inactive';

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Client {
  id: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  gstNumber: string;
  msmeNumber: string;
  cinTinNumber: string;
  panNumber: string;
  billingAddress: Address;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
  baseCurrency: string;
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  name: string;
  model: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  uom: string;
  currency: string;
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  supplierCode: string;
  panNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  categories: string[];
  status: "active" | "inactive";
  bankInfo?: {
    accountName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  clientId?: string;
  supplierId?: string;
  poNumber: string;
  date: string;
  status: 'draft' | 'approved' | 'pending' | 'rejected';
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  baseCurrency: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  purchaseId: string; // legacy compatibility
  poNumber: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: (PurchaseItem & { purchaseId: string; poNumber: string })[];
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
  baseCurrency: string;
}

