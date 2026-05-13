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
import type { FinanceBulkImportPreviewRow } from "./types";

const PREVIEW_TABLE_HEIGHT_PX = 208;
const PREVIEW_SCROLL_THRESHOLD = 8;

interface FinanceBulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadTemplate: () => void;
  onChooseFile: () => void;
  selectedFileName?: string;
  previewRows?: FinanceBulkImportPreviewRow[];
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
      <DialogContent className="!flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">        <div className="shrink-0 space-y-4 border-b px-6 pb-4 pt-6 pr-14">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-blue-600" />
              Import Finance Records
            </DialogTitle>
            <DialogDescription>
              Upload a CSV or JSON file, review the preview, then submit the import.
            </DialogDescription>
          </DialogHeader>

          {selectedFileName && (
            <p className="text-sm">
              <span className="font-medium">Selected file:</span> {selectedFileName}
            </p>
          )}

          {hasErrors ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="mb-1 font-medium">Validation errors found:</p>
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
          ) : (
            <p className="text-sm text-muted-foreground">
              Download the template or choose a file to preview records before import.
            </p>
          )}
        </div>

        {hasPreview && (
          <div className="px-6 py-4">
            <div className="overflow-hidden rounded-md border bg-background">
              <div
                className="overflow-x-auto overflow-y-scroll [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/70 [&::-webkit-scrollbar-track]:bg-muted/40"
                style={{ height: PREVIEW_TABLE_HEIGHT_PX, overflowY: "scroll" }}
              >
                <table className="w-full min-w-[64rem] text-xs">
                  <thead className="sticky top-0 z-10 border-b bg-muted shadow-sm">
                    <tr>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Amount</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Payment Method</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Amount Spent By</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => {
                      const hasIssue = row.remarks !== "—";
                      return (
                        <tr
                          key={idx}
                          className={
                            hasIssue
                              ? "border-t border-red-200 bg-red-50/80"
                              : "border-t border-border/60 bg-background"
                          }
                        >
                          <td className="p-2">{row.category || "—"}</td>
                          <td className="p-2">{row.amount}</td>
                          <td className="max-w-[14rem] truncate p-2" title={row.description}>
                            {row.description || "—"}
                          </td>
                          <td className="p-2">{row.date}</td>
                          <td className="p-2">{row.paymentMethod || "—"}</td>
                          <td className="p-2">{row.status}</td>
                          <td className="p-2">{row.amountSpentBy || "—"}</td>
                          <td
                            className={
                              hasIssue
                                ? "max-w-[16rem] p-2 text-red-700"
                                : "max-w-[16rem] p-2 text-muted-foreground"
                            }
                            title={row.remarks}
                          >
                            {row.remarks}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>              </div>
            </div>
            {previewRows.length > PREVIEW_SCROLL_THRESHOLD && (
              <p className="mt-2 text-xs text-muted-foreground">
                Scroll inside the table to review all {previewRows.length} rows.
              </p>
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
      </DialogContent>
    </Dialog>
  );
}
