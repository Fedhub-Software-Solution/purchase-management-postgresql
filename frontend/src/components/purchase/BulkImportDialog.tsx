import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "../../utils/currency";
import type { PurchaseItem } from "../../types";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: Omit<PurchaseItem, "id" | "total">[]) => void;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  onImport,
}: BulkImportDialogProps) {
  const [csvData, setCsvData] = useState("");

  const generateSampleCSV = () => {
    const sampleData = [
      ["Item Name", "Model", "Supplier", "Quantity", "Unit Price", "UOM", "Currency"],
      ["Sample Item 1", "Model ABC-123", "Tech Suppliers Ltd", "10", "99.99", "pcs", "INR"],
      ["Sample Item 2", "Model XYZ-456", "Global Parts Inc", "5", "199.99", "kg", "USD"],
      ["Sample Item 3", "Model DEF-789", "Local Vendor Co", "25", "49.99", "boxes", "INR"],
    ];

    const csvContent = sampleData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_items_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Sample CSV template downloaded!", {
      description: "Use this template to format your bulk import data.",
    });
  };

  const processBulkImport = () => {
    if (!csvData.trim()) {
      toast.error("Please paste CSV data before importing");
      return;
    }

    try {
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      const requiredHeaders = [
        "item name",
        "model",
        "supplier",
        "quantity",
        "unit price",
        "uom",
        "currency",
      ];
      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header)
      );

      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
        return;
      }

      const newItems: Omit<PurchaseItem, "id" | "total">[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());

        if (values.length !== headers.length) {
          toast.error(`Row ${i + 1}: Incorrect number of columns`);
          return;
        }

        const nameIndex = headers.indexOf("item name");
        const modelIndex = headers.indexOf("model");
        const supplierIndex = headers.indexOf("supplier");
        const quantityIndex = headers.indexOf("quantity");
        const priceIndex = headers.indexOf("unit price");
        const uomIndex = headers.indexOf("uom");
        const currencyIndex = headers.indexOf("currency");

        const quantity = parseInt(values[quantityIndex]);
        const unitPrice = parseFloat(values[priceIndex]);
        const currency = values[currencyIndex] || DEFAULT_CURRENCY;

        if (isNaN(quantity) || quantity <= 0) {
          toast.error(`Row ${i + 1}: Invalid quantity value`);
          return;
        }

        if (isNaN(unitPrice) || unitPrice <= 0) {
          toast.error(`Row ${i + 1}: Invalid unit price value`);
          return;
        }

        const validCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
        if (!validCurrency) {
          toast.error(`Row ${i + 1}: Invalid currency code '${currency}'`);
          return;
        }

        newItems.push({
          name: values[nameIndex] || "",
          model: values[modelIndex] || "",
          supplier: values[supplierIndex] || "",
          quantity: quantity,
          unitPrice: unitPrice,
          uom: values[uomIndex] || "pcs",
          currency: currency,
        });
      }

      if (newItems.length > 0) {
        onImport(newItems);
        setCsvData("");
        onOpenChange(false);

        toast.success(`🎉 Successfully imported ${newItems.length} items!`, {
          description: `${newItems.length} new items added to your purchase order.`,
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error("Error processing CSV data. Please check the format.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <span>Bulk Import Items</span>
          </DialogTitle>
          <DialogDescription>
            Import multiple items at once using CSV format. Download the sample
            template below to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Sample CSV Template
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Download this template to format your data correctly
                </p>
              </div>
              <Button
                onClick={generateSampleCSV}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvData">Paste CSV Data</Label>
            <Textarea
              id="csvData"
              placeholder={`Item Name,Model,Quantity,Unit Price,UOM
Office Chair,ErgoMax Pro 2024,10,299.99,pcs
Standing Desk,FlexiDesk Height Adjustable,5,599.99,pcs`}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Required columns: Item Name, Model, Supplier, Quantity, Unit Price, UOM, Currency
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={processBulkImport}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

