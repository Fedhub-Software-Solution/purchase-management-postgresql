import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  useCreateSupplierMutation,
  useDeleteSupplierMutation,
  useListSuppliersQuery,
  useUpdateSupplierMutation,
} from "../lib/api/slices/suppliers";
import type { Supplier } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type SupplierForm = {
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
  bankInfo: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    upiId: string;
  };
  notes: string;
};

const supplierCategories = [
  "Raw Materials",
  "Components",
  "Tools & Dies",
  "Machinery",
  "Spare Parts",
  "Services",
  "Packaging",
  "Chemicals",
];

const defaultForm: SupplierForm = {
  name: "",
  supplierCode: "",
  panNumber: "",
  contactPerson: "",
  email: "",
  phone: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  categories: [],
  status: "active",
  bankInfo: {
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    upiId: "",
  },
  notes: "",
};

export function SupplierManagement() {
  const PAGE_SIZE = 10;
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "code" | "contact" | "phone" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(defaultForm);

  const { data, isFetching, refetch } = useListSuppliersQuery({
    limit: 500,
    q: query || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const suppliers = useMemo(() => data?.items ?? [], [data]);
  const sortedSuppliers = useMemo(() => {
    const valueOf = (s: Supplier) => {
      switch (sortBy) {
        case "code":
          return String(s.supplierCode || "").toLowerCase();
        case "contact":
          return String(s.contactPerson || "").toLowerCase();
        case "phone":
          return String(s.phone || "").toLowerCase();
        case "status":
          return String(s.status || "").toLowerCase();
        case "name":
        default:
          return String(s.name || "").toLowerCase();
      }
    };
    return suppliers.slice().sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [suppliers, sortBy, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(sortedSuppliers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSuppliers = useMemo(
    () => sortedSuppliers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedSuppliers, safePage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, suppliers.length, sortBy, sortOrder]);

  const hasActiveFilters = Boolean(query) || statusFilter !== "all";
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };
  const toggleSort = (column: "name" | "code" | "contact" | "phone" | "status") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  };
  const sortIcon = (column: "name" | "code" | "contact" | "phone" | "status") => {
    if (sortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();

  const isSaving = isCreating || isUpdating;

  const onChange = <K extends keyof SupplierForm>(key: K, value: SupplierForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name || "",
      supplierCode: supplier.supplierCode || "",
      panNumber: supplier.panNumber || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      gstin: supplier.gstin || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      pincode: supplier.pincode || "",
      categories: supplier.categories || [],
      status: (supplier.status || "active") as "active" | "inactive",
      bankInfo: {
        accountName: supplier.bankInfo?.accountName || "",
        bankName: supplier.bankInfo?.bankName || "",
        accountNumber: supplier.bankInfo?.accountNumber || "",
        ifscCode: supplier.bankInfo?.ifscCode || "",
        branch: supplier.bankInfo?.branch || "",
        upiId: supplier.bankInfo?.upiId || "",
      },
      notes: supplier.notes || "",
    });
    setView("edit");
  };

  const resetForm = () => {
    setEditing(null);
    setForm(defaultForm);
    setView("list");
  };

  const openCreateScreen = () => {
    setEditing(null);
    setForm(defaultForm);
    setView("add");
  };

  const submit = async () => {
    if (!form.name.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please fill all required supplier fields");
      return;
    }

    try {
      if (editing) {
        await updateSupplier({ id: editing.id, patch: form }).unwrap();
        toast.success("Supplier updated");
      } else {
        await createSupplier(form).unwrap();
        toast.success("Supplier created");
      }
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(String(err?.data?.error || err?.error || "Failed to save supplier"));
    }
  };

  const removeSupplier = async (id: string) => {
    try {
      await deleteSupplier(id).unwrap();
      toast.success("Supplier deleted");
      if (editing?.id === id) resetForm();
      refetch();
    } catch (err: any) {
      toast.error(String(err?.data?.error || err?.error || "Failed to delete supplier"));
    }
  };

  const toggleCategory = (category: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  };

  const onBankChange = (key: keyof SupplierForm["bankInfo"], value: string) => {
    setForm((prev) => ({
      ...prev,
      bankInfo: { ...prev.bankInfo, [key]: value },
    }));
  };

  const SupplierFormScreen = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {editing ? "Edit Supplier" : "Add Supplier"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Fill supplier details and bank information.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={resetForm}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <Tabs defaultValue="supplier">
          <TabsList className="w-full">
            <TabsTrigger value="supplier">Supplier Information</TabsTrigger>
            <TabsTrigger value="bank">Bank Info</TabsTrigger>
          </TabsList>

          <TabsContent value="supplier" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Name *</Label>
                <Input value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Enter supplier name" />
              </div>
              <div className="space-y-2">
                <Label>Supplier Code *</Label>
                <Input value={form.supplierCode} onChange={(e) => onChange("supplierCode", e.target.value)} placeholder="Enter supplier code" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input value={form.contactPerson} onChange={(e) => onChange("contactPerson", e.target.value)} placeholder="Enter contact person name" />
              </div>
              <div className="space-y-2">
                <Label>PAN #</Label>
                <Input value={form.panNumber} onChange={(e) => onChange("panNumber", e.target.value)} placeholder="Enter PAN number" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="Enter email" />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="Enter phone number" />
              </div>
              <div className="space-y-2">
                <Label>GSTIN *</Label>
                <Input value={form.gstin} onChange={(e) => onChange("gstin", e.target.value)} placeholder="Enter GSTIN" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={form.address} onChange={(e) => onChange("address", e.target.value)} placeholder="Enter address" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => onChange("city", e.target.value)} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input value={form.state} onChange={(e) => onChange("state", e.target.value)} placeholder="State" />
              </div>
              <div className="space-y-2">
                <Label>Pincode *</Label>
                <Input value={form.pincode} onChange={(e) => onChange("pincode", e.target.value)} placeholder="Pincode" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="border rounded-md p-3 flex flex-wrap gap-2">
                {supplierCategories.map((category) => {
                  const selected = form.categories.includes(category);
                  return (
                    <Button
                      key={category}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleCategory(category)}
                      className="rounded-full"
                    >
                      {category}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: "active" | "inactive") => onChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Upload Attachments</Label>
                <Input type="file" multiple />
                <p className="text-xs text-muted-foreground">PDF, DOC, Images (Max 5MB each)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => onChange("notes", e.target.value)}
                rows={3}
                placeholder="Additional notes about the supplier"
              />
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input value={form.bankInfo.accountName} onChange={(e) => onBankChange("accountName", e.target.value)} placeholder="Enter account holder name" />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={form.bankInfo.bankName} onChange={(e) => onBankChange("bankName", e.target.value)} placeholder="Enter bank name" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={form.bankInfo.accountNumber} onChange={(e) => onBankChange("accountNumber", e.target.value)} placeholder="Enter account number" />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input value={form.bankInfo.ifscCode} onChange={(e) => onBankChange("ifscCode", e.target.value)} placeholder="Enter IFSC code" />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={form.bankInfo.branch} onChange={(e) => onBankChange("branch", e.target.value)} placeholder="Enter branch" />
              </div>
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input value={form.bankInfo.upiId} onChange={(e) => onBankChange("upiId", e.target.value)} placeholder="Enter UPI ID" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isSaving}>
            {editing ? "Update Supplier" : "Add Supplier"}
          </Button>
        </div>
      </div>
    </div>
  );

  const SupplierListScreen = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Supplier Management</h2>
        <p className="text-sm text-muted-foreground">
          Create and maintain supplier master data.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search supplier, contact, email..."
                    className="pl-10 h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v: "all" | "active" | "inactive") => setStatusFilter(v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-3" title="Clear Filters">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="md:col-span-2 lg:col-span-2 flex justify-end">
                <Button type="button" onClick={openCreateScreen} className="h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">
                    <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("name")}>
                      Name
                      {sortIcon("name")}
                    </Button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("code")}>
                      Code
                      {sortIcon("code")}
                    </Button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("contact")}>
                      Contact
                      {sortIcon("contact")}
                    </Button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("phone")}>
                      Phone
                      {sortIcon("phone")}
                    </Button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("status")}>
                      Status
                      {sortIcon("status")}
                    </Button>
                  </th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td className="px-4 py-4 text-muted-foreground" colSpan={6}>Loading suppliers...</td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-muted-foreground" colSpan={6}>No suppliers found.</td>
                  </tr>
                ) : (
                  paginatedSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-t">
                      <td className="px-4 py-3">{supplier.name}</td>
                      <td className="px-4 py-3">{supplier.supplierCode || "-"}</td>
                      <td className="px-4 py-3">{supplier.contactPerson || "-"}</td>
                      <td className="px-4 py-3">{supplier.phone || "-"}</td>
                      <td className="px-4 py-3 capitalize">{supplier.status}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(supplier)}>
                          Edit
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeSupplier(supplier.id)} disabled={isDeleting}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sortedSuppliers.length > PAGE_SIZE && (
            <div className="px-4 py-3 border-t grid grid-cols-3 items-center">
              <p className="text-sm text-muted-foreground justify-self-start">
                Showing {(safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, sortedSuppliers.length)} of {sortedSuppliers.length} suppliers
              </p>
              <div className="flex items-center gap-2 justify-self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next
                </Button>
              </div>
              <div />
            </div>
          )}
      </div>
    </div>
  );

  return view === "list" ? SupplierListScreen : SupplierFormScreen;
}
