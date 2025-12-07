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
  TrendingDown,
  Receipt,
  UploadCloud,
  ArrowLeft,
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
  const breadcrumbItems = [
    { label: "Home", onClick: () => {} },
    { label: "Finance", onClick: () => {} },
  ];

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
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tax Year</TableHead>
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
                    filteredRecords
                      .slice()
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1.5 rounded-md ${
                                  r.type === "invested"
                                    ? "bg-green-100 dark:bg-green-900/20"
                                    : r.type === "expense"
                                    ? "bg-red-100 dark:bg-red-900/20"
                                    : "bg-orange-100 dark:bg-orange-900/20"
                                }`}
                              >
                                {r.type === "invested" ? (
                                  <Wallet className="w-3 h-3 text-green-600" />
                                ) : r.type === "expense" ? (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                ) : (
                                  <Receipt className="w-3 h-3 text-orange-600" />
                                )}
                              </div>
                              <Badge className={getTypeColor(r.type)}>
                                {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{r.category}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={r.description}>
                              {r.description}
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
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {r.paymentMethod}
                            </Badge>
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
                          <TableCell className="text-sm">
                            {(r as any).taxYear || "-"}
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
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

