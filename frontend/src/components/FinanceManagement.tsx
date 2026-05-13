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
import { FinanceReimbursedTable } from "./finance/FinanceReimbursedTable";
import { FinanceBulkUploadDialog } from "./finance/FinanceBulkUploadDialog";
import { categoryOptions, toDate, yyyyMmDd, normalizeFinanceStatus, normalizeFinanceType, collectBulkImportRowIssues } from "./finance/utils";
import type { FinanceFilters, FinanceFormData, FinanceBulkImportPreviewRow } from "./finance/types";

export function FinanceManagement() {
  const [currentView, setCurrentView] = useState<
    "overview" | "form" | "records" | "reimbursed"
  >("overview");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkPreviewRows, setBulkPreviewRows] = useState<FinanceBulkImportPreviewRow[]>([]);
  const [bulkValidationErrors, setBulkValidationErrors] = useState<string[]>([]);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

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
    amountSpentBy: "",
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
        (r.reference || "").toLowerCase().includes(s) ||
        String((r as any).amountSpentBy || "")
          .toLowerCase()
          .includes(s);

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
      amountSpentBy: "",
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
      amountSpentBy: r.amountSpentBy ?? "",
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
      // Send date-only value to avoid timezone offsets during save/read.
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      amountSpentBy: formData.amountSpentBy?.trim() || undefined,
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

  const updateReimbursedInline = async (
    record: ApiFinanceRecord,
    reimbursedAmount: number,
    context?: { groupReimbursed: number }
  ) => {
    try {
      const currentRecordReimbursed = Number((record as any).reimbursedAmount || 0);
      const groupedCurrent = Number(context?.groupReimbursed || currentRecordReimbursed);
      const delta = reimbursedAmount - groupedCurrent;
      const nextRecordReimbursed = Math.max(0, currentRecordReimbursed + delta);
      await updateFinance({
        id: record.id,
        data: { reimbursedAmount: nextRecordReimbursed },
      }).unwrap();
      toast.success("Reimbursed amount updated");
      await Promise.all([refetchList(), refetchStats()]);
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || "Failed to update reimbursed amount");
    }
  };

  // Bulk Upload
  const onBulkUploadClick = () => {
    setIsBulkUploadOpen(true);
    setBulkFileName("");
    setBulkPreviewRows([]);
    setBulkValidationErrors([]);
  };
  const chooseBulkFile = () => uploadInputRef.current?.click();
  const downloadBulkTemplate = () => {
    const template = [
      "category,amount,description,date,paymentMethod,status,amountSpentBy",
      "Supplies,100000,Board Room - INEL advance for Supplier,2026-05-05,Bank Transfer,pending,Aravind",
      "Infrastructure,250000,Server rack setup,2026-05-01,Bank Transfer,completed,Operations Team",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-import-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const normalizeDateForImport = (raw: any): string => {
      const value = String(raw || "").trim();
      if (!value) return yyyyMmDd(new Date());

      // Already normalized yyyy-mm-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

      // dd/mm/yyyy or dd-mm-yyyy
      const dmy = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmy) {
        const dd = dmy[1].padStart(2, "0");
        const mm = dmy[2].padStart(2, "0");
        const yyyy = dmy[3];
        return `${yyyy}-${mm}-${dd}`;
      }

      // Fallback: native parsing
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? yyyyMmDd(new Date()) : yyyyMmDd(parsed);
    };

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const normalizeHeader = (v: string) =>
      String(v || "")
        .replace(/^\uFEFF/, "") // strip UTF-8 BOM if present
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const header = lines[0].split(",").map((h) => h.trim());
    const headerIndex = new Map<string, number>();
    header.forEach((h, i) => headerIndex.set(normalizeHeader(h), i));
    const idx = (...keys: string[]) => {
      for (const key of keys) {
        const i = headerIndex.get(normalizeHeader(key));
        if (i !== undefined) return i;
      }
      return -1;
    };
    const col = (cols: string[], ...keys: string[]) => {
      const i = idx(...keys);
      return i >= 0 ? cols[i] : "";
    };

    const rows = lines.slice(1).map((line) => line.split(","));
    return rows.map((cols) => {
      return {
        type: normalizeFinanceType(col(cols, "type") || "expense"),
        category: col(cols, "category").trim(),
        amount: Number((col(cols, "amount") || "0").trim()),
        description: col(cols, "description").trim(),
        date: normalizeDateForImport(col(cols, "date")),
        paymentMethod: col(cols, "paymentMethod", "payment_method", "payment method").trim(),
        status: (col(cols, "status") || "completed").trim(),
        amountSpentBy:
          col(
            cols,
            "amountSpentBy",
            "amount_spent_by",
            "amount spent by",
            "amount spent by name",
            "spent by",
            "spent by name"
          ).trim() || undefined,
      };
    });
  };

  const handleBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBulkFileName(file.name);

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

      const validationErrors: string[] = [];
      const previewRows: FinanceBulkImportPreviewRow[] = records.map((r, i) => {
        const issues = collectBulkImportRowIssues(r);
        const rowNumber = i + 2;
        if (issues.length > 0) {
          validationErrors.push(`Row ${rowNumber}: ${issues.join("; ")}`);
        }

        const normalizedDate =
          (() => {
            const v = String(r.date || "").trim();
            if (!v) return yyyyMmDd(new Date());
            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
            const dmy = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? yyyyMmDd(new Date()) : yyyyMmDd(d);
          })();

        return {
          category: r.category || "",
          amount: Number(r.amount || 0),
          description: r.description || `Imported record #${i + 1}`,
          date: normalizedDate,
          paymentMethod: r.paymentMethod || "Bank Transfer",
          status: normalizeFinanceStatus(r.status || "completed"),
          amountSpentBy:
            r.amountSpentBy ??
            r.amountSpentByName ??
            r.amount_spent_by ??
            r.amount_spent_by_name ??
            undefined,
          remarks: issues.length > 0 ? issues.join("; ") : "—",
        };
      });

      setBulkPreviewRows(previewRows);
      setBulkValidationErrors(validationErrors);
      if (validationErrors.length > 0) {
        toast.error("Validation failed. Please fix the file and re-upload.");
      } else {
        toast.success(`Validation passed. ${previewRows.length} record(s) ready to import.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Bulk upload failed");
    }
  };

  const submitBulkImport = async () => {
    if (bulkPreviewRows.length === 0) {
      toast.error("Please choose a file first.");
      return;
    }
    if (bulkValidationErrors.length > 0) {
      toast.error("Please fix validation errors before submitting import.");
      return;
    }

    setIsBulkSubmitting(true);
    try {
      toast.message("Bulk upload started", {
        description: `Uploading ${bulkPreviewRows.length} records…`,
      });

      let ok = 0;
      let fail = 0;
      let firstError: string | null = null;
      /* eslint-disable no-await-in-loop */
      for (const rec of bulkPreviewRows) {
        try {
          const { remarks: _remarks, ...payload } = rec;
          await createFinance({
            type: "expense",
            ...payload,
          }).unwrap();
          ok++;
        } catch (err: any) {
          fail++;
          if (!firstError) {
            firstError =
              err?.data?.error ||
              err?.data?.message ||
              err?.error ||
              err?.message ||
              "Request failed";
          }
        }
      }
      /* eslint-enable no-await-in-loop */

      await Promise.all([refetchList(), refetchStats()]);

      if (fail === 0) {
        toast.success(`Bulk upload complete (${ok} records)`);
      } else {
        toast.warning(
          `Bulk upload finished: ${ok} succeeded, ${fail} failed${firstError ? ` — ${firstError}` : ""}`
        );
      }

      setIsBulkUploadOpen(false);
      setBulkFileName("");
      setBulkPreviewRows([]);
      setBulkValidationErrors([]);
    } catch (err: any) {
      toast.error(err?.message || "Bulk upload failed");
    } finally {
      setIsBulkSubmitting(false);
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
          onViewReimbursed={() => setCurrentView("reimbursed")}
          onBulkUploadClick={onBulkUploadClick}
          isFetching={isFetching}
          isDeleting={removing}
        />
        <FinanceBulkUploadDialog
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          onDownloadTemplate={downloadBulkTemplate}
          onChooseFile={chooseBulkFile}
          selectedFileName={bulkFileName}
          previewRows={bulkPreviewRows}
          validationErrors={bulkValidationErrors}
          onSubmitImport={submitBulkImport}
          isSubmitting={isBulkSubmitting}
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
        <FinanceBulkUploadDialog
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          onDownloadTemplate={downloadBulkTemplate}
          onChooseFile={chooseBulkFile}
          selectedFileName={bulkFileName}
          previewRows={bulkPreviewRows}
          validationErrors={bulkValidationErrors}
          onSubmitImport={submitBulkImport}
          isSubmitting={isBulkSubmitting}
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
        <FinanceBulkUploadDialog
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          onDownloadTemplate={downloadBulkTemplate}
          onChooseFile={chooseBulkFile}
          selectedFileName={bulkFileName}
          previewRows={bulkPreviewRows}
          validationErrors={bulkValidationErrors}
          onSubmitImport={submitBulkImport}
          isSubmitting={isBulkSubmitting}
        />
      </>
    );
  }

  if (currentView === "reimbursed") {
    return (
      <>
        <input
          ref={uploadInputRef}
          type="file"
          accept=".csv,.json,application/json,text/csv"
          className="hidden"
          onChange={handleBulkFile}
        />
        <FinanceReimbursedTable
          records={financeData}
          onBack={() => setCurrentView("overview")}
          onUpdateReimbursed={updateReimbursedInline}
          isUpdating={updating}
        />
        <FinanceBulkUploadDialog
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          onDownloadTemplate={downloadBulkTemplate}
          onChooseFile={chooseBulkFile}
          selectedFileName={bulkFileName}
          previewRows={bulkPreviewRows}
          validationErrors={bulkValidationErrors}
          onSubmitImport={submitBulkImport}
          isSubmitting={isBulkSubmitting}
        />
      </>
    );
  }

  return null;
}

