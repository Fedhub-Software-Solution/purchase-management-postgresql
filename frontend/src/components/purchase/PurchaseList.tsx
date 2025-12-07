import { motion, AnimatePresence } from "motion/react";
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
  Edit,
  Trash2,
  ShoppingCart,
  Package,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import { formatDate } from "../../utils/datetime";
import type { Purchase, Client } from "../../types";
import { getStatusColor, getStatusIcon } from "./utils";
import { PurchaseFilters } from "./PurchaseFilters";
import type { PurchaseFilters as PurchaseFiltersType } from "./types";

interface PurchaseListProps {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  clients: Client[];
  clientMap: Map<string, Client>;
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
  clients,
  clientMap,
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
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.client !== "all";
    const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
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
        clients={clients}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium">Purchase Details</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive purchase order overview
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-white/70 dark:bg-gray-800/70">
            {filteredPurchases.length} of {purchases.length} Purchases
          </Badge>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              Filtered
            </Badge>
          )}
        </div>
      </motion.div>

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
                <TableHeader>
                  <TableRow>
                    <TableHead>PO#</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredPurchases.map((purchase, index) => {
                      const client = clientMap.get(purchase.clientId);
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
                              <div className="font-medium">{client?.company}</div>
                              <div className="text-sm text-muted-foreground">
                                {client?.contactPerson}
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

