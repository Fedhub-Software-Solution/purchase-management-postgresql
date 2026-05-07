import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
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
  TrendingDown,
  Receipt,
  UploadCloud,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { Breadcrumb } from "../Breadcrumb";
import { fmtINR, getStatusColor, getTypeColor } from "./utils";
import { FinanceFilters } from "./FinanceFilters";
import type { FinanceFilters as FinanceFiltersType } from "./types";

interface FinanceListProps {
  records: any[];
  filteredRecords: any[];
  filters: FinanceFiltersType;
  onFiltersChange: (filters: FinanceFiltersType) => void;
  availableCategories: string[];
  onEdit: (record: any) => void;
  onDelete: (recordId: string) => void;
  onCreateNew: () => void;
  onBulkUploadClick?: () => void;
  isFetching: boolean;
  isDeleting: boolean;
}

export function FinanceList({
  records,
  filteredRecords,
  filters,
  onFiltersChange,
  availableCategories,
  onEdit,
  onDelete,
  onCreateNew,
  onBulkUploadClick,
  isFetching,
  isDeleting,
}: FinanceListProps) {
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "category" | "description" | "spentBy" | "amount" | "reimbursed" | "pending" | "date" | "status"
  >("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const spentByLabel = (r: any) =>
    String(
      (r as any).amountSpentBy ??
        (r as any).amountSpentByName ??
        (r as any).amount_spent_by ??
        (r as any).amount_spent_by_name ??
        ""
    ).trim() || "—";

  const breadcrumbItems = [
    { label: "Home", onClick: () => {} },
    { label: "Finance", onClick: () => {} },
  ];

  const sortedRecords = useMemo(() => {
    const getValue = (r: any) => {
      switch (sortBy) {
        case "category":
          return String(r.category || "").toLowerCase();
        case "description":
          return String(r.description || "").toLowerCase();
        case "spentBy":
          return String(spentByLabel(r) || "").toLowerCase();
        case "status":
          return String(r.status || "").toLowerCase();
        case "amount":
          return Number(r.amount || 0);
        case "reimbursed":
          return Number((r as any).reimbursedAmount || 0);
        case "pending":
          return Number(
            (r as any).pendingAmount ??
              r.amount - ((r as any).reimbursedAmount != null ? Number((r as any).reimbursedAmount) : 0)
          );
        case "date":
        default:
          return r.date instanceof Date ? r.date.getTime() : new Date(r.date).getTime();
      }
    };
    return filteredRecords.slice().sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortBy, sortOrder]);

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
    column: "category" | "description" | "spentBy" | "amount" | "reimbursed" | "pending" | "date" | "status"
  ) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder(
      column === "category" || column === "description" || column === "spentBy" || column === "status"
        ? "asc"
        : "desc"
    );
  };
  const sortIcon = (
    column: "category" | "description" | "spentBy" | "amount" | "reimbursed" | "pending" | "date" | "status"
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
      <Breadcrumb items={breadcrumbItems} currentPage="Finance Records" />

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Finance Records
          </h1>
          <p className="text-muted-foreground">
            Detailed view of all financial transactions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => {}}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
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

      <FinanceFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        availableCategories={availableCategories}
      />

      <GlassCard>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-muted/50 mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No records found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get started by adding your first finance record.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-white/5">
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("category")}>
                        Category
                        {sortIcon("category")}
                      </Button>
                    </TableHead>
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
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("amount")}>
                        Amount Spent
                        {sortIcon("amount")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("reimbursed")}>
                          Reimbursed
                          {sortIcon("reimbursed")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("pending")}>
                          Pending
                          {sortIcon("pending")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("date")}>
                        Date
                        {sortIcon("date")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("status")}>
                        Status
                        {sortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No records found matching the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{r.category}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={r.description}>
                              {r.description}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[120px]">
                            <div className="truncate" title={spentByLabel(r) === "—" ? "" : spentByLabel(r)}>
                              {spentByLabel(r)}
                            </div>
                          </TableCell>
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
                          <TableCell className="text-right text-sm">
                            {(r as any).reimbursedAmount != null
                              ? fmtINR(Number((r as any).reimbursedAmount))
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {fmtINR(
                              (r as any).pendingAmount ??
                                r.amount -
                                  ((r as any).reimbursedAmount != null
                                    ? Number((r as any).reimbursedAmount)
                                    : 0)
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.date.toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onEdit(r)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isDeleting}
                                onClick={() => onDelete(r.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredRecords.length > PAGE_SIZE && (
            <div className="px-4 py-3 border-t grid grid-cols-3 items-center">
              <p className="text-sm text-muted-foreground justify-self-start">
                Showing {(safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length} records
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
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

