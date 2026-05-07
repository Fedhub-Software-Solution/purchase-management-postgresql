import { DEFAULT_CURRENCY, convertCurrency, formatCurrencyDigits } from '../../utils/currency';
import type { PurchaseItem } from '../../types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import type { Supplier } from '../../types';
import type { AppSettings } from '../../lib/api/slices/settings';

export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function getStatusIcon(status: string): ReactNode {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateSubtotal(items: PurchaseItem[]): number {
  return items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item.quantity, item.unitPrice);
    const itemTotalInINR = convertCurrency(itemTotal, item.currency, DEFAULT_CURRENCY);
    return sum + itemTotalInINR;
  }, 0);
}

export function calculateTax(subtotal: number): number {
  return subtotal * 0.18; // 18% GST
}

export function calculateTotal(items: PurchaseItem[]): number {
  const subtotal = calculateSubtotal(items);
  return subtotal + calculateTax(subtotal);
}

export function generatePONumber(existingPOs: string[]): string {
  const year = new Date().getFullYear();
  const existingPOsForYear = existingPOs.filter(
    (po) => typeof po === 'string' && po.startsWith(`PO-${year}`)
  );
  const nextNumber = existingPOsForYear.length + 1;
  return `PO-${year}-${nextNumber.toString().padStart(3, '0')}`;
}

