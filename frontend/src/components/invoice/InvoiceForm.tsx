import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ArrowLeft,
  FileText,
  Edit3,
  User,
  Package,
  Receipt,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import type { Invoice, Purchase, Client, PurchaseItem } from "../../types";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import type { InvoiceFormData } from "./types";

interface InvoiceFormProps {
  mode: "create" | "edit";
  formData: InvoiceFormData;
  onFormDataChange: (data: InvoiceFormData) => void;
  selectedPurchases: string[];
  onPurchaseSelection: (purchaseIds: string[]) => void;
  selectedItems: (PurchaseItem & { purchaseId: string; poNumber: string })[];
  editingItems: { [key: number]: boolean };
  onItemUpdate: (index: number, field: string, value: any) => void;
  onItemRemove: (index: number) => void;
  onItemToggleEdit: (index: number) => void;
  onItemSaveEdit: (index: number) => void;
  onItemCancelEdit: (index: number) => void;
  clients: Client[];
  availablePurchases: Purchase[];
  subtotal: number;
  tax: number;
  total: number;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  editInvoice?: Invoice | null;
}

export function InvoiceForm({
  mode,
  formData,
  onFormDataChange,
  selectedPurchases,
  onPurchaseSelection,
  selectedItems,
  editingItems,
  onItemUpdate,
  onItemRemove,
  onItemToggleEdit,
  onItemSaveEdit,
  onItemCancelEdit,
  clients,
  availablePurchases,
  subtotal,
  tax,
  total,
  isLoading,
  onSubmit,
  onCancel,
  editInvoice,
}: InvoiceFormProps) {
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  const handleClientSelection = (clientId: string) => {
    onFormDataChange({ ...formData, clientId });
    if (!isEditMode) {
      onPurchaseSelection([]);
    }
  };

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
              {isEditMode ? (
                <>
                  <Edit3 className="w-5 h-5 text-green-600" />
                  <span>Edit Invoice</span>
                  {editInvoice && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {editInvoice.invoiceNumber}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Create New Invoice</span>
                </>
              )}
            </CardTitle>
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
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
                <div
                  className={`p-2 rounded-lg bg-gradient-to-r ${
                    isEditMode
                      ? "from-green-500/20 to-emerald-500/20"
                      : "from-blue-500/20 to-cyan-500/20"
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${isEditMode ? "text-green-600" : "text-blue-600"}`}
                  />
                </div>
                <h3 className="text-lg font-medium">Basic Information</h3>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl ${
                  isEditMode
                    ? "bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800"
                    : "bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="space-y-2">
                  <Label htmlFor="client" className="flex items-center space-x-1">
                    <span>Client</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={handleClientSelection}
                  >
                    <SelectTrigger
                      className={`bg-white/70 dark:bg-gray-800/70 ${
                        isEditMode
                          ? "border-green-200 dark:border-green-700 focus:border-green-500"
                          : "border-blue-200 dark:border-blue-700 focus:border-blue-500"
                      }`}
                    >
                      <SelectValue placeholder="Select client to filter purchase orders" />
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
                  {formData.clientId && !isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Purchase orders filtered for selected client
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="flex items-center space-x-1">
                    <span>Due Date</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, dueDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className={`bg-white/70 dark:bg-gray-800/70 ${
                      isEditMode
                        ? "border-green-200 dark:border-green-700 focus:border-green-500"
                        : "border-blue-200 dark:border-blue-700 focus:border-blue-500"
                    }`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value: string) =>
                      onFormDataChange({ ...formData, paymentTerms: value })
                    }
                  >
                    <SelectTrigger
                      className={`bg-white/70 dark:bg-gray-800/70 ${
                        isEditMode
                          ? "border-green-200 dark:border-green-700 focus:border-green-500"
                          : "border-blue-200 dark:border-blue-700 focus:border-blue-500"
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="45">45 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isCreateMode && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="purchaseOrders"
                      className="flex items-center space-x-1"
                    >
                      <span>Purchase Orders</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    {!formData.clientId ? (
                      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                        <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Select a client first to view available purchase orders
                        </p>
                      </div>
                    ) : availablePurchases.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No approved/completed purchase orders available for this client
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        {availablePurchases.map((purchase) => {
                          const isSelected = selectedPurchases.includes(purchase.id);
                          return (
                            <div
                              key={purchase.id}
                              className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                                isSelected
                                  ? "border-purple-300 bg-purple-50 dark:bg-purple-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-purple-200 hover:bg-purple-25"
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {
                                  const newSelection = isSelected
                                    ? selectedPurchases.filter((id) => id !== purchase.id)
                                    : [...selectedPurchases, purchase.id];
                                  onPurchaseSelection(newSelection);
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {purchase.poNumber}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {isEditMode && formData.clientId && availablePurchases.length > 0 && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="purchaseOrders"
                      className="flex items-center space-x-1"
                    >
                      <span>Purchase Orders</span>
                    </Label>
                    <div className="p-6 border rounded-xl bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10 border-purple-200 dark:border-purple-800">
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {availablePurchases.map((purchase) => {
                          const isSelected = selectedPurchases.includes(purchase.id);
                          return (
                            <div
                              key={purchase.id}
                              className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                                isSelected
                                  ? "border-purple-300 bg-purple-50 dark:bg-purple-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-purple-200 hover:bg-purple-25"
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked: boolean) => {
                                  const next = checked
                                    ? [...selectedPurchases, purchase.id]
                                    : selectedPurchases.filter((id) => id !== purchase.id);
                                  onPurchaseSelection(next);
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {purchase.poNumber}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes{isEditMode ? " (Optional)" : ""}</Label>
                  <Textarea
                    id="notes"
                    placeholder={
                      isEditMode
                        ? "Add any additional notes or terms..."
                        : "Additional notes for the invoice..."
                    }
                    value={formData.notes}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, notes: e.target.value })
                    }
                    className={`bg-white/70 dark:bg-gray-800/70 ${
                      isEditMode
                        ? "border-green-200 dark:border-green-700 focus:border-green-500 min-h-[80px]"
                        : "border-blue-200 dark:border-blue-700 focus:border-blue-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-r ${
                        isEditMode
                          ? "from-orange-500/20 to-red-500/20"
                          : "from-green-500/20 to-emerald-500/20"
                      }`}
                    >
                      {isEditMode ? (
                        <Receipt
                          className={`w-5 h-5 ${isEditMode ? "text-orange-600" : "text-green-600"}`}
                        />
                      ) : (
                        <Package className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        {isEditMode ? "Invoice Items" : `Invoice Items (${selectedItems.length})`}
                      </h3>
                      {isCreateMode && (
                        <p className="text-sm text-muted-foreground">
                          From {selectedPurchases.length} purchase order
                          {selectedPurchases.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    {isEditMode && (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        {selectedItems.length} Items
                      </Badge>
                    )}
                  </div>
                  {isCreateMode && (
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(total, DEFAULT_CURRENCY)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                    </div>
                  )}
                </div>

                <InvoiceItemsTable
                  items={selectedItems}
                  editingItems={editingItems}
                  onUpdateItem={onItemUpdate}
                  onRemoveItem={onItemRemove}
                  onToggleEdit={onItemToggleEdit}
                  onSaveEdit={onItemSaveEdit}
                  onCancelEdit={onItemCancelEdit}
                  subtotal={subtotal}
                  tax={tax}
                  total={total}
                  mode={mode}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  selectedItems.length === 0 ||
                  !formData.clientId ||
                  !formData.dueDate ||
                  (isCreateMode && selectedPurchases.length === 0)
                }
                className={
                  isEditMode
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                }
              >
                {isEditMode ? (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Update Invoice
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Create Invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

