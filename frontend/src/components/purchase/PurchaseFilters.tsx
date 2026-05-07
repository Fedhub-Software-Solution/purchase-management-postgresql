import { motion } from "motion/react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, X, CheckCircle, Clock, XCircle } from "lucide-react";
import type { PurchaseFilters as PurchaseFiltersType } from "./types";
import type { Supplier } from "../../types";

interface PurchaseFiltersProps {
  filters: PurchaseFiltersType;
  onFiltersChange: (filters: PurchaseFiltersType) => void;
  suppliers: Supplier[];
}

export function PurchaseFilters({
  filters,
  onFiltersChange,
  suppliers,
}: PurchaseFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.supplier !== "all";

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      search: "",
      status: "all",
      supplier: "all",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <Card className="border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="search" className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search"
                placeholder="Search by PO#, supplier, notes..."
                value={filters.search}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value })
                }
                className="pl-10 h-9 bg-background border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, status: value })
              }
            >
              <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span>Pending</span>
                  </div>
                </SelectItem>
                <SelectItem value="approved">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>Approved</span>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Completed</span>
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Rejected</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Supplier</Label>
            <Select
              value={filters.supplier}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, supplier: value })
              }
            >
              <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}
    </motion.div>
  );
}

