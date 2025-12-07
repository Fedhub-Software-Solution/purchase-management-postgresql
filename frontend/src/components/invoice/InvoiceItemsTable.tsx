import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Edit3, Check, X, Trash2 } from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import type { PurchaseItem } from "../../types";

interface InvoiceItemsTableProps {
  items: (PurchaseItem & { purchaseId: string; poNumber: string })[];
  editingItems: { [key: number]: boolean };
  onUpdateItem: (index: number, field: string, value: any) => void;
  onRemoveItem: (index: number) => void;
  onToggleEdit: (index: number) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: (index: number) => void;
  subtotal: number;
  tax: number;
  total: number;
  mode?: "create" | "edit";
}

export function InvoiceItemsTable({
  items,
  editingItems,
  onUpdateItem,
  onRemoveItem,
  onToggleEdit,
  onSaveEdit,
  onCancelEdit,
  subtotal,
  tax,
  total,
  mode = "create",
}: InvoiceItemsTableProps) {
  const isCreateMode = mode === "create";

  return (
    <div className="border rounded-xl bg-white dark:bg-gray-800 overflow-hidden">
      <div className={isCreateMode ? "max-h-80 overflow-y-auto" : "overflow-x-auto"}>
        <Table>
          <TableHeader>
            <TableRow className={`bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 ${
              !isCreateMode ? "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20" : ""
            }`}>
              {isCreateMode && <TableHead className="font-semibold">PO#</TableHead>}
              <TableHead className="font-semibold">
                {isCreateMode ? "Item Name" : "Description"}
              </TableHead>
              <TableHead className="font-semibold">Model</TableHead>
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold text-center">
                {isCreateMode ? "Quantity" : "Qty"}
              </TableHead>
              <TableHead className="font-semibold text-center">UOM</TableHead>
              <TableHead className="font-semibold text-center">Currency</TableHead>
              <TableHead className="font-semibold text-right">Unit Price</TableHead>
              <TableHead className="font-semibold text-right">Total</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const isEditing = editingItems[index];
              return (
                <TableRow
                  key={`${item.purchaseId}-${item.id}-${index}`}
                  className={!isCreateMode ? "hover:bg-muted/50" : ""}
                >
                  {isCreateMode && (
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {(item as any).poNumber}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <Input
                        value={item.name}
                        onChange={(e) => onUpdateItem(index, "name", e.target.value)}
                        className="h-8 text-sm"
                        placeholder={isCreateMode ? undefined : "Enter description"}
                      />
                    ) : (
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {!isCreateMode && (item as any).poNumber && (
                          <p className="text-xs text-muted-foreground">
                            PO: {(item as any).poNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={item.model || ""}
                        onChange={(e) => onUpdateItem(index, "model", e.target.value)}
                        className="h-8 text-sm"
                        placeholder={isCreateMode ? undefined : "Enter model"}
                      />
                    ) : (
                      item.model
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <Input
                        value={item.supplier || ""}
                        onChange={(e) => onUpdateItem(index, "supplier", e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Enter supplier"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400">
                        {item.supplier || "Not specified"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm w-20 text-center"
                        min="0"
                        step="1"
                      />
                    ) : (
                      item.quantity
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Select
                        value={item.uom}
                        onValueChange={(value: string) => onUpdateItem(index, "uom", value)}
                      >
                        <SelectTrigger className="h-8 text-sm w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">PCS</SelectItem>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="sets">Sets</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="kg">KG</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="meters">Meters</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      item.uom
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Select
                        value={item.currency}
                        onValueChange={(value: string) => onUpdateItem(index, "currency", value)}
                      >
                        <SelectTrigger className="h-8 text-sm w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {item.currency}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          onUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm w-24 text-right"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      formatCurrency(item.unitPrice, item.currency)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total, item.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSaveEdit(index)}
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelEdit(index)}
                            className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleEdit(index)}
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Summary */}
      <div className={`border-t bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 ${
        !isCreateMode ? "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20" : ""
      }`}>
        <div className="flex justify-end">
          <div className="w-80 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(subtotal, DEFAULT_CURRENCY)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (18% GST):</span>
              <span className="font-medium">
                {formatCurrency(tax, DEFAULT_CURRENCY)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-lg">
                {formatCurrency(total, DEFAULT_CURRENCY)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              * All amounts converted to INR base currency
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

