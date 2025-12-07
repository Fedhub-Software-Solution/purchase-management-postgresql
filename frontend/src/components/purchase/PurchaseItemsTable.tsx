import { motion, AnimatePresence } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Package, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import { calculateItemTotal } from "./utils";
import type { PurchaseItem } from "../../types";

interface PurchaseItemsTableProps {
  items: Omit<PurchaseItem, "id" | "total">[];
  onRemove: (index: number) => void;
  mode?: "form" | "view";
}

export function PurchaseItemsTable({
  items,
  onRemove,
  mode = "form",
}: PurchaseItemsTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="border rounded-xl bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b">
        <h4 className="text-lg font-medium flex items-center space-x-2">
          <Package className="w-5 h-5 text-gray-600" />
          <span>
            {mode === "form" ? "Added Items" : "Order Items"} ({items.length})
          </span>
        </h4>
      </div>

      <div className={mode === "form" ? "max-h-[400px] overflow-y-auto" : "max-h-[500px] overflow-y-auto"}>
        <Table>
          <TableHeader>
            <TableRow className={mode === "view" ? "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700" : ""}>
              <TableHead className={mode === "form" ? "w-[180px]" : ""}>Item Name</TableHead>
              <TableHead className={mode === "form" ? "w-[120px]" : ""}>Model</TableHead>
              <TableHead className={mode === "form" ? "w-[140px]" : ""}>Supplier</TableHead>
              <TableHead className={`${mode === "form" ? "w-[80px]" : ""} text-center`}>
                {mode === "form" ? "Qty" : "Quantity"}
              </TableHead>
              <TableHead className={`${mode === "form" ? "w-[70px]" : ""} text-center`}>UOM</TableHead>
              <TableHead className={`${mode === "form" ? "w-[80px]" : ""} text-center`}>Currency</TableHead>
              <TableHead className={`${mode === "form" ? "w-[110px]" : ""} text-right`}>Unit Price</TableHead>
              <TableHead className={`${mode === "form" ? "w-[110px]" : ""} text-right`}>Total</TableHead>
              {mode === "form" && (
                <TableHead className="w-[80px] text-center">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={mode === "view" ? "hover:bg-gray-50 dark:hover:bg-gray-700/50" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className={mode === "form" ? "text-gray-600 dark:text-gray-400" : "text-muted-foreground"}>
                    {item.model}
                  </TableCell>
                  <TableCell className={mode === "form" ? "text-gray-600 dark:text-gray-400" : "text-muted-foreground"}>
                    {item.supplier || "N/A"}
                  </TableCell>
                  <TableCell className={`text-center ${mode === "view" ? "font-medium" : ""}`}>
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-center">
                    {mode === "view" ? (
                      <Badge variant="outline" className="text-xs uppercase">
                        {item.uom}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                        {item.uom}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {item.currency}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right ${mode === "view" ? "font-medium" : ""}`}>
                    {formatCurrency(item.unitPrice, item.currency)}
                  </TableCell>
                  <TableCell className={`text-right ${mode === "view" ? "font-semibold" : "font-medium"}`}>
                    {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice), item.currency)}
                  </TableCell>
                  {mode === "form" && (
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => onRemove(index)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

