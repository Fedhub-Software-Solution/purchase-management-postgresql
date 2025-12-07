import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Save } from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencySymbol,
} from "../../utils/currency";
import { calculateItemTotal } from "./utils";
import type { NewItemFormData } from "./types";

interface AddItemFormProps {
  newItem: NewItemFormData;
  onItemChange: (field: keyof NewItemFormData, value: string | number) => void;
  onSave: () => void;
}

export function AddItemForm({
  newItem,
  onItemChange,
  onSave,
}: AddItemFormProps) {
  return (
    <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
      <h4 className="text-lg font-medium mb-4 flex items-center space-x-2">
        <Plus className="w-5 h-5 text-blue-600" />
        <span>Add New Item</span>
      </h4>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="flex items-center space-x-1">
              <span>Item Name</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={newItem.name}
              onChange={(e) => onItemChange("name", e.target.value)}
              placeholder="Enter item name"
              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500"
            />
          </div>
          <div>
            <Label className="flex items-center space-x-1">
              <span>Model</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={newItem.model}
              onChange={(e) => onItemChange("model", e.target.value)}
              placeholder="Enter model number"
              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500"
            />
          </div>
          <div>
            <Label className="flex items-center space-x-1">
              <span>Supplier</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={newItem.supplier}
              onChange={(e) => onItemChange("supplier", e.target.value)}
              placeholder="Enter supplier name"
              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="flex items-center space-x-1">
              <span>Quantity</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) =>
                onItemChange("quantity", parseInt(e.target.value) || 1)
              }
              placeholder="Enter quantity"
              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500"
            />
          </div>
          <div>
            <Label className="flex items-center space-x-1">
              <span>UOM</span>
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newItem.uom}
              onValueChange={(value: string) => onItemChange("uom", value)}
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500">
                <SelectValue placeholder="Select UOM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="ltr">Liters (ltr)</SelectItem>
                <SelectItem value="mtr">Meters (mtr)</SelectItem>
                <SelectItem value="sqft">Square Feet (sqft)</SelectItem>
                <SelectItem value="boxes">Boxes</SelectItem>
                <SelectItem value="sets">Sets</SelectItem>
                <SelectItem value="rolls">Rolls</SelectItem>
                <SelectItem value="tons">Tons</SelectItem>
                <SelectItem value="units">Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center space-x-1">
              <span>Currency</span>
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newItem.currency}
              onValueChange={(value: string) => onItemChange("currency", value)}
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500">
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center space-x-1">
              <span>Unit Price ({getCurrencySymbol(newItem.currency)})</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newItem.unitPrice}
              onChange={(e) =>
                onItemChange("unitPrice", parseFloat(e.target.value) || 0)
              }
              placeholder="Enter unit price"
              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Item Total:
            </span>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-lg px-3 py-1"
            >
              {formatCurrency(
                calculateItemTotal(newItem.quantity, newItem.unitPrice),
                newItem.currency
              )}
            </Badge>
          </div>
          <Button
            type="button"
            onClick={onSave}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Item
          </Button>
        </div>
      </div>
    </div>
  );
}

