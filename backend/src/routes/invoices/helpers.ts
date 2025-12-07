// backend/src/routes/invoices/helpers.ts
import { query, queryOne, transaction } from "../../database.js";
import type { Invoice, PurchaseItem } from "../../types.js";

// Helper to get next invoice number using PostgreSQL function
export async function nextInvoiceNumber(): Promise<string> {
  const result = await queryOne<{ next_invoice_number: string }>(
    "SELECT next_invoice_number() as next_invoice_number"
  );
  return result?.next_invoice_number || `INV-${new Date().getFullYear()}-0001`;
}

// Helper to convert database rows to Invoice with items
export async function rowToInvoice(row: any): Promise<Invoice> {
  // Fetch invoice items
  const items = await query(
    `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
    [row.id]
  );

  // Fetch related purchase IDs
  const purchaseIds = await query<{ purchase_id: string }>(
    `SELECT purchase_id FROM invoice_purchases WHERE invoice_id = $1`,
    [row.id]
  );

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    purchaseId: purchaseIds.length > 0 ? purchaseIds[0].purchase_id : "", // legacy compatibility
    poNumber: items.length > 0 ? items[0].po_number || "" : "",
    date: row.date ? new Date(row.date).toISOString().split("T")[0] : new Date(row.created_at).toISOString().split("T")[0],
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split("T")[0] : new Date(row.created_at).toISOString().split("T")[0],
    status: row.status,
    items: items.map((item: any) => ({
      id: item.id,
      purchaseId: item.purchase_id || "",
      poNumber: item.po_number || "",
      name: item.name,
      model: item.model || "",
      supplier: item.supplier || "",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      uom: item.uom || "",
      currency: item.currency || row.base_currency || "INR",
      total: Number(item.total || 0),
    })),
    subtotal: Number(row.subtotal || 0),
    tax: Number(row.tax || 0),
    total: Number(row.total || 0),
    paymentTerms: row.payment_terms || "30",
    createdAt: row.created_at,
    paidAt: row.paid_at || undefined,
    notes: row.notes || "",
    baseCurrency: row.base_currency || "INR",
  };
}


