import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";
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
  const scrollPreview = previewRows.length > 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // One in-flow child (wrapper) + absolute close: avoid shadcn default `grid` creating one row per
          // fragment child so the table row grows to full content and hides the footer.
          "!flex max-h-[calc(100dvh-2rem)] min-h-0 w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl",
          "top-4 translate-y-0",
        )}
      >
        <div
          className={cn(
            "flex min-h-0 w-full min-w-0 flex-col overflow-hidden",
            scrollPreview &&
              "h-[min(85dvh,calc(100dvh-2rem))] max-h-[min(85dvh,calc(100dvh-2rem))] shrink-0",
            !scrollPreview && "max-h-[calc(100dvh-2rem)]",
          )}
        >
          <div className="shrink-0 border-b px-6 pb-4 pt-6 pr-14">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-blue-600" />
                Import Finance Records
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
          </div>

          {(selectedFileName || hasPreview || hasErrors) && (
            <div className="shrink-0 space-y-3 border-b px-6 py-4">
              {selectedFileName && (
                <p className="text-sm">
                  <span className="font-medium">Selected file:</span> {selectedFileName}
                </p>
              )}
              {hasErrors ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-medium mb-1">Validation errors found:</p>
                  <ul className="ml-5 list-disc space-y-1">
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
            </div>
          )}

          {hasPreview && (
            <div
              className={cn(
                "px-6 py-4",
                // h-0 + flex-1 gives a definite flex height so overflow/scroll can activate (min-height:auto breaks it).
                scrollPreview &&
                  "flex h-0 min-h-0 flex-1 basis-0 flex-col overflow-hidden",
              )}
            >
              {scrollPreview ? (
                <ScrollArea
                  type="always"
                  className="h-full min-h-0 w-full rounded-md border bg-background"
                >
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 border-b bg-muted shadow-sm">
                      <tr>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Payment Method</th>
                        <th className="p-2 text-left">Spent By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="border-t border-border/60 bg-background">
                          <td className="p-2">{row.category}</td>
                          <td className="p-2">{row.amount}</td>
                          <td className="p-2">{row.date}</td>
                          <td className="p-2">{row.paymentMethod}</td>
                          <td className="p-2">{row.amountSpentBy || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-xs">
                    <thead className="border-b bg-muted">
                      <tr>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Payment Method</th>
                        <th className="p-2 text-left">Spent By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="border-t border-border/60 bg-background">
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

          <DialogFooter className="mt-auto shrink-0 gap-2 border-t bg-background px-6 py-4 sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={onDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button variant="outline" onClick={onChooseFile}>
              <FileUp className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <Button
              onClick={onSubmitImport}
              disabled={!hasPreview || hasErrors || isSubmitting}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {isSubmitting ? "Importing..." : "Submit Import"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

