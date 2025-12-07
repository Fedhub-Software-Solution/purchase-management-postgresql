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
import { Filter, Search, SortAsc, SortDesc, X, CheckCircle, Clock, XCircle } from "lucide-react";
import type { PurchaseFilters as PurchaseFiltersType, Client } from "./types";

interface PurchaseFiltersProps {
  filters: PurchaseFiltersType;
  onFiltersChange: (filters: PurchaseFiltersType) => void;
  clients: Client[];
}

export function PurchaseFilters({
  filters,
  onFiltersChange,
  clients,
}: PurchaseFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.client !== "all";

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      search: "",
      status: "all",
      client: "all",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gray-50/50 to-purple-50/50 dark:from-gray-900/50 dark:to-purple-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-purple-500/20">
          <Filter className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="font-medium">Search & Filter Purchases</h3>
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
              placeholder="Search by PO#, client, notes..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-10 bg-white/70 dark:bg-gray-800/70"
            />
          </div>
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

        <div className="space-y-2">
          <Label className="text-sm font-medium">Filter by Client</Label>
          <Select
            value={filters.client}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, client: value })
            }
          >
            <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort by</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value: "poNumber" | "createdAt" | "total") =>
              onFiltersChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="poNumber">PO Number</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="total">Total Amount</SelectItem>
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

