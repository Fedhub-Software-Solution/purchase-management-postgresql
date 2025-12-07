import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Separator } from "../ui/separator";
import {
  ArrowLeft,
  Download,
  Receipt,
  User,
  CalendarDays,
  Package,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import type { Invoice, Client } from "../../types";
import { getStatusColor, downloadInvoicePDF } from "./utils";
import { useGetSettingsQuery } from "../../lib/api/slices/settings";

interface InvoiceViewProps {
  invoice: Invoice;
  clients: Client[];
  onBack: () => void;
}

export function InvoiceView({ invoice, clients, onBack }: InvoiceViewProps) {
  const client = clients.find((c) => c.id === invoice.clientId);
  const { data: settings } = useGetSettingsQuery();
  if (!client) return null;

  const invoiceItems = invoice.items ?? [];
  const poIds =
    invoice.purchaseIds ?? (invoice.purchaseId ? [invoice.purchaseId] : []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Card className="border-0 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span>Invoice Details</span>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => downloadInvoicePDF(invoice, clients, settings)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 p-8 bg-white dark:bg-gray-900 text-black dark:text-white border rounded-xl">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold gradient-text">INVOICE</h1>
                <p className="text-xl font-mono">{invoice.invoiceNumber}</p>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                <h2 className="text-xl font-semibold text-blue-600">
                  FedHub Software Solutions
                </h2>
                <p className="text-sm">P No 69,70 Gokula Nandhana, Gokul Nagar</p>
                <p className="text-sm">
                  Hosur, Krishnagiri-DT, Tamil Nadu, India-635109
                </p>
                <p className="text-sm text-blue-600">info@fedhubsoftware.com</p>
                <p className="text-sm font-medium">+91 9003285428</p>
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    GST: <span className="font-mono">33AACCF2123P1Z5</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PAN: <span className="font-mono">AACCF2123P</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MSME: <span className="font-mono">UDYAM-TN-06-0012345</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-600 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Bill To:</span>
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-lg">{client.company}</p>
                  <p className="font-medium">{client.contactPerson}</p>
                  <p className="text-sm">{client.email}</p>
                  <p className="text-sm">{client.phone}</p>
                  <div className="text-sm">
                    <p>{client.billingAddress.street}</p>
                    <p>
                      {client.billingAddress.city}, {client.billingAddress.state}
                    </p>
                    <p>
                      {client.billingAddress.postalCode},{" "}
                      {client.billingAddress.country}
                    </p>
                  </div>
                  {client.gstNumber && (
                    <p className="text-sm font-medium">GST: {client.gstNumber}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-green-600 flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5" />
                  <span>Invoice Details:</span>
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Invoice Date:</span>
                    <span>
                      {(invoice.createdAt instanceof Date
                        ? invoice.createdAt
                        : new Date(invoice.createdAt)
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Due Date:</span>
                    <span className="font-medium text-red-600">
                      {(invoice.dueDate instanceof Date
                        ? invoice.dueDate
                        : new Date(invoice.dueDate)
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Purchase Order{poIds.length > 1 ? "s" : ""}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {poIds.map((id) => (
                        <Badge
                          key={id}
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Terms:</span>
                    <span>{invoice.paymentTerms || "30"} Days</span>
                  </div>
                  {invoice.notes && (
                    <div className="flex justify-between">
                      <span className="font-medium">Notes:</span>
                      <span className="text-sm">{invoice.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-purple-600 flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Items & Services:</span>
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Model</TableHead>
                      <TableHead className="font-semibold">Supplier</TableHead>
                      <TableHead className="font-semibold text-center">Qty</TableHead>
                      <TableHead className="font-semibold text-center">UOM</TableHead>
                      <TableHead className="font-semibold text-center">Currency</TableHead>
                      <TableHead className="font-semibold text-right">Unit Price</TableHead>
                      <TableHead className="font-semibold text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow
                        key={`${item.id ?? index}-${index}`}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {(item as any).poNumber && (
                              <p className="text-xs text-muted-foreground">
                                PO: {(item as any).poNumber}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.model}</TableCell>
                        <TableCell className="font-medium">
                          <span className="text-blue-600 dark:text-blue-400">
                            {item.supplier || "Not specified"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">{item.uom}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {item.currency}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice, item.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total, item.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-3 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotal || 0, DEFAULT_CURRENCY)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18% GST):</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.tax || 0, DEFAULT_CURRENCY)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">
                    {formatCurrency(invoice.total || 0, DEFAULT_CURRENCY)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  * All amounts in {DEFAULT_CURRENCY} (Base Currency)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 space-y-3 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-black dark:text-white mb-2">
                    Payment Instructions:
                  </h4>
                  <p>
                    Payment is due within {invoice.paymentTerms || "30"} days of
                    invoice date.
                  </p>
                  <p>
                    Please reference invoice number {invoice.invoiceNumber} with
                    your payment.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-black dark:text-white mb-2">
                    Terms & Conditions:
                  </h4>
                  <p>Tax Rate: 18% GST as applicable per Indian tax regulations.</p>
                  <p>Late payments may incur additional charges.</p>
                </div>
              </div>
              <div className="text-center pt-4 border-t">
                <p className="font-medium text-blue-600">
                  Thank you for your business!
                </p>
                <p>FedHub Software Solutions - Your trusted technology partner</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

