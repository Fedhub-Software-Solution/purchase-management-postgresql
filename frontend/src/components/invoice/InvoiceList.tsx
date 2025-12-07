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
  Plus,
  Eye,
  Download,
  Send,
  Edit3,
  Trash2,
  Receipt,
  Package,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import type { Invoice, Client } from "../../types";
import { getStatusColor, downloadInvoicePDF } from "./utils";
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
  const { data: settings } = useGetSettingsQuery();
  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
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
                    <TableHead className="font-semibold">Invoice #</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold text-right">
                      Amount
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {invoices.map((invoice) => {
                      const client = clients.find(
                        (c) => c.id === invoice.clientId
                      );
                      const createdAt =
                        invoice.createdAt instanceof Date
                          ? invoice.createdAt
                          : new Date(invoice.createdAt);
                      const dueAt =
                        invoice.dueDate instanceof Date
                          ? invoice.dueDate
                          : new Date(invoice.dueDate);
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
                            {createdAt.toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {dueAt.toLocaleDateString()}
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

