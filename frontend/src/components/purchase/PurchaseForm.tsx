import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import {
  ArrowLeft,
  Package,
  User,
  DollarSign,
  FileText,
  X,
  Save,
  Upload,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY, getExchangeRateDisclaimer } from "../../utils/currency";
import type { Purchase, Client, PurchaseItem } from "../../types";
import { PurchaseItemsTable } from "./PurchaseItemsTable";
import { AddItemForm } from "./AddItemForm";
import { BulkImportDialog } from "./BulkImportDialog";
import { calculateSubtotal, calculateTax, calculateTotal } from "./utils";
import type { PurchaseFormData, NewItemFormData } from "./types";

interface PurchaseFormProps {
  mode: "add" | "edit";
  formData: PurchaseFormData;
  onFormDataChange: (data: PurchaseFormData) => void;
  items: Omit<PurchaseItem, "id" | "total">[];
  onItemsChange: (items: Omit<PurchaseItem, "id" | "total">[]) => void;
  newItem: NewItemFormData;
  onNewItemChange: (field: keyof NewItemFormData, value: string | number) => void;
  onSaveItem: () => void;
  showBulkImport: boolean;
  onBulkImportToggle: (show: boolean) => void;
  onBulkImport: (items: Omit<PurchaseItem, "id" | "total">[]) => void;
  clients: Client[];
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  editingPurchase?: Purchase | null;
}

export function PurchaseForm({
  mode,
  formData,
  onFormDataChange,
  items,
  onItemsChange,
  newItem,
  onNewItemChange,
  onSaveItem,
  showBulkImport,
  onBulkImportToggle,
  onBulkImport,
  clients,
  isLoading,
  onSubmit,
  onCancel,
  editingPurchase,
}: PurchaseFormProps) {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(items);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>
                {editingPurchase ? "Edit Purchase" : "Create New Purchase"}
              </span>
            </CardTitle>
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="space-y-8"
          >
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
                <div className="space-y-2">
                  <Label htmlFor="client" className="flex items-center space-x-1">
                    <span>Client</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value: string) =>
                      onFormDataChange({ ...formData, clientId: value })
                    }
                  >
                    <SelectTrigger className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.company}</span>
                            <span className="text-sm text-muted-foreground">
                              {client.contactPerson}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center space-x-1">
                    <span>Status</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Purchase["status"]) =>
                      onFormDataChange({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Order Items</h3>
                    <Badge
                      variant="outline"
                      className="mt-1 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {items.length} {items.length === 1 ? "Item" : "Items"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <BulkImportDialog
                    open={showBulkImport}
                    onOpenChange={onBulkImportToggle}
                    onImport={onBulkImport}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkImportToggle(true)}
                    className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                    title="Import multiple items from CSV"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Bulk Import</span>
                  </Button>
                </div>
              </div>

              <AddItemForm
                newItem={newItem}
                onItemChange={onNewItemChange}
                onSave={onSaveItem}
              />

              <PurchaseItemsTable
                items={items}
                onRemove={(index) =>
                  onItemsChange(items.filter((_, i) => i !== index))
                }
                mode="form"
              />
            </div>

            {/* Order Summary */}
            <div className="p-6 border rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-medium">Order Summary</h3>
              </div>
              <div className="space-y-3 text-right">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal, DEFAULT_CURRENCY)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%):</span>
                  <span className="font-medium">
                    {formatCurrency(tax, DEFAULT_CURRENCY)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(total, DEFAULT_CURRENCY)}
                  </span>
                </div>
                {items.some((item) => item.currency !== DEFAULT_CURRENCY) && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs text-muted-foreground italic">
                      * {getExchangeRateDisclaimer()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All amounts converted to {DEFAULT_CURRENCY} for calculation.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500/20 to-slate-500/20">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium">Additional Notes</h3>
              </div>
              <div className="p-6 border rounded-xl bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-900/10 dark:to-slate-900/10 border-gray-200 dark:border-gray-800">
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional notes or special instructions..."
                  rows={4}
                  className="bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 focus:border-gray-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isLoading || items.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPurchase ? "Update Purchase" : "Create Purchase"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

