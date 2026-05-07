import { Card, CardContent } from "../ui/card";
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
import type { InvoiceFilters as InvoiceFiltersType, Client } from "./types";

interface InvoiceFiltersProps {
  filters: InvoiceFiltersType;
  onFiltersChange: (filters: InvoiceFiltersType) => void;
  clients: Client[];
}

export function InvoiceFilters({
  filters,
  onFiltersChange,
  clients,
}: InvoiceFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.client !== "all" || filters.dateRange !== "all";

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      search: "",
      status: "all",
      client: "all",
      dateRange: "all",
    });
  };

  return (
    <div className="space-y-3">
      <Card className="border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by invoice # or client..."
                  value={filters.search}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, search: e.target.value })
                  }
                  className="pl-10 h-9 bg-background border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value: string) =>
                  onFiltersChange({ ...filters, status: value })
                }
              >
                <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client" className="text-xs font-medium text-slate-600 dark:text-slate-300">Client</Label>
              <Select
                value={filters.client}
                onValueChange={(value: string) =>
                  onFiltersChange({ ...filters, client: value })
                }
              >
                <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label htmlFor="dateRange" className="text-xs font-medium text-slate-600 dark:text-slate-300">Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value: string) =>
                  onFiltersChange({ ...filters, dateRange: value })
                }
              >
                <SelectTrigger className="h-9 bg-background border-slate-300 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-end">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 px-3"
                  title="Clear Filters"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

