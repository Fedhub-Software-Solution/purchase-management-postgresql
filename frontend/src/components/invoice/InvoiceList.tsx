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
  Plus,
  Eye,
  Download,
  FileText,
  Send,
  Edit3,
  Trash2,
  Receipt,
  Package,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import type { Invoice, Client } from "../../types";
import {
  getStatusColor,
  downloadInvoicePDF,
  downloadInvoiceDeliveryChallanPDF,
} from "./utils";
import { InvoiceKPIs } from "./InvoiceKPIs";
import { InvoiceFilters } from "./InvoiceFilters";
import type { KPIStats, InvoiceFilters as InvoiceFiltersType } from "./types";
import { useGetSettingsQuery } from "../../lib/api/slices/settings";

interface InvoiceListProps {
  invoices: Invoice[];
  invoicesTotal: number;
  invoicesFetching: boolean;
  kpis: KPIStats;
  filters: InvoiceFiltersType;
  onFiltersChange: (filters: InvoiceFiltersType) => void;
  clients: Client[];
  statusUpdatingId: string | null;
  deleting: boolean;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onStatusUpdate: (invoiceId: string, status: Invoice["status"]) => void;
  onCreateNew: () => void;
}

export function InvoiceList({
  invoices,
  invoicesTotal,
  invoicesFetching,
  kpis,
  filters,
  onFiltersChange,
  clients,
  statusUpdatingId,
  deleting,
  onView,
  onEdit,
  onDelete,
  onStatusUpdate,
  onCreateNew,
}: InvoiceListProps) {
  const formatUiDate = (value: any) => {
    if (!value) return "—";
    if (typeof value === "string") {
      const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        return d.toLocaleDateString();
      }
    }
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "invoiceNumber" | "client" | "amount" | "status" | "createdAt" | "dueDate"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { data: settings } = useGetSettingsQuery();
  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
  const sortedInvoices = useMemo(() => {
    return invoices.slice().sort((a, b) => {
      const clientA = clients.find((c) => c.id === a.clientId);
      const clientB = clients.find((c) => c.id === b.clientId);
      const toMs = (v: any) => {
        const d = v instanceof Date ? v : new Date(v);
        return Number.isNaN(d.getTime()) ? 0 : d.getTime();
      };
      const getValue = (inv: Invoice, client: Client | undefined) => {
        switch (sortBy) {
          case "invoiceNumber":
            return String(inv.invoiceNumber || "").toLowerCase();
          case "client":
            return String(client?.company || "").toLowerCase();
          case "amount":
            return Number(inv.total || 0);
          case "status":
            return String(inv.status || "").toLowerCase();
          case "dueDate":
            return toMs(inv.dueDate);
          case "createdAt":
          default:
            return toMs(inv.createdAt);
        }
      };
      const aVal = getValue(a, clientA);
      const bVal = getValue(b, clientB);
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [invoices, clients, sortBy, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedInvoices = useMemo(
    () => sortedInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedInvoices, safePage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [invoices.length, sortBy, sortOrder]);

  const toggleSort = (
    column: "invoiceNumber" | "client" | "amount" | "status" | "createdAt" | "dueDate"
  ) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder(
      column === "invoiceNumber" || column === "client" || column === "status" ? "asc" : "desc"
    );
  };
  const sortIcon = (
    column: "invoiceNumber" | "client" | "amount" | "status" | "createdAt" | "dueDate"
  ) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Breadcrumb items={breadcrumbItems} currentPage="Invoice Management" />
          {/* <h1 className="text-2xl font-medium tracking-tight">
            Invoice Management
          </h1> */}
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </motion.div>
      </div>

      <InvoiceKPIs kpis={kpis} />

      <InvoiceFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        clients={clients}
      />

      <Card className="border-0 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Invoices</span>
            <Badge variant="outline" className="ml-2">
              {invoices.length} of {invoicesTotal}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {invoicesFetching
                  ? "Loading invoices…"
                  : "No invoice yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first invoice.
              </p>
              {!invoicesFetching && (
                <Button onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                    <TableHead className="font-semibold">
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("invoiceNumber")}>
                        Invoice #
                        {sortIcon("invoiceNumber")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("client")}>
                        Client
                        {sortIcon("client")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("amount")}>
                          Amount
                          {sortIcon("amount")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("status")}>
                        Status
                        {sortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("createdAt")}>
                        Created
                        {sortIcon("createdAt")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => toggleSort("dueDate")}>
                        Due Date
                        {sortIcon("dueDate")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {paginatedInvoices.map((invoice) => {
                      const client = clients.find(
                        (c) => c.id === invoice.clientId
                      );
                      return (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {invoice.invoiceNumber}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {client?.company || "Unknown"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {client?.contactPerson}
                              </div>
                              {invoice.purchaseIds &&
                                invoice.purchaseIds.length > 1 && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {invoice.purchaseIds.length} Purchase Orders
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(
                              invoice.total || 0,
                              DEFAULT_CURRENCY
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatUiDate(invoice.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatUiDate(invoice.dueDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(invoice)}
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                title="View Invoice"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(invoice)}
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                                title="Edit Invoice"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadInvoicePDF(invoice, clients, settings)}
                                className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  downloadInvoiceDeliveryChallanPDF(
                                    invoice,
                                    clients,
                                    settings
                                  )
                                }
                                className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                title="Delivery Challan"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(invoice.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                title="Delete Invoice"
                                disabled={deleting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              {invoice.status === "draft" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onStatusUpdate(invoice.id, "sent")
                                  }
                                  className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                  title="Send Invoice"
                                  disabled={statusUpdatingId === invoice.id}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              {invoice.status === "sent" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    onStatusUpdate(invoice.id, "paid")
                                  }
                                  className="h-7 text-xs px-2 text-green-600 border-green-200 hover:bg-green-50"
                                  title="Mark as Paid"
                                  disabled={statusUpdatingId === invoice.id}
                                >
                                  Mark Paid
                                </Button>
                              )}
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
          {sortedInvoices.length > PAGE_SIZE && (
            <div className="mt-4 grid grid-cols-3 items-center">
              <p className="text-sm text-muted-foreground justify-self-start">
                Showing {(safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, sortedInvoices.length)} of {sortedInvoices.length} invoices
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

