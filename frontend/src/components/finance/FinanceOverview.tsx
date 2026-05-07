import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "../GlassCard";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Wallet,
  BadgeIndianRupee,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { Breadcrumb } from "../Breadcrumb";
import { FinanceKPIs } from "./FinanceKPIs";
import { FinanceFilters } from "./FinanceFilters";
import { fmtINR, getStatusColor } from "./utils";

interface FinanceOverviewProps {
  records: any[];
  filteredRecords: any[];
  kpi: {
    totalInvested?: number;
    totalExpenses?: number;
    totalTDS?: number;
    profit?: number;
  };
  filters: FinanceFiltersType;
  onFiltersChange: (filters: FinanceFiltersType) => void;
  availableCategories: string[];
  onEdit: (record: any) => void;
  onDelete: (recordId: string) => void;
  onCreateNew: () => void;
  onViewReimbursed?: () => void;
  onBulkUploadClick?: () => void;
  isFetching: boolean;
  isDeleting: boolean;
}

export function FinanceOverview({
  records,
  filteredRecords,
  kpi,
  filters,
  onFiltersChange,
  availableCategories,
  onEdit,
  onDelete,
  onCreateNew,
  onViewReimbursed,
  onBulkUploadClick,
  isFetching,
  isDeleting,
}: FinanceOverviewProps) {
  const spentByLabel = (r: any) =>
    String(
      (r as any).amountSpentBy ??
        (r as any).amountSpentByName ??
        (r as any).amount_spent_by ??
        (r as any).amount_spent_by_name ??
        ""
    ).trim() || "—";

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "description" | "spentBy" | "category" | "amount" | "date" | "paymentMethod" | "status"
  >("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
  const noData = records.length === 0;
  const sortedRecords = useMemo(
    () =>
      filteredRecords.slice().sort((a, b) => {
        const getValue = (r: any) => {
          switch (sortBy) {
            case "description":
              return String(r.description || "").toLowerCase();
            case "spentBy":
              return String(spentByLabel(r) || "").toLowerCase();
            case "category":
              return String(r.category || "").toLowerCase();
            case "amount":
              return Number(r.amount || 0);
            case "paymentMethod":
              return String(r.paymentMethod || "").toLowerCase();
            case "status":
              return String(r.status || "").toLowerCase();
            case "date":
            default:
              return r.date instanceof Date ? r.date.getTime() : new Date(r.date).getTime();
          }
        };
        const aVal = getValue(a);
        const bVal = getValue(b);
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }),
    [filteredRecords, sortBy, sortOrder]
  );
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(
    () => sortedRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedRecords, safePage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRecords.length, sortBy, sortOrder]);

  const toggleSort = (
    column: "description" | "spentBy" | "category" | "amount" | "date" | "paymentMethod" | "status"
  ) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder(
      column === "description" ||
        column === "spentBy" ||
        column === "category" ||
        column === "paymentMethod" ||
        column === "status"
        ? "asc"
        : "desc"
    );
  };

  const sortIcon = (
    column: "description" | "spentBy" | "category" | "amount" | "date" | "paymentMethod" | "status"
  ) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
     

      <div className="flex items-center justify-between">
        <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} currentPage="Finance" />
          {/* <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Finance
          </h1> */}
        </div>
        <div className="flex items-center gap-3">
          {onViewReimbursed && (
            <Button
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={onViewReimbursed}
            >
              <BadgeIndianRupee className="w-4 h-4 mr-2" />
              Reimbursed
            </Button>
          )}
          {onBulkUploadClick && (
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onBulkUploadClick}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
          )}
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        </div>
      </div>

      <FinanceKPIs kpi={kpi} />

      <FinanceFilters
        filters={{
          searchTerm: filters.search || "",
          typeFilter: (filters.type as any) || "all",
          categoryFilter: filters.category || "all",
          statusFilter: (filters.status as any) || "all",
          paymentMethodFilter: "all",
        }}
        onFiltersChange={(newFilters) =>
          onFiltersChange({
            search: newFilters.searchTerm,
            type: newFilters.typeFilter,
            category: newFilters.categoryFilter,
            status: newFilters.statusFilter,
          })
        }
        availableCategories={availableCategories}
      />

      <GlassCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Finance Records
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {noData ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-muted/50 mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No finance records yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first record or use bulk upload.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("description")}>
                          Description
                          {sortIcon("description")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("spentBy")}>
                          Amount spent by
                          {sortIcon("spentBy")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("category")}>
                          Category
                          {sortIcon("category")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("amount")}>
                          Amount
                          {sortIcon("amount")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("date")}>
                          Date
                          {sortIcon("date")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("paymentMethod")}>
                          Payment Method
                          {sortIcon("paymentMethod")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("status")}>
                          Status
                          {sortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{r.description}</TableCell>
                        <TableCell className="text-sm max-w-[120px]">
                          <div className="truncate" title={spentByLabel(r) === "—" ? "" : spentByLabel(r)}>
                            {spentByLabel(r)}
                          </div>
                        </TableCell>
                        <TableCell>{r.category}</TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              r.type === "invested"
                                ? "text-green-600"
                                : r.type === "expense"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {r.type === "invested" ? "+" : "-"}
                            {fmtINR(r.amount)}
                          </span>
                        </TableCell>
                        <TableCell>{r.date.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {r.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(r)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isDeleting}
                              onClick={() => onDelete(r.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {sortedRecords.length > PAGE_SIZE && (
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1">
                  <p className="text-sm text-muted-foreground justify-self-start whitespace-nowrap">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}-
                    {Math.min(safePage * PAGE_SIZE, sortedRecords.length)} of{" "}
                    {sortedRecords.length} records
                  </p>
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
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
          )}
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

