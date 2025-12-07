import React, { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Purchase, Client, PurchaseItem } from "../types";
import { DEFAULT_CURRENCY } from "../utils/currency";

// RTK Query hooks
import {
  useListPurchasesQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
} from "../lib/api/slices/purchases";
import { useListClientsQuery } from "../lib/api/slices/clients";

// Sub-components
import { PurchaseList } from "./purchase/PurchaseList";
import { PurchaseForm } from "./purchase/PurchaseForm";
import { PurchaseView } from "./purchase/PurchaseView";
import {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  generatePONumber,
} from "./purchase/utils";
import type {
  PurchaseFilters,
  PurchaseFormData,
  NewItemFormData,
} from "./purchase/types";

export function PurchaseManagement() {
  const [currentView, setCurrentView] = useState<
    "list" | "add" | "edit" | "view"
  >("list");
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);

  const [filters, setFilters] = useState<PurchaseFilters>({
    search: "",
    status: "all",
    client: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [formData, setFormData] = useState<PurchaseFormData>({
    clientId: "",
    status: "pending",
    notes: "",
  });

  const [items, setItems] = useState<Omit<PurchaseItem, "id" | "total">[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const [newItem, setNewItem] = useState<NewItemFormData>({
    name: "",
    model: "",
    supplier: "",
    quantity: 1,
    unitPrice: 0,
    uom: "pcs",
    currency: DEFAULT_CURRENCY,
  });

  // Data fetching
  const { data: purchaseData, isFetching, refetch } = useListPurchasesQuery({
    limit: 500,
  });
  const purchases: Purchase[] = purchaseData?.items ?? [];

  const { data: clientData } = useListClientsQuery({ limit: 500 });
  const clients: Client[] = clientData?.items ?? [];

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  // Mutations
  const [createPurchase, { isLoading: isCreating }] =
    useCreatePurchaseMutation();
  const [updatePurchase, { isLoading: isUpdating }] =
    useUpdatePurchaseMutation();
  const [deletePurchase, { isLoading: isDeleting }] =
    useDeletePurchaseMutation();

  // Filtered and sorted purchases
  const filteredAndSortedPurchases = useMemo(() => {
    let filtered = purchases.filter((purchase) => {
      const client = clientMap.get(purchase.clientId);
      const matchesSearch =
        purchase.poNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        (client?.company || "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (purchase.notes || "").toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" || purchase.status === filters.status;
      const matchesClient =
        filters.client === "all" || purchase.clientId === filters.client;

      return matchesSearch && matchesStatus && matchesClient;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: string | Date | number;
      let bValue: string | Date | number;

      switch (filters.sortBy) {
        case "poNumber":
          aValue = a.poNumber;
          bValue = b.poNumber;
          break;
        case "createdAt":
          aValue = a.createdAt as any;
          bValue = b.createdAt as any;
          break;
        case "total":
          aValue = a.total;
          bValue = b.total;
          break;
        default:
          aValue = a.createdAt as any;
          bValue = b.createdAt as any;
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [purchases, clientMap, filters]);

  // Handlers
  const resetForm = () => {
    setFormData({ clientId: "", status: "pending", notes: "" });
    setItems([]);
    setNewItem({
      name: "",
      model: "",
      supplier: "",
      quantity: 1,
      unitPrice: 0,
      uom: "pcs",
      currency: DEFAULT_CURRENCY,
    });
    setEditingPurchase(null);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Please add at least one item to the purchase");
      return;
    }

    const purchaseItems: PurchaseItem[] = items.map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = calculateSubtotal(items);
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    try {
      if (editingPurchase) {
        await updatePurchase({
          id: editingPurchase.id,
          patch: {
            ...formData,
            items: purchaseItems,
            subtotal,
            tax,
            total,
            baseCurrency: DEFAULT_CURRENCY,
          },
        }).unwrap();
        toast.success("Purchase updated successfully!");
      } else {
        const poNumbers = purchases.map((p) => p.poNumber);
        await createPurchase({
          poNumber: generatePONumber(poNumbers),
          ...formData,
          items: purchaseItems,
          subtotal,
          tax,
          total,
          baseCurrency: DEFAULT_CURRENCY,
        } as any).unwrap();
        toast.success("Purchase created successfully!");
      }

      setCurrentView("list");
      resetForm();
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error || err?.error || "Failed to save purchase";
      toast.error(String(msg));
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      clientId: purchase.clientId,
      status: purchase.status,
      notes: purchase.notes || "",
    });
    setItems(
      purchase.items.map((item) => ({
        name: item.name,
        model: item.model,
        supplier: item.supplier || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        uom: item.uom,
        currency: item.currency || DEFAULT_CURRENCY,
      }))
    );
    setCurrentView("edit");
  };

  const handleView = (purchase: Purchase) => {
    setViewPurchase(purchase);
    setCurrentView("view");
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePurchase(id).unwrap();
      toast.success("Purchase deleted successfully!");
      await refetch();
      if (currentView === "view" && viewPurchase?.id === id) {
        setCurrentView("list");
        setViewPurchase(null);
      }
    } catch (err: any) {
      const msg = err?.data?.error || err?.error || "Failed to delete purchase";
      toast.error(String(msg));
    }
  };

  const handleAddNew = () => {
    setEditingPurchase(null);
    resetForm();
    setCurrentView("add");
  };

  const handleCancel = () => {
    setCurrentView("list");
    resetForm();
    setEditingPurchase(null);
    setViewPurchase(null);
  };

  const updateNewItem = (field: keyof NewItemFormData, value: string | number) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const saveNewItem = () => {
    if (
      !newItem.name.trim() ||
      !newItem.model.trim() ||
      !newItem.supplier.trim() ||
      newItem.quantity <= 0 ||
      newItem.unitPrice <= 0
    ) {
      toast.error("Please fill all required fields with valid values");
      return;
    }

    const itemToAdd = {
      ...newItem,
      quantity: Number(newItem.quantity),
      unitPrice: Number(newItem.unitPrice),
    };

    setItems((prev) => [...prev, itemToAdd]);

    setNewItem({
      name: "",
      model: "",
      supplier: "",
      quantity: 1,
      unitPrice: 0,
      uom: "pcs",
      currency: DEFAULT_CURRENCY,
    });

    toast.success("Item added successfully!", {
      description: `${itemToAdd.name} from ${itemToAdd.supplier} has been added to your order.`,
    });
  };

  const handleBulkImport = (importedItems: Omit<PurchaseItem, "id" | "total">[]) => {
    setItems((prevItems) => [...prevItems, ...importedItems]);
  };

  // Keyboard shortcut for focusing item input
  const handleKeyboardShortcuts = useCallback(
    (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "=" &&
        (currentView === "add" || currentView === "edit")
      ) {
        event.preventDefault();
        const nameInput = document.querySelector(
          'input[placeholder="Enter item name"]'
        ) as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
          toast.info("🚀 Ready to add new item! Form focused.", {
            duration: 2000,
          });
        }
      }
    },
    [currentView]
  );

  useEffect(() => {
    if (currentView === "add" || currentView === "edit") {
      document.addEventListener("keydown", handleKeyboardShortcuts);
      return () => document.removeEventListener("keydown", handleKeyboardShortcuts);
    }
  }, [handleKeyboardShortcuts, currentView]);

  // Render views
  if (currentView === "list") {
    return (
      <PurchaseList
        purchases={purchases}
        filteredPurchases={filteredAndSortedPurchases}
        clients={clients}
        clientMap={clientMap}
        filters={filters}
        onFiltersChange={setFilters}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateNew={handleAddNew}
        isFetching={isFetching}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
      />
    );
  }

  if (currentView === "add" || currentView === "edit") {
    return (
      <PurchaseForm
        mode={currentView}
        formData={formData}
        onFormDataChange={setFormData}
        items={items}
        onItemsChange={setItems}
        newItem={newItem}
        onNewItemChange={updateNewItem}
        onSaveItem={saveNewItem}
        showBulkImport={showBulkImport}
        onBulkImportToggle={setShowBulkImport}
        onBulkImport={handleBulkImport}
        clients={clients}
        isLoading={isCreating || isUpdating}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        editingPurchase={editingPurchase}
      />
    );
  }

  if (currentView === "view" && viewPurchase) {
    const client = clientMap.get(viewPurchase.clientId);
    return (
      <PurchaseView
        purchase={viewPurchase}
        client={client}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleCancel}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Invalid view state</p>
    </div>
  );
}

