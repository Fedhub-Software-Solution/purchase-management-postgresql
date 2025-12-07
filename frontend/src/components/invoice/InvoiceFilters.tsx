import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Filter } from "lucide-react";
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
  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20">
            <Filter className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-medium text-lg">Search & Filter</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by invoice # or client..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="bg-white/70 dark:bg-gray-800/70"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value: string) =>
                onFiltersChange({ ...filters, status: value })
              }
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
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

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={filters.client}
              onValueChange={(value: string) =>
                onFiltersChange({ ...filters, client: value })
              }
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
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

          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value: string) =>
                onFiltersChange({ ...filters, dateRange: value })
              }
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70">
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
        </div>
      </CardContent>
    </Card>
  );
}

