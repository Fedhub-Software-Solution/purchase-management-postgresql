import { motion } from "motion/react";
import { GlassCard } from "../GlassCard";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Plus,
  DollarSign,
  FileText,
  Calculator,
  Calendar,
  UploadCloud,
  ArrowLeft,
} from "lucide-react";
import { Breadcrumb } from "../Breadcrumb";
import { categoryOptions, paymentMethods } from "./utils";
import type { FinanceFormData } from "./types";

interface FinanceFormProps {
  mode: "create" | "edit";
  formData: FinanceFormData;
  onFormDataChange: (data: FinanceFormData) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onBulkUploadClick?: () => void;
}

export function FinanceForm({
  mode,
  formData,
  onFormDataChange,
  isLoading,
  onSubmit,
  onCancel,
  onBulkUploadClick,
}: FinanceFormProps) {
  const breadcrumbItems = [
    { label: "Home", onClick: () => {} },
    { label: "Finance", onClick: onCancel },
  ];
  const currentPage = mode === "create" ? "Add Record" : "Edit Record";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Breadcrumb items={breadcrumbItems} currentPage={currentPage} />

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {mode === "create" ? "Add Finance Record" : "Edit Finance Record"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Create a new financial record for tracking investments, expenses, or TDS transactions"
              : "Update the details of your finance record"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onBulkUploadClick && (
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onBulkUploadClick}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
        </div>
      </div>

      <GlassCard className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Finance Record Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Transaction Type *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: any) =>
                    onFormDataChange({ ...formData, type: v, category: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invested">Invested</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="tds">TDS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(v: any) =>
                    onFormDataChange({ ...formData, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions[formData.type].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Amount *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, amount: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    required
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v: any) =>
                    onFormDataChange({ ...formData, paymentMethod: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Transaction Date *
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: any) =>
                    onFormDataChange({ ...formData, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reference</Label>
                  <Input
                    placeholder="Auto-generated if left empty"
                    value={formData.reference}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, reference: e.target.value })
                    }
                  />
                </div>
                {formData.type === "tds" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tax Year</Label>
                    <Input
                      placeholder="e.g., 2024-25"
                      value={formData.taxYear}
                      onChange={(e) =>
                        onFormDataChange({ ...formData, taxYear: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button disabled={isLoading} type="submit">
                {mode === "create" ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

