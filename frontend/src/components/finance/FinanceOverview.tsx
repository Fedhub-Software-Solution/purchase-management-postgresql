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
} from "lucide-react";
import { Breadcrumb } from "../Breadcrumb";
import { FinanceKPIs } from "./FinanceKPIs";
import { FinanceFilters } from "./FinanceFilters";
import { fmtINR, getStatusColor, getTypeColor } from "./utils";

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
  onViewFullTable: () => void;
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
  onViewFullTable,
  onBulkUploadClick,
  isFetching,
  isDeleting,
}: FinanceOverviewProps) {
  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
  const noData = records.length === 0;

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
            {!noData && (
              <Button variant="outline" onClick={onViewFullTable}>
                View Full Table
              </Button>
            )}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords
                    .slice()
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .slice(0, 10)
                    .map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-2 rounded-lg ${
                                r.type === "invested"
                                  ? "bg-green-100 dark:bg-green-900/20"
                                  : r.type === "expense"
                                  ? "bg-red-100 dark:bg-red-900/20"
                                  : "bg-orange-100 dark:bg-orange-900/20"
                              }`}
                            >
                              {r.type === "invested" ? (
                                <Wallet className="w-4 h-4 text-green-600" />
                              ) : r.type === "expense" ? (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              ) : (
                                <Receipt className="w-4 h-4 text-orange-600" />
                              )}
                            </div>
                            <span className="capitalize font-medium">{r.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{r.description}</TableCell>
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
          )}
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

