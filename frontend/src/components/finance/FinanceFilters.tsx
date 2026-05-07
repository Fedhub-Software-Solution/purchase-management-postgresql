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
import { Search, X } from "lucide-react";
import type { FinanceFilters as FinanceFiltersType } from "./types";

interface FinanceFiltersProps {
  filters: FinanceFiltersType;
  onFiltersChange: (filters: FinanceFiltersType) => void;
  availableCategories: string[];
}

export function FinanceFilters({
  filters,
  onFiltersChange,
  availableCategories,
}: FinanceFiltersProps) {
  const hasActiveFilters =
    filters.searchTerm ||
    filters.typeFilter !== "all" ||
    filters.categoryFilter !== "all" ||
    filters.statusFilter !== "all";

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      search: "",
      type: "all",
      category: "all",
      status: "all",
    });
  };

  return (
    <div className="space-y-3">
      <Card className="border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5 lg:col-span-1">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search records..."
                value={filters.searchTerm}
                onChange={(e) =>
                  onFiltersChange({ ...filters, searchTerm: e.target.value })
                }
                className="pl-10 h-9 bg-background border-slate-300 dark:border-slate-700"
              />
              {filters.searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, searchTerm: "" })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Type</Label>
            <Select
              value={filters.typeFilter}
              onValueChange={(v: any) =>
                onFiltersChange({ ...filters, typeFilter: v, categoryFilter: "all" })
              }
            >
              <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invested">Invested</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="tds">TDS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Category</Label>
            <Select
              value={filters.categoryFilter}
              onValueChange={(v: any) =>
                onFiltersChange({ ...filters, categoryFilter: v })
              }
            >
              <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</Label>
            <Select
              value={filters.statusFilter}
              onValueChange={(v: any) =>
                onFiltersChange({ ...filters, statusFilter: v })
              }
            >
              <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </Card>
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full md:w-auto">
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

