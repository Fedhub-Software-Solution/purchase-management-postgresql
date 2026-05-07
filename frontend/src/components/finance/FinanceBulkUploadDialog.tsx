import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Download, FileUp } from "lucide-react";

interface FinanceBulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadTemplate: () => void;
  onChooseFile: () => void;
  selectedFileName?: string;
  previewRows?: Array<{
    category: string;
    amount: number;
    description: string;
    date: string;
    paymentMethod: string;
    status: string;
    amountSpentBy?: string;
  }>;
  validationErrors?: string[];
  onSubmitImport: () => void;
  isSubmitting?: boolean;
}

export function FinanceBulkUploadDialog({
  open,
  onOpenChange,
  onDownloadTemplate,
  onChooseFile,
  selectedFileName,
  previewRows = [],
  validationErrors = [],
  onSubmitImport,
  isSubmitting = false,
}: FinanceBulkUploadDialogProps) {
  const hasPreview = previewRows.length > 0;
  const hasErrors = validationErrors.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-blue-600" />
            Import Finance Records
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={onChooseFile}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Choose File
          </Button>
          <Button
            onClick={onSubmitImport}
            disabled={!hasPreview || hasErrors || isSubmitting}
          >
            <FileUp className="h-4 w-4 mr-2" />
            {isSubmitting ? "Importing..." : "Submit Import"}
          </Button>
        </DialogFooter>

        {(selectedFileName || hasPreview || hasErrors) && (
          <div className="mt-2 space-y-3 border-t pt-4">
            {selectedFileName && (
              <p className="text-sm">
                <span className="font-medium">Selected file:</span> {selectedFileName}
              </p>
            )}
            {hasErrors ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium mb-1">Validation errors found:</p>
                <ul className="list-disc ml-5 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : hasPreview ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-700">
                Validation passed. {previewRows.length} record(s) ready to import.
              </div>
            ) : null}

            {hasPreview && (
              <div className="max-h-56 overflow-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Payment Method</th>
                      <th className="text-left p-2">Spent By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{row.category}</td>
                        <td className="p-2">{row.amount}</td>
                        <td className="p-2">{row.date}</td>
                        <td className="p-2">{row.paymentMethod}</td>
                        <td className="p-2">{row.amountSpentBy || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

