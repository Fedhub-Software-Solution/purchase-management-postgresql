import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Breadcrumb } from "./Breadcrumb";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "../utils/currency";
import type { Invoice, PurchaseItem, Purchase, Client } from "../types";

// RTK Query hooks
import {
  useListInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useGetInvoiceStatsQuery,
} from "../lib/api/slices/invoices";
import { useListClientsQuery } from "../lib/api/slices/clients";
import {
  useGetPurchasesByClientQuery,
  useLazyGetPurchasesByIdsQuery,
} from "../lib/api/slices/purchases";

// Sub-components
import { InvoiceList } from "./invoice/InvoiceList";
import { InvoiceForm } from "./invoice/InvoiceForm";
import { InvoiceView } from "./invoice/InvoiceView";
import { calculateInvoiceTotal } from "./invoice/utils";
import type { KPIStats, InvoiceFilters as InvoiceFiltersType, InvoiceFormData } from "./invoice/types";

export function InvoiceManagement() {
  const [currentView, setCurrentView] = useState<
    "list" | "create" | "view" | "edit"
  >("list");
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    (PurchaseItem & { purchaseId: string; poNumber: string })[]
  >([]);
  const [editingItems, setEditingItems] = useState<{ [key: number]: boolean }>(
    {}
  );

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: "",
    dueDate: "",
    notes: "",
    paymentTerms: "30",
  });

  const [filters, setFilters] = useState<InvoiceFiltersType>({
    search: "",
    status: "all",
    client: "all",
    dateRange: "30",
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // ---------- Data fetching ----------
  const { data: clientsRes } = useListClientsQuery();
  const clients: Client[] = Array.isArray(clientsRes)
    ? clientsRes
    : (clientsRes as any)?.items ?? [];

  const { data: purchRes } = useGetPurchasesByClientQuery(
    { clientId: formData.clientId, statuses: ["approved", "completed"] },
    { skip: !formData.clientId }
  );
  const availablePurchases: Purchase[] = useMemo(() => {
    if (Array.isArray(purchRes)) return purchRes;
    if (
      purchRes &&
      typeof purchRes === "object" &&
      "items" in purchRes &&
      Array.isArray((purchRes as any).items)
    ) {
      return (purchRes as { items: Purchase[] }).items;
    }
    return [];
  }, [purchRes]);

  const listArgs = useMemo(() => {
    const args: any = { order: "desc" as const };
    if (filters.status !== "all") args.status = filters.status;
    if (filters.client !== "all") args.clientId = filters.client;
    return args;
  }, [filters]);

  const statsArgs = useMemo(() => {
    const args: any = {};
    if (filters.client !== "all") args.clientId = filters.client;
    if (filters.dateRange !== "all") {
      const days = parseInt(filters.dateRange || "30", 10);
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);
      args.dateFrom = from.toISOString();
      args.dateTo = to.toISOString();
    }
    return args;
  }, [filters]);

  const {
    data: invoicesRes,
    isLoading: invoicesLoading,
    isFetching: invoicesFetching,
    refetch: refetchInvoices,
  } = useListInvoicesQuery(listArgs);

  const invoices: Invoice[] = useMemo(
    () => (Array.isArray(invoicesRes) ? invoicesRes : invoicesRes?.items ?? []),
    [invoicesRes]
  );

  const invoicesTotal: number = useMemo(
    () =>
      typeof (invoicesRes as any)?.total === "number"
        ? (invoicesRes as any).total
        : invoices.length,
    [invoicesRes, invoices.length]
  );

  const { data: statsRes } = useGetInvoiceStatsQuery(statsArgs);
  const serverStats: Partial<KPIStats> | undefined =
    statsRes && (Array.isArray(statsRes) ? undefined : statsRes);

  const localStats: KPIStats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );
    const paid = invoices.filter((i) => i.status === "paid");
    const pending = invoices.filter(
      (i) => i.status === "sent" || i.status === "draft"
    );
    const overdue = invoices.filter((i) => i.status === "overdue");
    return {
      totalInvoices,
      totalRevenue,
      paidInvoices: paid.length,
      paidRevenue: paid.reduce((s, i) => s + (i.total || 0), 0),
      pendingInvoices: pending.length,
      pendingRevenue: pending.reduce((s, i) => s + (i.total || 0), 0),
      overdueInvoices: overdue.length,
      overdueRevenue: overdue.reduce((s, i) => s + (i.total || 0), 0),
    };
  }, [invoices]);

  const kpis: KPIStats = {
    totalInvoices: serverStats?.totalInvoices ?? localStats.totalInvoices,
    totalRevenue: serverStats?.totalRevenue ?? localStats.totalRevenue,
    paidInvoices: serverStats?.paidInvoices ?? localStats.paidInvoices,
    paidRevenue: serverStats?.paidRevenue ?? localStats.paidRevenue,
    pendingInvoices: serverStats?.pendingInvoices ?? localStats.pendingInvoices,
    pendingRevenue: serverStats?.pendingRevenue ?? localStats.pendingRevenue,
    overdueInvoices: serverStats?.overdueInvoices ?? localStats.overdueInvoices,
    overdueRevenue: serverStats?.overdueRevenue ?? localStats.overdueRevenue,
  };

  // ---------- Mutations ----------
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation();
  const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();

  // ---------- Handlers ----------
  const handleClientSelection = useCallback(
    (clientId: string) => {
      if (formData.clientId === clientId) return;
      setFormData((prev) => ({ ...prev, clientId }));
      if (currentView !== "edit") {
        setSelectedPurchases([]);
        setSelectedItems([]);
      }
    },
    [formData.clientId, currentView]
  );

  useEffect(() => {
    if (!formData.clientId) return;
    const client = clients.find((c) => c.id === formData.clientId);
    if (availablePurchases && availablePurchases.length >= 0) {
      toast.success(
        `${availablePurchases.length} purchase orders available for ${
          client?.company ?? "client"
        }`
      );
    }
  }, [formData.clientId, availablePurchases, clients]);

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const as = [...a].sort();
    const bs = [...b].sort();
    return as.every((v, i) => v === bs[i]);
  };

  const handlePurchaseOrderSelection = useCallback(
    (purchaseIds: string[]) => {
      const next = Array.from(new Set(purchaseIds)).sort();

      setSelectedPurchases((prev) => {
        if (arraysEqual(prev, next)) return prev;

        const byId = new Map<string, Purchase>();
        availablePurchases.forEach((p) => byId.set(p.id, p));

        const allItems: (PurchaseItem & {
          purchaseId: string;
          poNumber: string;
        })[] = [];

        next.forEach((pid) => {
          const p = byId.get(pid);
          if (p) {
            p.items.forEach((it) =>
              allItems.push({ ...it, purchaseId: p.id, poNumber: p.poNumber })
            );
          }
        });

        setSelectedItems(allItems);
        return next;
      });
    },
    [availablePurchases]
  );

  const handleRemoveItem = (itemIndex: number) => {
    setSelectedItems((prev) => prev.filter((_, index) => index !== itemIndex));
  };

  const handleUpdateItem = (itemIndex: number, field: string, value: any) => {
    setSelectedItems((prev) =>
      prev.map((item, index) => {
        if (index === itemIndex) {
          const updatedItem: any = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            const qty = parseFloat(String(updatedItem.quantity ?? 0));
            const price = parseFloat(String(updatedItem.unitPrice ?? 0));
            updatedItem.total =
              (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const toggleEditItem = (itemIndex: number) => {
    setEditingItems((prev) => ({ ...prev, [itemIndex]: !prev[itemIndex] }));
  };

  const cancelEditItem = (itemIndex: number) => {
    setEditingItems((prev) => ({ ...prev, [itemIndex]: false }));
  };

  const saveEditItem = (itemIndex: number) => {
    setEditingItems((prev) => ({ ...prev, [itemIndex]: false }));
    toast.success("Item updated successfully");
  };

  const resetForm = () => {
    setFormData({ clientId: "", dueDate: "", notes: "", paymentTerms: "30" });
    setSelectedPurchases([]);
    setSelectedItems([]);
    setEditingItems({});
    setEditInvoice(null);
    setCurrentView("list");
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to create an invoice");
      return;
    }
    if (
      !formData.clientId ||
      !formData.dueDate ||
      selectedPurchases.length === 0
    ) {
      toast.error(
        "Please fill in all required fields including client, due date, and purchase orders"
      );
      return;
    }

    const { subtotal, tax, total } = calculateInvoiceTotal(selectedItems);
    try {
      const created = await createInvoice({
        clientId: formData.clientId,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: "draft",
        items: selectedItems,
        subtotal,
        tax,
        total,
        notes: formData.notes,
        paymentTerms: formData.paymentTerms,
        purchaseIds: selectedPurchases,
      }).unwrap();

      const createdInvoice: Invoice = (created as any)?.invoice ?? created;
      const poNumbers = selectedPurchases
        .map((id) => availablePurchases.find((p) => p.id === id)?.poNumber)
        .filter(Boolean)
        .join(", ");

      toast.success(
        `Invoice ${
          createdInvoice.invoiceNumber
        } created successfully! Total: ${formatCurrency(
          createdInvoice.total || total,
          DEFAULT_CURRENCY
        )} | PO: ${poNumbers}`,
        { duration: 5000 }
      );
      resetForm();
      refetchInvoices();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create invoice");
    }
  };

  const handleEditSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to update the invoice");
      return;
    }
    if (!formData.clientId || !formData.dueDate) {
      toast.error("Please fill in client and due date");
      return;
    }

    if (!editInvoice) return;

    const { subtotal, tax, total } = calculateInvoiceTotal(selectedItems);
    try {
      const purchaseIds =
        selectedPurchases.length > 0
          ? selectedPurchases
          : editInvoice.purchaseIds ??
            (editInvoice.purchaseId ? [editInvoice.purchaseId] : []);

      const cleanItems = selectedItems.map((it) => ({
        id: it.id,
        name: it.name,
        model: it.model ?? "",
        supplier: it.supplier ?? "",
        quantity: Number(it.quantity) || 0,
        uom: it.uom ?? "",
        currency: it.currency,
        unitPrice: Number(it.unitPrice) || 0,
        total: Number(it.total) || 0,
      }));

      await updateInvoice({
        id: editInvoice.id,
        data: {
          clientId: formData.clientId,
          dueDate: new Date(formData.dueDate).toISOString(),
          items: cleanItems,
          subtotal,
          tax,
          total,
          notes: formData.notes,
          paymentTerms: formData.paymentTerms,
          ...(purchaseIds.length ? { purchaseIds } : {}),
        },
      }).unwrap();

      const poNumbers = selectedPurchases
        .map((id) => availablePurchases.find((p) => p.id === id)?.poNumber)
        .filter(Boolean)
        .join(", ");

      toast.success(
        `Invoice ${
          editInvoice.invoiceNumber
        } updated successfully! Total: ${formatCurrency(
          total,
          DEFAULT_CURRENCY
        )} | PO: ${poNumbers}`,
        { duration: 5000 }
      );

      resetForm();
      refetchInvoices();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update invoice");
    }
  };

  const updateInvoiceStatus = async (
    invoiceId: string,
    newStatus: Invoice["status"]
  ) => {
    try {
      setStatusUpdatingId(invoiceId);
      await updateInvoice({
        id: invoiceId,
        data: { status: newStatus },
      }).unwrap();
      const statusMessages: Record<string, string> = {
        sent: "Invoice sent successfully!",
        paid: "Invoice marked as paid!",
        overdue: "Invoice marked as overdue!",
        draft: "Invoice moved to draft!",
      };
      toast.success(statusMessages[newStatus] || "Invoice status updated!");
      refetchInvoices();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleAddNew = () => {
    setEditInvoice(null);
    resetForm();
    setCurrentView("create");
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditInvoice(invoice);
    setCurrentView("edit");
    const due =
      invoice.dueDate instanceof Date
        ? invoice.dueDate
        : new Date(invoice.dueDate);
    setFormData({
      clientId: invoice.clientId,
      dueDate: due.toISOString().split("T")[0],
      notes: invoice.notes || "",
      paymentTerms: invoice.paymentTerms || "30",
    });
    setSelectedPurchases(
      invoice.purchaseIds ?? (invoice.purchaseId ? [invoice.purchaseId] : [])
    );
    setSelectedItems(
      (invoice.items || []).map((item) => ({
        ...item,
        purchaseId: invoice.purchaseIds?.[0] || invoice.purchaseId || "",
        poNumber: "",
      }))
    );
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const inv = invoices.find((i) => i.id === invoiceId);
      await deleteInvoice({ id: invoiceId }).unwrap();
      toast.success(
        `Invoice ${inv?.invoiceNumber ?? invoiceId} deleted successfully!`
      );
      refetchInvoices();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete invoice");
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewInvoice(invoice);
    setCurrentView("view");
  };

  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
  const { subtotal, tax, total } = calculateInvoiceTotal(selectedItems);

  // Filter invoices based on search
  const filteredInvoices = useMemo(() => {
    if (!filters.search) return invoices;
    const searchLower = filters.search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        clients.find((c) => c.id === inv.clientId)?.company
          .toLowerCase()
          .includes(searchLower)
    );
  }, [invoices, filters.search, clients]);

  // Render views
  if (currentView === "list") {
    return (
      <>
        {/* <Breadcrumb items={breadcrumbItems} currentPage="Invoice Management" /> */}
        <InvoiceList
          invoices={filteredInvoices}
          invoicesTotal={invoicesTotal}
          invoicesFetching={invoicesFetching}
          kpis={kpis}
          filters={filters}
          onFiltersChange={setFilters}
          clients={clients}
          statusUpdatingId={statusUpdatingId}
          deleting={deleting}
          onView={handleViewInvoice}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          onStatusUpdate={updateInvoiceStatus}
          onCreateNew={handleAddNew}
        />
      </>
    );
  }

  if (currentView === "create") {
    return (
      <>
        <Breadcrumb items={breadcrumbItems} currentPage="Create Invoice" />
        <InvoiceForm
          mode="create"
          formData={formData}
          onFormDataChange={setFormData}
          selectedPurchases={selectedPurchases}
          onPurchaseSelection={handlePurchaseOrderSelection}
          selectedItems={selectedItems}
          editingItems={editingItems}
          onItemUpdate={handleUpdateItem}
          onItemRemove={handleRemoveItem}
          onItemToggleEdit={toggleEditItem}
          onItemSaveEdit={saveEditItem}
          onItemCancelEdit={cancelEditItem}
          clients={clients}
          availablePurchases={availablePurchases}
          subtotal={subtotal}
          tax={tax}
          total={total}
          isLoading={creating}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      </>
    );
  }

  if (currentView === "view" && viewInvoice) {
    return (
      <>
        <Breadcrumb items={breadcrumbItems} currentPage="Invoice Details" />
        <InvoiceView
          invoice={viewInvoice}
          clients={clients}
          onBack={() => setCurrentView("list")}
        />
      </>
    );
  }

  if (currentView === "edit" && editInvoice) {
    return (
      <>
        <Breadcrumb items={breadcrumbItems} currentPage="Edit Invoice" />
        <InvoiceForm
          mode="edit"
          formData={formData}
          onFormDataChange={setFormData}
          selectedPurchases={selectedPurchases}
          onPurchaseSelection={handlePurchaseOrderSelection}
          selectedItems={selectedItems}
          editingItems={editingItems}
          onItemUpdate={handleUpdateItem}
          onItemRemove={handleRemoveItem}
          onItemToggleEdit={toggleEditItem}
          onItemSaveEdit={saveEditItem}
          onItemCancelEdit={cancelEditItem}
          clients={clients}
          availablePurchases={availablePurchases}
          subtotal={subtotal}
          tax={tax}
          total={total}
          isLoading={updating}
          onSubmit={handleEditSubmit}
          onCancel={resetForm}
          editInvoice={editInvoice}
        />
      </>
    );
  }

  return null;
}