export async function downloadPurchasePDF(
  purchase: {
    poNumber: string;
    createdAt?: string | Date;
    date?: string | Date;
    status?: string;
    items?: Array<{
      name: string;
      model?: string;
      supplier?: string;
      quantity?: number;
      uom?: string;
      unitPrice?: number;
      total?: number;
      currency?: string;
    }>;
    subtotal?: number;
    tax?: number;
    total?: number;
    baseCurrency?: string;
    notes?: string;
  },
  supplier?: Supplier,
  settings?: AppSettings | null
) {
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const company = {
      name: settings?.companyName || "FedHub Software Solutions",
      address:
        settings?.companyAddress ||
        "P No 69,70 Gokula Nandhana, Gokul Nagar, Hosur, Krishnagiri-DT, Tamil Nadu, India-635109",
      email: settings?.companyEmail || "info@fedhubsoftware.com",
      phone: settings?.companyPhone || "+91 9003285428",
      gst: settings?.companyGST || "33CUUPA9347J1Z4",
      pan: settings?.companyPAN || "AAJFF8051D",
      msme: settings?.companyMSME || "UDYAM-TN-11-0105606",
    };

    const pageW = 210;
    const left = 10;
    const right = pageW - 10;
    let y = 12;

    const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString("en-GB") : "-");
    const baseCcy = purchase.baseCurrency || DEFAULT_CURRENCY;
    const loadImageDataUrl = async (path: string): Promise<string | null> => {
      try {
        const res = await fetch(path);
        const blob = await res.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return dataUrl;
      } catch {
        return null;
      }
    };
    const safeAddImage = (
      dataUrl: string | null,
      x: number,
      yy: number,
      w: number,
      h: number
    ) => {
      if (!dataUrl) return;
      try {
        const format = dataUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
        pdf.addImage(dataUrl, format, x, yy, w, h);
      } catch (imageErr) {
        console.warn("Skipping PDF image due to format/read error", imageErr);
      }
    };

    const drawCard = (x: number, yy: number, w: number, h: number) => {
      pdf.setDrawColor(220, 226, 235);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, yy, w, h, 2, 2, "FD");
    };

    // Company header card
    drawCard(left, y, right - left, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(13);
    pdf.text(company.name, left + 4, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(9);
    pdf.text(company.address, left + 4, y + 13);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`${company.email} | ${company.phone}`, left + 4, y + 18);
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdf.text(
      `GST: ${company.gst} | PAN: ${company.pan} | MSME: ${company.msme}`,
      left + 4,
      y + 23
    );
    const headerLogo = await loadImageDataUrl("/fedhub-logo.png");
    safeAddImage(headerLogo, right - 20, y + 3, 14, 14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(14);
    pdf.text(`PO#: ${purchase.poNumber || "-"}`, right - 4, y + 24, { align: "right" });
    y += 36;

    // Parallel Purchase + Supplier cards (like view)
    const gap = 6;
    const cardW = (right - left - gap) / 2;
    const cardH = 36;
    drawCard(left, y, cardW, cardH);
    drawCard(left + cardW + gap, y, cardW, cardH);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(11);
    pdf.text("Purchase Information", left + 3, y + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(55, 65, 81);
    pdf.setFontSize(9);
    pdf.text(`PO#: ${purchase.poNumber || "-"}`, left + 3, y + 12);
    pdf.text(`Supplier Code: ${supplier?.supplierCode || "N/A"}`, left + 3, y + 17);
    pdf.text(`Target Date: ${fmtDate(purchase.date)}`, left + 3, y + 22);
    pdf.text(`Created Date: ${fmtDate(purchase.createdAt)}`, left + 3, y + 27);
    pdf.text(`Total Items: ${(purchase.items || []).length}`, left + 3, y + 32);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(11);
    const sx = left + cardW + gap + 3;
    pdf.text("Supplier Information", sx, y + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(55, 65, 81);
    pdf.setFontSize(9);
    pdf.text(`${supplier?.name || "-"}`, sx, y + 12);
    pdf.text(`${supplier?.address || "Address not available"}`.slice(0, 66), sx, y + 17);
    pdf.text(`${supplier?.email || "-"} | ${supplier?.phone || "-"}`.slice(0, 66), sx, y + 22);
    pdf.text(
      `GST: ${supplier?.gstin || "N/A"} | PAN: ${supplier?.panNumber || "N/A"}`.slice(0, 66),
      sx,
      y + 27
    );
    y += cardH + 8;

    // Order items — bordered table (grid) like a printed PO
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(88, 28, 135);
    pdf.setFontSize(11);
    pdf.text(`Order Items (${(purchase.items || []).length})`, left, y);
    y += 6;

    const col = {
      name: left,
      model: 68,
      supplier: 92,
      qty: 126,
      uom: 138,
      currency: 150,
      unitPrice: 164,
      total: 184,
    };
    const cellPad = 1;
    const colW = {
      name: col.model - col.name - cellPad * 2,
      model: col.supplier - col.model - cellPad * 2,
      supplier: col.qty - col.supplier - cellPad * 2,
    };
    /** Vertical lines at column boundaries (full table width) */
    const colBorders = [left, col.model, col.supplier, col.qty, col.uom, col.currency, col.unitPrice, col.total, right];

    const pageBottom = 285;
    const lineHeight = 4;
    const headerRowH = 6;
    /** Subtotal / GST / Total under table — reserved with last row so they stay on the same page */
    const summaryLineGap = 5;
    const summaryBlockH = 3 * summaryLineGap + 10;

    const drawVerticals = (y1: number, y2: number) => {
      pdf.setDrawColor(160, 170, 185);
      for (const x of colBorders) {
        pdf.line(x, y1, x, y2);
      }
    };

    const drawItemsHeader = () => {
      const hTop = y;
      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(120, 135, 155);
      pdf.rect(left, hTop, right - left, headerRowH, "FD");
      drawVerticals(hTop, hTop + headerRowH);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(31, 41, 55);
      const labelY = hTop + 4.2;
      pdf.text("Item Name", col.name + cellPad, labelY);
      pdf.text("Model", col.model + cellPad, labelY);
      pdf.text("Supplier", col.supplier + cellPad, labelY);
      pdf.text("Qty", col.qty + cellPad, labelY);
      pdf.text("UOM", col.uom + cellPad, labelY);
      pdf.text("Curr.", col.currency + cellPad, labelY);
      pdf.text("U. Price", col.total - cellPad, labelY, { align: "right" });
      pdf.text("Total", right - cellPad, labelY, { align: "right" });

      y = hTop + headerRowH;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
    };

    const ensureSpace = (needed: number) => {
      if (y + needed <= pageBottom) return;
      pdf.addPage();
      y = 15;
      drawItemsHeader();
    };

    drawItemsHeader();

    const items = purchase.items || [];
    if (items.length === 0) {
      ensureSpace(summaryBlockH + 2);
    }
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const total = item.total ?? Number(item.quantity || 0) * Number(item.unitPrice || 0);
      const nameLines = pdf.splitTextToSize(String(item.name || "-"), colW.name) as string[];
      const modelLines = pdf.splitTextToSize(String(item.model || "-"), colW.model) as string[];
      const supplierLines = pdf.splitTextToSize(String(item.supplier || "-"), colW.supplier) as string[];
      const rowLines = Math.max(nameLines.length, modelLines.length, supplierLines.length, 1);
      const rowHeight = rowLines * lineHeight + 2;
      const isLastItemRow = idx === items.length - 1;
      ensureSpace(rowHeight + 1 + (isLastItemRow ? summaryBlockH : 0));

      const rowTop = y;
      const textY0 = rowTop + 4;

      for (let i = 0; i < rowLines; i++) {
        const yy = textY0 + i * lineHeight;
        if (nameLines[i]) pdf.text(nameLines[i], col.name + cellPad, yy);
        if (modelLines[i]) pdf.text(modelLines[i], col.model + cellPad, yy);
        if (supplierLines[i]) pdf.text(supplierLines[i], col.supplier + cellPad, yy);
      }
      pdf.text(String(item.quantity || 0), col.qty + cellPad, textY0);
      pdf.text(String(item.uom || "-"), col.uom + cellPad, textY0);
      pdf.text(String(item.currency || purchase.baseCurrency || DEFAULT_CURRENCY), col.currency + cellPad, textY0);
      const rowCcy = String(item.currency || purchase.baseCurrency || DEFAULT_CURRENCY);
      const unitStr = formatCurrencyDigits(item.unitPrice, rowCcy);
      const totalStr = formatCurrencyDigits(total, rowCcy);
      pdf.text(unitStr, col.total - cellPad, textY0, { align: "right" });
      pdf.text(totalStr, right - cellPad, textY0, { align: "right" });

      const rowBottom = rowTop + rowHeight;
      drawVerticals(rowTop, rowBottom);
      pdf.setDrawColor(120, 135, 155);
      pdf.line(left, rowBottom, right, rowBottom);

      y = rowBottom;
    }

    // Subtotal / GST / Total directly under last table row (same page — space reserved in last item row)
    const notesPadding = 4;
    const notesWrapWidth = right - left - notesPadding * 2 - 2;
    const notesBodyFontSize = 8;
    const notesLineHeight = 4;
    const notesTitleHeight = 6;
    const normalizeNotesLines = (rawNotes: string): string[] => {
      const out: string[] = [];
      const sourceLines = String(rawNotes || "").replace(/\r\n/g, "\n").split("\n");
      for (const sourceLine of sourceLines) {
        const wrapped = pdf.splitTextToSize(sourceLine || " ", notesWrapWidth) as string[];
        if (wrapped.length === 0) {
          out.push(" ");
          continue;
        }
        for (const w of wrapped) out.push(w || " ");
      }
      return out;
    };
    const notesText = purchase.notes ? normalizeNotesLines(String(purchase.notes)) : [];
    const notesHeight =
      purchase.notes
        ? notesPadding * 2 + notesTitleHeight + notesText.length * notesLineHeight + 2
        : 0;

    const sumTop = y;
    const sumValX = right - cellPad;
    let yySum = sumTop + 4;

    const drawSummaryLine = (label: string, amount: number | undefined, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(55, 65, 81);
      const amtStr = formatCurrencyDigits(amount, baseCcy);
      pdf.text(amtStr, sumValX, yySum, { align: "right" });
      const amtW = pdf.getTextWidth(amtStr);
      pdf.text(`${label}`, sumValX - amtW - 2, yySum, { align: "right" });
      yySum += summaryLineGap;
    };

    drawSummaryLine("Subtotal:", purchase.subtotal);
    drawSummaryLine("GST (18%):", purchase.tax);
    drawSummaryLine("Total:", purchase.total, true);

    const sumBottom = yySum - summaryLineGap + 3;
    drawVerticals(sumTop, sumBottom);
    pdf.setDrawColor(120, 135, 155);
    pdf.line(left, sumBottom, right, sumBottom);
    y = sumBottom + 4;

    if (purchase.notes) {
      if (y + Math.min(notesHeight, 40) + 8 > pageBottom) {
        pdf.addPage();
        y = 15;
      }

      let remainingLines = [...notesText];
      let isContinued = false;
      while (remainingLines.length > 0) {
        const availableHeight = pageBottom - y - 8;
        const maxLinesForPage = Math.max(
          1,
          Math.floor(
            (availableHeight - (notesPadding * 2 + notesTitleHeight + 2)) / notesLineHeight
          )
        );
        const currentLines = remainingLines.splice(0, maxLinesForPage);
        const boxHeight =
          notesPadding * 2 + notesTitleHeight + currentLines.length * notesLineHeight + 2;

        drawCard(left, y, right - left, boxHeight);

        const titleY = y + notesPadding + 2;
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(9);
        pdf.text(
          isContinued ? "Additional Notes (contd.)" : "Additional Notes",
          left + notesPadding,
          titleY
        );

        let lineY = y + notesPadding + notesTitleHeight + 1;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(55, 65, 81);
        pdf.setFontSize(notesBodyFontSize);
        for (const line of currentLines) {
          pdf.text(line, left + notesPadding, lineY);
          lineY += notesLineHeight;
        }

        y += boxHeight + 4;
        if (remainingLines.length > 0) {
          pdf.addPage();
          y = 15;
          isContinued = true;
        }
      }
    }

    // Signature (image above label) — right-aligned; asset: /operation-head-signature.png
    const sigW = 48;
    const sigH = 18;
    const sigPad = 4;
    const sigBlockH = 6 + sigH + 7 + 6;
    if (y + sigBlockH + 24 > pageBottom) {
      pdf.addPage();
      y = 15;
    }
    y += 6;
    const sigX = right - sigW - sigPad;
    const signatureImage = await loadImageDataUrl("/operation-head-signature.png");
    safeAddImage(signatureImage, sigX, y, sigW, sigH);
    const opHeadY = y + sigH + 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Operation Head", right - sigPad, opHeadY, { align: "right" });

    const footerY = Math.max(opHeadY + 10, pageBottom - 10);
    pdf.setDrawColor(225, 228, 234);
    pdf.line(left, footerY - 8, right, footerY - 8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(30, 64, 175);
    pdf.text("Thank you for your business!", (left + right) / 2, footerY - 3, {
      align: "center",
    });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${company.name} - your technology partner`, (left + right) / 2, footerY + 1, {
      align: "center",
    });
    const footerLogo = await loadImageDataUrl("/fedhub-logo.png");
    safeAddImage(footerLogo, right - 12, footerY - 8, 8, 8);

    pdf.save(`${purchase.poNumber || "purchase-order"}.pdf`);
    toast.success("Purchase order downloaded");
  } catch (err: any) {
    console.error("Failed to generate purchase order PDF", err);
    toast.error("Failed to download purchase order", {
      description: err?.message ? String(err.message) : "Please try again",
    });
  }
}

export async function downloadDeliveryChallanPDF(
  purchase: {
    poNumber: string;
    createdAt?: string | Date;
    date?: string | Date;
    items?: Array<{
      name: string;
      model?: string;
      quantity?: number;
      uom?: string;
    }>;
    notes?: string;
  },
  supplier?: Supplier,
  settings?: AppSettings | null
) {
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const company = {
      name: settings?.companyName || "FedHub Software Solutions",
      address:
        settings?.companyAddress ||
        "P No 69,70 Gokula Nandhana, Gokul Nagar, Hosur, Krishnagiri-DT, Tamil Nadu, India-635109",
      email: settings?.companyEmail || "info@fedhubsoftware.com",
      phone: settings?.companyPhone || "+91 9003285428",
      gst: settings?.companyGST || "33CUUPA9347J1Z4",
      pan: settings?.companyPAN || "AAJFF8051D",
      msme: settings?.companyMSME || "UDYAM-TN-11-0105606",
    };

    const left = 10;
    const right = 200;
    let y = 12;
    const pageBottom = 285;
    const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString("en-GB") : "-");
    const loadImageDataUrl = async (path: string): Promise<string | null> => {
      try {
        const res = await fetch(path);
        const blob = await res.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return dataUrl;
      } catch {
        return null;
      }
    };
    const safeAddImage = (
      dataUrl: string | null,
      x: number,
      yy: number,
      w: number,
      h: number
    ) => {
      if (!dataUrl) return;
      try {
        const format = dataUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
        pdf.addImage(dataUrl, format, x, yy, w, h);
      } catch (imageErr) {
        console.warn("Skipping PDF image due to format/read error", imageErr);
      }
    };
    const drawCard = (x: number, yy: number, w: number, h: number) => {
      pdf.setDrawColor(220, 226, 235);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, yy, w, h, 2, 2, "FD");
    };

    // PO-styled header card
    drawCard(left, y, right - left, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(13);
    pdf.text(company.name, left + 4, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(9);
    pdf.text(company.address, left + 4, y + 13);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`${company.email} | ${company.phone}`, left + 4, y + 18);
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdf.text(
      `GST: ${company.gst} | PAN: ${company.pan} | MSME: ${company.msme}`,
      left + 4,
      y + 23
    );
    const headerLogo = await loadImageDataUrl("/fedhub-logo.png");
    safeAddImage(headerLogo, right - 20, y + 3, 14, 14);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(14);
    pdf.text(`Delivery Challan`, right - 4, y + 18, { align: "right" });
    pdf.setFontSize(10);
    pdf.text(`PO#: ${purchase.poNumber || "-"}`, right - 4, y + 24, { align: "right" });
    y += 36;

    // Info cards
    const gap = 6;
    const cardW = (right - left - gap) / 2;
    const cardH = 30;
    drawCard(left, y, cardW, cardH);
    drawCard(left + cardW + gap, y, cardW, cardH);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(11);
    pdf.text("Challan Information", left + 3, y + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(55, 65, 81);
    pdf.setFontSize(9);
    pdf.text(`Challan Date: ${fmtDate(new Date())}`, left + 3, y + 12);
    pdf.text(`PO Date: ${fmtDate(purchase.createdAt || purchase.date)}`, left + 3, y + 17);
    pdf.text(`Total Items: ${(purchase.items || []).length}`, left + 3, y + 22);
    pdf.text(`PO#: ${purchase.poNumber || "-"}`, left + 3, y + 27);

    const sx = left + cardW + gap + 3;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(11);
    pdf.text("Supplier Information", sx, y + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(55, 65, 81);
    pdf.setFontSize(9);
    pdf.text(`${supplier?.name || "-"}`, sx, y + 12);
    pdf.text(`${supplier?.address || "Address not available"}`.slice(0, 66), sx, y + 17);
    pdf.text(`${supplier?.contactPerson || "-"} | ${supplier?.phone || "-"}`.slice(0, 66), sx, y + 22);
    pdf.text(`${supplier?.email || "-"}`.slice(0, 66), sx, y + 27);
    y += cardH + 8;

    // Item table (PO-like)
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(88, 28, 135);
    pdf.setFontSize(11);
    pdf.text(`Delivered Items (${(purchase.items || []).length})`, left, y);
    y += 6;

    const col = { item: left, model: 120, qty: 164, uom: 182 };
    const rowH = 7;
    const drawHeader = () => {
      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(120, 135, 155);
      pdf.rect(left, y, right - left, rowH, "FD");
      pdf.line(col.model, y, col.model, y + rowH);
      pdf.line(col.qty, y, col.qty, y + rowH);
      pdf.line(col.uom, y, col.uom, y + rowH);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(31, 41, 55);
      pdf.text("Item Name", col.item + 2, y + 5);
      pdf.text("Model", col.model + 2, y + 5);
      pdf.text("Qty", col.qty + 2, y + 5);
      pdf.text("UOM", col.uom + 2, y + 5);
      y += rowH;
    };

    drawHeader();
    const items = purchase.items || [];
    for (const item of items) {
      const nameLines = pdf.splitTextToSize(String(item.name || "-"), col.model - col.item - 4) as string[];
      const modelLines = pdf.splitTextToSize(String(item.model || "-"), col.qty - col.model - 4) as string[];
      const lines = Math.max(nameLines.length, modelLines.length, 1);
      const h = Math.max(rowH, lines * 4 + 3);

      if (y + h > pageBottom - 35) {
        pdf.addPage();
        y = 15;
        drawHeader();
      }
      pdf.setDrawColor(180, 188, 201);
      pdf.rect(left, y, right - left, h);
      pdf.line(col.model, y, col.model, y + h);
      pdf.line(col.qty, y, col.qty, y + h);
      pdf.line(col.uom, y, col.uom, y + h);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      for (let i = 0; i < lines; i++) {
        const yy = y + 4 + i * 4;
        if (nameLines[i]) pdf.text(nameLines[i], col.item + 2, yy);
        if (modelLines[i]) pdf.text(modelLines[i], col.model + 2, yy);
      }
      pdf.text(String(item.quantity || 0), col.qty + 2, y + 4);
      pdf.text(String(item.uom || "-"), col.uom + 2, y + 4);
      y += h;
    }

    if (purchase.notes) {
      y += 5;
      const noteLines = pdf.splitTextToSize(String(purchase.notes), right - left - 8) as string[];
      const noteH = 8 + noteLines.length * 4;
      if (y + noteH > pageBottom - 30) {
        pdf.addPage();
        y = 15;
      }
      drawCard(left, y, right - left, noteH);
      y += 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(75, 85, 99);
      pdf.text("Notes", left + 3, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      for (const line of noteLines) {
        pdf.text(line, left + 3, y);
        y += 4;
      }
    }

    // Footer signatures
    const signY = Math.max(y + 8, pageBottom - 20);
    pdf.setDrawColor(190, 198, 210);
    pdf.line(left, signY, left + 58, signY);
    pdf.line(right - 58, signY, right, signY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81);
    pdf.text("Receiver Signature", left, signY + 5);
    pdf.text("Authorized Signature", right - 58, signY + 5);

    pdf.save(`${purchase.poNumber || "po"}-delivery-challan.pdf`);
    toast.success("Delivery challan downloaded");
  } catch {
    toast.error("Failed to download delivery challan");
  }
}

