import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  useListFinanceQuery,
  useGetFinanceStatsQuery,
  useCreateFinanceMutation,
  useUpdateFinanceMutation,
  useDeleteFinanceMutation,
} from "../lib/api/slices/finance";
import type { FinanceRecord as ApiFinanceRecord, FinStatus, FinType } from "../lib/api/slices/finance";
import { FinanceOverview } from "./finance/FinanceOverview";
import { FinanceForm } from "./finance/FinanceForm";
import { FinanceList } from "./finance/FinanceList";
import { categoryOptions, toDate, yyyyMmDd } from "./finance/utils";
import type { FinanceFilters, FinanceFormData } from "./finance/types";

export function FinanceManagement() {
  const [currentView, setCurrentView] = useState<"overview" | "form" | "records">("overview");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FinanceFilters>({
    searchTerm: "",
    typeFilter: "all",
    categoryFilter: "all",
    statusFilter: "all",
    paymentMethodFilter: "all",
  });

  const [formData, setFormData] = useState<FinanceFormData>({
    type: "expense",
    category: "",
    amount: "",
    description: "",
    date: yyyyMmDd(new Date()),
    paymentMethod: "",
    status: "completed",
    reference: "",
    taxYear: "",
  });

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Query args & RTK Query calls
  const listArgs = useMemo(
    () => ({
      search: filters.searchTerm || undefined,
      type: filters.typeFilter === "all" ? undefined : filters.typeFilter,
      category: filters.categoryFilter === "all" ? undefined : filters.categoryFilter,
      status: filters.statusFilter === "all" ? undefined : filters.statusFilter,
      paymentMethod: filters.paymentMethodFilter === "all" ? undefined : filters.paymentMethodFilter,
      order: "desc" as const,
      limit: 500,
    }),
    [filters]
  );

  const {
    data: listData,
    isFetching,
    refetch: refetchList,
  } = useListFinanceQuery(listArgs);

  const {
    data: statsData,
    refetch: refetchStats,
  } = useGetFinanceStatsQuery({
    search: listArgs.search,
    type: listArgs.type,
    category: listArgs.category,
    status: listArgs.status,
    paymentMethod: listArgs.paymentMethod,
  });

  const [createFinance, { isLoading: creating }] = useCreateFinanceMutation();
  const [updateFinance, { isLoading: updating }] = useUpdateFinanceMutation();
  const [deleteFinance, { isLoading: removing }] = useDeleteFinanceMutation();

  const financeData = useMemo(
    () =>
      (listData?.items ?? []).map((x: ApiFinanceRecord) => ({
        ...x,
        date: toDate(x.date),
        createdAt: toDate(x.createdAt),
        updatedAt: toDate(x.updatedAt),
      })),
    [listData]
  );

  // Derived helpers for filters & KPI
  const availableCategories = useMemo(() => {
    if (filters.typeFilter === "all") {
      return Array.from(new Set(financeData.map((r) => r.category))).sort();
    }
    return categoryOptions[filters.typeFilter as FinType] || [];
  }, [filters.typeFilter, financeData]);

  const availablePaymentMethods = useMemo(
    () => Array.from(new Set(financeData.map((r) => r.paymentMethod))).sort(),
    [financeData]
  );

  // Client-side filtering
  const locallyFiltered = useMemo(() => {
    const s = (filters.searchTerm || "").toLowerCase();
    return financeData.filter((r) => {
      const searchMatch =
        !s ||
        r.description.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s) ||
        r.paymentMethod.toLowerCase().includes(s) ||
        (r.reference || "").toLowerCase().includes(s);

      const typeMatch = filters.typeFilter === "all" || r.type === filters.typeFilter;
      const categoryMatch = filters.categoryFilter === "all" || r.category === filters.categoryFilter;
      const statusMatch = filters.statusFilter === "all" || r.status === filters.statusFilter;
      const pmMatch =
        filters.paymentMethodFilter === "all" || r.paymentMethod === filters.paymentMethodFilter;

      return searchMatch && typeMatch && categoryMatch && statusMatch && pmMatch;
    });
  }, [financeData, filters]);

  // KPI cards — use server stats when present; else fallback to computed
  const kpi = useMemo(() => {
    if (statsData) return statsData;
    const invested = financeData
      .filter((r) => r.type === "invested" && r.status === "completed")
      .reduce((s, r) => s + r.amount, 0);
    const expenses = financeData
      .filter((r) => r.type === "expense" && r.status === "completed")
      .reduce((s, r) => s + r.amount, 0);
    const tds = financeData
      .filter((r) => r.type === "tds" && r.status === "completed")
      .reduce((s, r) => s + r.amount, 0);
    return {
      totalInvested: invested,
      totalExpenses: expenses,
      totalTDS: tds,
      profit: invested - expenses - tds,
    };
  }, [statsData, financeData]);

  // CRUD handlers
  const resetForm = () =>
    setFormData({
      type: "expense",
      category: "",
      amount: "",
      description: "",
      date: yyyyMmDd(new Date()),
      paymentMethod: "",
      status: "completed",
      reference: "",
      taxYear: "",
    });

  const startCreate = () => {
    setFormMode("create");
    setEditingId(null);
    resetForm();
    setCurrentView("form");
  };

  const startEdit = (r: ApiFinanceRecord) => {
    setFormMode("edit");
    setEditingId(r.id);
    setFormData({
      type: r.type,
      category: r.category,
      amount: String(r.amount ?? ""),
      description: r.description ?? "",
      date: yyyyMmDd(toDate(r.date)),
      paymentMethod: r.paymentMethod ?? "",
      status: r.status as FinStatus,
      reference: r.reference ?? "",
      taxYear: r.taxYear ?? "",
    });
    setCurrentView("form");
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.amount || !formData.description || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount || 0),
      description: formData.description,
      date: new Date(formData.date).toISOString(),
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      reference:
        formData.reference || `${formData.type.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      taxYear: formData.type === "tds" ? formData.taxYear : undefined,
    };

    try {
      if (formMode === "create") {
        await createFinance(payload).unwrap();
        toast.success("Finance record added");
      } else if (editingId) {
        await updateFinance({ id: editingId, data: payload }).unwrap();
        toast.success("Finance record updated");
      }
      await Promise.all([refetchList(), refetchStats()]);
      setCurrentView("overview");
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || "Failed to save record");
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteFinance({ id }).unwrap();
      toast.success("Record deleted");
      await Promise.all([refetchList(), refetchStats()]);
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || "Failed to delete");
    }
  };

  // Bulk Upload
  const onBulkUploadClick = () => uploadInputRef.current?.click();

  const parseCSV = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = (k: string) => header.indexOf(k);

    const rows = lines.slice(1).map((line) => line.split(","));
    return rows.map((cols) => ({
      type: (cols[idx("type")] || "").trim() as FinType,
      category: (cols[idx("category")] || "").trim(),
      amount: Number((cols[idx("amount")] || "0").trim()),
      description: (cols[idx("description")] || "").trim(),
      date: new Date((cols[idx("date")] || "").trim()).toISOString(),
      paymentMethod: (cols[idx("paymentmethod")] || cols[idx("payment_method")] || "").trim(),
      status: ((cols[idx("status")] || "completed").trim() as FinStatus) || "completed",
      reference: (cols[idx("reference")] || "").trim(),
      taxYear: (cols[idx("taxyear")] || cols[idx("tax_year")] || "").trim() || undefined,
    }));
  };

  const handleBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      let records: any[] = [];

      if (file.name.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(text);
        records = Array.isArray(json) ? json : json?.records || [];
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        records = parseCSV(text);
      } else {
        toast.error("Unsupported file type. Use .csv or .json");
        return;
      }

      if (!Array.isArray(records) || records.length === 0) {
        toast.error("No valid records found in file");
        return;
      }

      const normalized = records.map((r, i) => ({
        type: (r.type || "expense") as FinType,
        category: r.category || "",
        amount: Number(r.amount || 0),
        description: r.description || `Imported record #${i + 1}`,
        date: new Date(r.date || new Date()).toISOString(),
        paymentMethod: r.paymentMethod || "Bank Transfer",
        status: (r.status || "completed") as FinStatus,
        reference:
          r.reference || `${(r.type || "EXP").toString().toUpperCase()}-${Date.now().toString().slice(-6)}`,
        taxYear: r.taxYear || undefined,
      }));

      toast.message("Bulk upload started", {
        description: `Uploading ${normalized.length} records…`,
      });

      let ok = 0;
      let fail = 0;
      /* eslint-disable no-await-in-loop */
      for (const rec of normalized) {
        try {
          await createFinance(rec).unwrap();
          ok++;
        } catch {
          fail++;
        }
      }
      /* eslint-enable no-await-in-loop */

      await Promise.all([refetchList(), refetchStats()]);

      if (fail === 0) {
        toast.success(`Bulk upload complete (${ok} records)`);
      } else {
        toast.warning(`Bulk upload finished: ${ok} succeeded, ${fail} failed`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Bulk upload failed");
    }
  };

  // Convert filters to match component expectations
  const overviewFilters = {
    search: filters.searchTerm,
    type: filters.typeFilter,
    category: filters.categoryFilter,
    status: filters.statusFilter,
  };

  const handleOverviewFiltersChange = (newFilters: any) => {
    setFilters({
      ...filters,
      searchTerm: newFilters.search || "",
      typeFilter: newFilters.type || "all",
      categoryFilter: newFilters.category || "all",
      statusFilter: newFilters.status || "all",
    });
  };

  // Render views
  if (currentView === "overview") {
    return (
      <>
        <input
          ref={uploadInputRef}
          type="file"
          accept=".csv,.json,application/json,text/csv"
          className="hidden"
          onChange={handleBulkFile}
        />
        <FinanceOverview
          records={financeData}
          filteredRecords={locallyFiltered}
          kpi={kpi}
          filters={overviewFilters}
          onFiltersChange={handleOverviewFiltersChange}
          availableCategories={availableCategories}
          onEdit={startEdit}
          onDelete={confirmDelete}
          onCreateNew={startCreate}
          onViewFullTable={() => setCurrentView("records")}
          onBulkUploadClick={onBulkUploadClick}
          isFetching={isFetching}
          isDeleting={removing}
        />
      </>
    );
  }

  if (currentView === "form") {
    return (
      <>
        <input
          ref={uploadInputRef}
          type="file"
          accept=".csv,.json,application/json,text/csv"
          className="hidden"
          onChange={handleBulkFile}
        />
        <FinanceForm
          mode={formMode}
          formData={formData}
          onFormDataChange={setFormData}
          isLoading={creating || updating}
          onSubmit={handleSubmit}
          onCancel={() => setCurrentView("overview")}
          onBulkUploadClick={onBulkUploadClick}
        />
      </>
    );
  }

  if (currentView === "records") {
    const recordsFilters = {
      searchTerm: filters.searchTerm,
      typeFilter: filters.typeFilter,
      categoryFilter: filters.categoryFilter,
      statusFilter: filters.statusFilter,
      paymentMethodFilter: filters.paymentMethodFilter,
    };

    return (
      <>
        <input
          ref={uploadInputRef}
          type="file"
          accept=".csv,.json,application/json,text/csv"
          className="hidden"
          onChange={handleBulkFile}
        />
        <FinanceList
          records={financeData}
          filteredRecords={locallyFiltered}
          filters={recordsFilters}
          onFiltersChange={setFilters}
          availableCategories={availableCategories}
          onEdit={startEdit}
          onDelete={confirmDelete}
          onCreateNew={startCreate}
          onBulkUploadClick={onBulkUploadClick}
          isFetching={isFetching}
          isDeleting={removing}
        />
      </>
    );
  }

  return null;
}

