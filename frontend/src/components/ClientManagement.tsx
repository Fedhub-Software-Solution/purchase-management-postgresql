import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useListClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "../lib/api/slices/clients";
import type { Client } from "../types";
import { ClientList } from "./client/ClientList";
import { ClientForm } from "./client/ClientForm";
import type { ClientFilters, ClientFormData } from "./client/types";

function resolveClientRecord(
  clientId: string,
  clients: Client[],
  fallback: Client
): Client | null {
  return (
    clients.find((client) => client.id === clientId) ??
    clients.find(
      (client) =>
        client.email.trim().toLowerCase() === fallback.email.trim().toLowerCase() &&
        client.company.trim() === fallback.company.trim()
    ) ??
    null
  );
}

export function ClientManagement() {
  const [currentView, setCurrentView] = useState<"list" | "add" | "edit">("list");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [filters, setFilters] = useState<ClientFilters>({
    search: "",
    state: "all",
    status: "all",
    sortBy: "company",
    sortOrder: "asc",
  });

  const [formData, setFormData] = useState<ClientFormData>({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    status: "active",
    gstNumber: "",
    msmeNumber: "",
    cinTinNumber: "",
    panNumber: "",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
    },
  });

  // Data fetching
  const { data, isFetching, refetch } = useListClientsQuery(
    { limit: 500 },
    { refetchOnMountOrArgChange: true }
  );
  const serverClients: Client[] = data?.items ?? [];

  // Mutations
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  // Filtered and sorted clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = serverClients.filter((client) => {
      const matchesSearch =
        client.company.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.phone.includes(filters.search);

      const matchesState =
        filters.state === "all" || client.billingAddress.state === filters.state;
      const matchesStatus =
        filters.status === "all" || (client.status as any) === filters.status;

      return matchesSearch && matchesState && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (filters.sortBy) {
        case "company":
          aValue = a.company;
          bValue = b.company;
          break;
        case "contactPerson":
          aValue = a.contactPerson;
          bValue = b.contactPerson;
          break;
        case "email":
          aValue = a.email;
          bValue = b.email;
          break;
        case "phone":
          aValue = a.phone;
          bValue = b.phone;
          break;
        case "createdAt": {
          const aC = (a as any).createdAt;
          const bC = (b as any).createdAt;
          aValue = typeof aC === "string" ? aC : (aC as Date);
          bValue = typeof bC === "string" ? bC : (bC as Date);
          break;
        }
        case "city":
          aValue = a.billingAddress.city;
          bValue = b.billingAddress.city;
          break;
        case "status":
          aValue = String((a.status as any) || "");
          bValue = String((b.status as any) || "");
          break;
        default:
          aValue = a.company;
          bValue = b.company;
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [serverClients, filters]);

  const uniqueStates = useMemo(() => {
    const states = [...new Set(serverClients.map((client) => client.billingAddress.state))];
    return states.filter((s) => s).sort();
  }, [serverClients]);

  // Handlers
  const resetForm = () => {
    setFormData({
      company: "",
      contactPerson: "",
      email: "",
      phone: "",
      status: "active",
      gstNumber: "",
      msmeNumber: "",
      cinTinNumber: "",
      panNumber: "",
      billingAddress: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      },
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      },
      bankDetails: {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
      },
    });
    setSameAsBilling(true);
  };

  const handleSubmit = async () => {
    const payload: Omit<Client, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Client, "createdAt">> = {
      company: formData.company,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      gstNumber: formData.gstNumber,
      msmeNumber: formData.msmeNumber,
      cinTinNumber: formData.cinTinNumber,
      panNumber: formData.panNumber,
      billingAddress: formData.billingAddress,
      shippingAddress: sameAsBilling ? formData.billingAddress : formData.shippingAddress,
      bankDetails: formData.bankDetails?.bankName ? formData.bankDetails : undefined,
      baseCurrency: "INR",
    } as any;

    try {
      if (editingClient) {
        const { data: freshData } = await refetch();
        const clients = freshData?.items ?? data?.items ?? [];
        const target = resolveClientRecord(editingClient.id, clients, editingClient);
        if (!target) {
          toast.error("This client is no longer available. Refresh the list and open it again.");
          setCurrentView("list");
          setEditingClient(null);
          resetForm();
          return;
        }

        await updateClient({ id: target.id, patch: payload }).unwrap();
        toast.success("Client updated successfully!");
      } else {
        await createClient(payload as any).unwrap();
        toast.success("Client added successfully!");
      }
      setCurrentView("list");
      resetForm();
      setEditingClient(null);
      refetch();
    } catch (err: any) {
      if (err?.status === 404) {
        await refetch();
        toast.error("Client not found. The list was refreshed — open the client again and retry.");
        return;
      }
      const msg = err?.data?.error || err?.error || "Failed to save client";
      toast.error(String(msg));
    }
  };

  const handleEdit = async (client: Client) => {
    const { data: freshData } = await refetch();
    const clients = freshData?.items ?? data?.items ?? [];
    const resolved = resolveClientRecord(client.id, clients, client) ?? client;

    setEditingClient(resolved);
    setFormData({
      company: resolved.company,
      contactPerson: resolved.contactPerson,
      email: resolved.email,
      phone: resolved.phone,
      status: (resolved.status as "active" | "inactive") || "active",
      gstNumber: resolved.gstNumber || "",
      msmeNumber: resolved.msmeNumber || "",
      cinTinNumber: resolved.cinTinNumber || "",
      panNumber: resolved.panNumber || "",
      billingAddress: resolved.billingAddress,
      shippingAddress: (resolved as any).shippingAddress || resolved.billingAddress,
      bankDetails: (resolved as any).bankDetails || {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
      },
    });
    setSameAsBilling(((resolved as any).sameAsShipping as boolean) || false);
    setCurrentView("edit");
  };

  const handleDelete = async (clientId: string) => {
    try {
      await deleteClient(clientId).unwrap();
      toast.success("Client deleted successfully!");
      refetch();
    } catch (err: any) {
      const msg = err?.data?.error || err?.error || "Failed to delete client";
      toast.error(String(msg));
    }
  };

  const handleAddNew = () => {
    setEditingClient(null);
    resetForm();
    setCurrentView("add");
  };

  const handleCancel = () => {
    setCurrentView("list");
    resetForm();
    setEditingClient(null);
  };

  const copyShippingFromBilling = () => {
    if (sameAsBilling) {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress },
      }));
    }
  };

  // Render views
  if (currentView === "list") {
    return (
      <ClientList
        clients={serverClients}
        filteredClients={filteredAndSortedClients}
        filters={filters}
        onFiltersChange={setFilters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateNew={handleAddNew}
        isFetching={isFetching}
        isDeleting={isDeleting}
        uniqueStates={uniqueStates}
      />
    );
  }

  if (currentView === "add" || currentView === "edit") {
    return (
      <ClientForm
        mode={currentView}
        formData={formData}
        onFormDataChange={setFormData}
        sameAsBilling={sameAsBilling}
        onSameAsBillingChange={setSameAsBilling}
        onCopyShippingFromBilling={copyShippingFromBilling}
        isLoading={isCreating || isUpdating}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        editingClient={editingClient}
      />
    );
  }

  return null;
}

