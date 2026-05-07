import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Breadcrumb } from "../Breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Plus,
  Eye,
  Download,
  Edit,
  Trash2,
  ShoppingCart,
  Package,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import { formatDate } from "../../utils/datetime";
import type { Purchase, Supplier } from "../../types";
import {
  downloadPurchasePDF,
  getStatusColor,
  getStatusIcon,
} from "./utils";
import { PurchaseFilters } from "./PurchaseFilters";
import type { PurchaseFilters as PurchaseFiltersType } from "./types";
import { useGetSettingsQuery } from "../../lib/api/slices/settings";

interface PurchaseListProps {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  suppliers: Supplier[];
  supplierMap: Map<string, Supplier>;
  filters: PurchaseFiltersType;
  onFiltersChange: (filters: PurchaseFiltersType) => void;
  onView: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchaseId: string) => void;
  onCreateNew: () => void;
  isFetching: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
}

export function PurchaseList({
  purchases,
  filteredPurchases,
  suppliers,
  supplierMap,
  filters,
  onFiltersChange,
  onView,
  onEdit,
  onDelete,
  onCreateNew,
  isFetching,
  isDeleting,
  isUpdating,
}: PurchaseListProps) {
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const { data: settings } = useGetSettingsQuery();
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.supplier !== "all";
  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPurchases = useMemo(
    () => filteredPurchases.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredPurchases, safePage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPurchases.length]);

  const toggleColumnSort = (
    sortBy: "poNumber" | "createdAt" | "total" | "supplier" | "status"
  ) => {
    const nextOrder =
      filters.sortBy === sortBy && filters.sortOrder === "asc" ? "desc" : "asc";
    onFiltersChange({ ...filters, sortBy, sortOrder: nextOrder });
  };

  const getSortIcon = (
    sortBy: "poNumber" | "createdAt" | "total" | "supplier" | "status"
  ) => {
    if (filters.sortBy !== sortBy) return <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />;
    return filters.sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5" />
    );
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      
      <div className="flex justify-between items-center">
        <div>
        <Breadcrumb items={breadcrumbItems} currentPage="Purchase Management" />
          {/* <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Purchase Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your purchase orders and track their status
          </p> */}
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isFetching}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase
          </Button>
        </motion.div>
      </div>

      <PurchaseFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        suppliers={suppliers}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Purchase Orders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {purchases.length === 0
                  ? isFetching
                    ? "Loading purchases…"
                    : "No purchases yet"
                  : "No purchases match your filters"}
              </h3>
              <p className="text-gray-500 mb-4">
                {purchases.length === 0
                  ? "Get started by creating your first purchase."
                  : "Try adjusting your search or filter criteria"}
              </p>
              {purchases.length === 0 && !isFetching && (
                <Button onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Purchase
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-900/85 [&_tr]:border-zinc-700">
                  <TableRow className="hover:bg-zinc-900/85">
                    <TableHead className="bg-zinc-900/85 text-zinc-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1 text-zinc-100 hover:bg-zinc-700/50 hover:text-zinc-100"
                        onClick={() => toggleColumnSort("poNumber")}
                      >
                        PO#
                        {getSortIcon("poNumber")}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-zinc-900/85 text-zinc-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1 text-zinc-100 hover:bg-zinc-700/50 hover:text-zinc-100"
                        onClick={() => toggleColumnSort("supplier")}
                      >
                        Supplier
                        {getSortIcon("supplier")}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-zinc-900/85 text-zinc-100">Items</TableHead>
                    <TableHead className="bg-zinc-900/85 text-right text-zinc-100">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1 text-zinc-100 hover:bg-zinc-700/50 hover:text-zinc-100"
                          onClick={() => toggleColumnSort("total")}
                        >
                          Total
                          {getSortIcon("total")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="bg-zinc-900/85 text-zinc-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1 text-zinc-100 hover:bg-zinc-700/50 hover:text-zinc-100"
                        onClick={() => toggleColumnSort("status")}
                      >
                        Status
                        {getSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-zinc-900/85 text-zinc-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1 text-zinc-100 hover:bg-zinc-700/50 hover:text-zinc-100"
                        onClick={() => toggleColumnSort("createdAt")}
                      >
                        Date
                        {getSortIcon("createdAt")}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-zinc-900/85 text-center text-zinc-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {paginatedPurchases.map((purchase, index) => {
                      const supplier =
                        supplierMap.get(purchase.supplierId || "") ||
                        suppliers.find(
                          (s) =>
                            String(s.name || "").trim().toLowerCase() ===
                            String(purchase.items?.[0]?.supplier || "").trim().toLowerCase()
                        );
                      const supplierName = supplier?.name || purchase.items?.[0]?.supplier || "-";
                      const supplierContact =
                        supplier?.contactPerson || (supplier ? "" : purchase.items?.[0]?.supplier || "");
                      return (
                        <motion.tr
                          key={purchase.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {purchase.poNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium">{supplierName}</div>
                              <div className="text-sm text-muted-foreground">
                                {supplierContact}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {purchase.items.length}{" "}
                              {purchase.items.length === 1 ? "item" : "items"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(
                              purchase.total,
                              purchase.baseCurrency || DEFAULT_CURRENCY
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(purchase.status)}>
                              {getStatusIcon(purchase.status)}
                              <span className="ml-1 capitalize">
                                {purchase.status}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(purchase?.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onView(purchase)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        downloadPurchasePDF(
                                          purchase,
                                          supplier ||
                                            ({
                                              id: "",
                                              name: purchase.items?.[0]?.supplier || "N/A",
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
                                              notes: "",
                                              createdAt: new Date(),
                                            } as Supplier),
                                          settings
                                        )
                                      }
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download PDF</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEdit(purchase)}
                                      disabled={isUpdating}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Purchase</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDelete(purchase.id)}
                                      className="hover:text-red-600"
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Purchase</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
          {filteredPurchases.length > PAGE_SIZE && (
            <div className="mt-4 grid grid-cols-3 items-center">
              <p className="text-sm text-muted-foreground justify-self-start">
                Showing {(safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, filteredPurchases.length)} of{" "}
                {filteredPurchases.length} purchases
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
      </Card>
    </motion.div>
  );
}

