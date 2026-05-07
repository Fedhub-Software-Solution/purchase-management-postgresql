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
import * as XLSX from "xlsx";

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
  const [isParsingFile, setIsParsingFile] = useState(false);

  type ParsedRow = Record<string, string>;

  const normalizeHeader = (value: string) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

  const headerAliases = {
    name: ["item name", "item", "product", "product name", "name"],
    model: ["model", "model no", "model number", "part number", "part no"],
    supplier: ["supplier", "supplier name", "vendor", "vendor name"],
    quantity: ["quantity", "qty", "qnty"],
    unitPrice: ["unit price", "price", "rate", "unit cost", "unitprice"],
    uom: ["uom", "unit", "unit of measure"],
    currency: ["currency", "curr", "ccy"],
  } as const;

  const requiredFields: Array<keyof typeof headerAliases> = [
    "name",
    "model",
    "quantity",
    "unitPrice",
    "uom",
  ];

  const resolveHeader = (headers: string[], field: keyof typeof headerAliases) =>
    headers.find((h) => headerAliases[field].includes(normalizeHeader(h)));

  const parseRowsToItems = (rows: ParsedRow[]) => {
    if (!rows.length) {
      toast.error("No data rows found in the file");
      return;
    }

    const sourceHeaders = Object.keys(rows[0]);
    const missingHeaders = requiredFields.filter(
      (field) => !resolveHeader(sourceHeaders, field)
    );

    if (missingHeaders.length > 0) {
      toast.error(
        `Missing required columns: ${missingHeaders
          .map((m) => (m === "unitPrice" ? "unit price" : m))
          .join(", ")}`
      );
      return;
    }

    const getValue = (row: ParsedRow, field: keyof typeof headerAliases) => {
      const key = resolveHeader(Object.keys(row), field);
      return key ? String(row[key] ?? "").trim() : "";
    };

    const newItems: Omit<PurchaseItem, "id" | "total">[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const quantity = parseInt(getValue(row, "quantity"), 10);
      const unitPrice = parseFloat(getValue(row, "unitPrice"));
      const currency = (getValue(row, "currency") || DEFAULT_CURRENCY).toUpperCase();

      if (!getValue(row, "name")) {
        toast.error(`Row ${i + 2}: Item Name is required`);
        return;
      }
      if (isNaN(quantity) || quantity <= 0) {
        toast.error(`Row ${i + 2}: Invalid quantity value`);
        return;
      }
      if (isNaN(unitPrice) || unitPrice <= 0) {
        toast.error(`Row ${i + 2}: Invalid unit price value`);
        return;
      }

      const validCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
      if (!validCurrency) {
        toast.error(`Row ${i + 2}: Invalid currency code '${currency}'`);
        return;
      }

      newItems.push({
        name: getValue(row, "name"),
        model: getValue(row, "model"),
        supplier: getValue(row, "supplier") || "General Supplier",
        quantity,
        unitPrice,
        uom: getValue(row, "uom") || "pcs",
        currency,
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
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const isCsv = name.endsWith(".csv");
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

    if (!isCsv && !isExcel) {
      toast.error("Unsupported file type. Please upload CSV or Excel file.");
      return;
    }

    try {
      setIsParsingFile(true);
      if (isCsv) {
        const text = await file.text();
        const wb = XLSX.read(text, { type: "string" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, {
          defval: "",
          raw: false,
        });
        parseRowsToItems(rows);
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, {
          defval: "",
          raw: false,
        });
        parseRowsToItems(rows);
      }
    } catch {
      toast.error("Failed to parse file. Please verify format and try again.");
    } finally {
      setIsParsingFile(false);
      e.target.value = "";
    }
  };

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
      const headers = lines[0].split(",").map((h) => h.trim());
      const missingHeaders = requiredFields.filter(
        (field) => !resolveHeader(headers, field)
      );

      if (missingHeaders.length > 0) {
        toast.error(
          `Missing required columns: ${missingHeaders
            .map((m) => (m === "unitPrice" ? "unit price" : m))
            .join(", ")}`
        );
        return;
      }

      const newItems: Omit<PurchaseItem, "id" | "total">[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());

        if (values.length !== headers.length) {
          toast.error(`Row ${i + 1}: Incorrect number of columns`);
          return;
        }

        const findIndex = (field: keyof typeof headerAliases) => {
          const header = resolveHeader(headers, field);
          return header ? headers.indexOf(header) : -1;
        };

        const nameIndex = findIndex("name");
        const modelIndex = findIndex("model");
        const supplierIndex = findIndex("supplier");
        const quantityIndex = findIndex("quantity");
        const priceIndex = findIndex("unitPrice");
        const uomIndex = findIndex("uom");
        const currencyIndex = findIndex("currency");

        const quantity = parseInt(values[quantityIndex]);
        const unitPrice = parseFloat(values[priceIndex]);
        const currency =
          (currencyIndex >= 0 ? values[currencyIndex] : "") || DEFAULT_CURRENCY;

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
          supplier:
            supplierIndex >= 0
              ? values[supplierIndex] || "General Supplier"
              : "General Supplier",
          quantity: quantity,
          unitPrice: unitPrice,
          uom: uomIndex >= 0 ? values[uomIndex] || "pcs" : "pcs",
          currency: currency.toUpperCase(),
        });
      }

      if (newItems.length > 0) parseRowsToItems(
        newItems.map((item) => ({
          "Item Name": item.name,
          "Model": item.model,
          "Supplier": item.supplier,
          "Quantity": String(item.quantity),
          "Unit Price": String(item.unitPrice),
          "UOM": item.uom,
          "Currency": item.currency,
        }))
      );
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
          <div className="space-y-2">
            <Label htmlFor="importFile">Upload CSV / Excel File</Label>
            <input
              id="importFile"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileChange}
              disabled={isParsingFile}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: CSV, XLSX, XLS
            </p>
          </div>

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
            <Label htmlFor="csvData">Or Paste CSV Data</Label>
            <Textarea
              id="csvData"
              placeholder={`Item Name,Model,Supplier,Quantity,Unit Price,UOM,Currency
Office Chair,ErgoMax Pro 2024,Tech Suppliers Ltd,10,299.99,pcs,INR
Standing Desk,FlexiDesk Height Adjustable,Global Parts Inc,5,599.99,pcs,USD`}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Required columns: Item Name, Model, Quantity, Unit Price, UOM (Supplier/Currency optional)
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

