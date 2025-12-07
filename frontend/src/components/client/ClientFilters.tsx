import { motion } from "motion/react";
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
import { Filter, Search, SortAsc, SortDesc, X } from "lucide-react";
import type { ClientFilters as ClientFiltersType } from "./types";

interface ClientFiltersProps {
  filters: ClientFiltersType;
  onFiltersChange: (filters: ClientFiltersType) => void;
  uniqueStates: string[];
}

export function ClientFilters({
  filters,
  onFiltersChange,
  uniqueStates,
}: ClientFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.state !== "all" || filters.status !== "all";

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      search: "",
      state: "all",
      status: "all",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-blue-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20">
          <Filter className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="font-medium">Search & Filter Clients</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="search"
              placeholder="Search by company, contact, email..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-10 bg-white/70 dark:bg-gray-800/70"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Filter by State</Label>
          <Select
            value={filters.state}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, state: value })
            }
          >
            <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Filter by Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value })
            }
          >
            <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Active</span>
                </div>
              </SelectItem>
              <SelectItem value="inactive">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <span>Inactive</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort by</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value: "company" | "createdAt" | "city") =>
              onFiltersChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Company Name</SelectItem>
              <SelectItem value="createdAt">Date Added</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Order</Label>
          <Button
            variant="outline"
            onClick={() =>
              onFiltersChange({
                ...filters,
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            className="w-full justify-start bg-white/70 dark:bg-gray-800/70"
          >
            {filters.sortOrder === "asc" ? (
              <SortAsc className="w-4 h-4 mr-2" />
            ) : (
              <SortDesc className="w-4 h-4 mr-2" />
            )}
            {filters.sortOrder === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
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

