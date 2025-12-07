import { GlassCard } from "../GlassCard";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
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
import { Filter, Search, X } from "lucide-react";
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
    filters.search ||
    filters.type !== "all" ||
    filters.category !== "all" ||
    filters.status !== "all";

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
    <GlassCard>
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <span className="text-sm">Search & Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search records..."
                value={filters.searchTerm}
                onChange={(e) =>
                  onFiltersChange({ ...filters, searchTerm: e.target.value })
                }
                className="pl-10 bg-white/70 dark:bg-gray-800/70"
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <Select
              value={filters.typeFilter}
              onValueChange={(v: any) =>
                onFiltersChange({ ...filters, typeFilter: v, categoryFilter: "all" })
              }
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select
              value={filters.categoryFilter}
              onValueChange={(v: any) =>
                onFiltersChange({ ...filters, categoryFilter: v })
              }
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={filters.statusFilter}
              onValueChange={(v: any) =>
                onFiltersChange({ ...filters, statusFilter: v })
              }
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
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

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {/* Results count will be shown by parent */}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </GlassCard>
  );
}

