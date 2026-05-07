import { toast } from 'sonner';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../../utils/currency';
import type { Invoice, Client } from '../../types';
import type { AppSettings } from '../../lib/api/slices/settings';

export function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "sent":
      return "bg-blue-100 text-blue-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    case "draft":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function calculateInvoiceTotal(
  items: Array<{ total?: number }> = []
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const tax = subtotal * 0.18; // 18% GST
  return { subtotal, tax, total: subtotal + tax };
}

// Default company info (fallback if settings not available)
const DEFAULT_COMPANY = {
  companyName: "FedHub Software Solutions",
  companyEmail: "info@fedhubsoftware.com",
  companyPhone: "+91 9003285428",
  companyAddress: "P No 69,70 Gokula Nandhana, Gokul Nagar, Hosur, Krishnagiri-DT, Tamil Nadu, India-635109",
  companyGST: "33CUUPA9347J1Z4",
  companyPAN: "AAJFF8051D",
  companyMSME: "UDYAM-TN-11-0105606",
};

export async function downloadInvoicePDF(
  invoice: Invoice,
  clients: Client[],
  settings?: AppSettings | null
): Promise<void> {
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Get company info from settings or use defaults
    const company = settings || DEFAULT_COMPANY;
    
    // Always use helvetica font (built-in, no font metrics issues)
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    // Quick sanity checks
    if (!invoice) {
      const msg = "No invoice provided to downloadInvoicePDF";
      console.error("[PDF]", msg);
      toast.error(msg);
      return;
    }
    if (!Array.isArray(invoice.items)) {
      console.warn(
        "[PDF] invoice.items is not array; coercing to []",
        invoice.items
      );
    }

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
        console.warn("[InvoicePDF] image render skipped", imageErr);
      }
    };

    // Defensive wrapper for formatCurrency - ensures INR symbol displays correctly in PDF
    // jsPDF doesn't support ₹ symbol in default fonts, so we use "Rs." instead
    const safeFormatCurrency = (val: any, cur?: string) => {
      try {
        const currencyCode = cur || DEFAULT_CURRENCY;
        const num = Number(val || 0);
        const formatted = num.toLocaleString('en-IN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
        // For PDF, use "Rs." instead of ₹ symbol (jsPDF doesn't support ₹ in default fonts)
        if (currencyCode === 'INR' || currencyCode === DEFAULT_CURRENCY) {
          return `Rs.${formatted}`;
        }
        // For other currencies, use the symbol
        const symbol = getCurrencySymbol(currencyCode);
        return `${symbol}${formatted}`;
      } catch (e) {
        console.error("[PDF] formatCurrency error", e);
        const n = Number(val || 0).toFixed(2);
        return `Rs.${n}`;
      }
    };

    // Layout constants (A4: 210mm x 297mm)
    const fullPageWidth =
      (pdf as any)?.internal?.pageSize?.getWidth?.() ??
      (pdf as any)?.internal?.pageSize?.width ??
      210;
    const fullPageHeight =
      (pdf as any)?.internal?.pageSize?.getHeight?.() ??
      (pdf as any)?.internal?.pageSize?.height ??
      297;
    const pageWidth = fullPageWidth;
    const leftMargin = 15;
    const rightMargin = pageWidth - 15;
    const companyRightMargin = pageWidth - 82;
    let y = 20;

    // Helper to wrap text - pure character-based approach (NO font metrics)
    const wrapText = (text: string, maxWidth: number) => {
      const textStr = String(text || "");
      if (!textStr) return [""];
      
      // Character-based wrapping: approximate 1.2mm per character for helvetica
      // This completely avoids font metric access
      const charsPerLine = Math.max(1, Math.floor(maxWidth / 1.2));
      
      if (textStr.length <= charsPerLine) {
        return [textStr];
      }
      
      // Split by words first for better readability
      const words = textStr.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= charsPerLine) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          // If word itself is too long, split it character by character
          if (word.length > charsPerLine) {
            for (let i = 0; i < word.length; i += charsPerLine) {
              lines.push(word.slice(i, i + charsPerLine));
            }
            currentLine = "";
          } else {
            currentLine = word;
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines.length > 0 ? lines : [textStr];
    };

    const invoiceDate = invoice.createdAt
      ? (invoice.createdAt instanceof Date
          ? invoice.createdAt
          : new Date(invoice.createdAt)
        ).toLocaleDateString("en-GB")
      : "—";
    const dueDate = invoice.dueDate
      ? (invoice.dueDate instanceof Date
          ? invoice.dueDate
          : new Date(invoice.dueDate)
        ).toLocaleDateString("en-GB")
      : "—";
    const paymentTerms = invoice.paymentTerms || 30;

    // ============================================
    // HEADER: Two-column layout
    // Left: Invoice title + invoice details
    // Right: Company info + logo
    // ============================================
    let headerY = 20;
    
    // LEFT SIDE: Invoice title, number, status
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("INVOICE", leftMargin, headerY);
    headerY += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`Invoice No: ${invoice.invoiceNumber || "—"}`, leftMargin, headerY);
    headerY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Invoice Date: ${invoiceDate}`, leftMargin, headerY);
    headerY += 4.5;
    pdf.text(`Due Date: ${dueDate}`, leftMargin, headerY);
    headerY += 4.5;
    pdf.text(`Payment Terms: ${paymentTerms} Days`, leftMargin, headerY);
    headerY += 4.5;

    // RIGHT SIDE: Company info - left-aligned
    const companyX = companyRightMargin;
    let companyY = 20;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175); // Blue
    const companyName = company.companyName || DEFAULT_COMPANY.companyName;
    pdf.text(companyName, companyX, companyY);
    const headerLogo = await loadImageDataUrl("/fedhub-logo.png");
    safeAddImage(headerLogo, fullPageWidth - 24, 4, 12, 12);
    companyY += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    // Keep FedHub address in the same visual format as requested.
    const fullAddress = (company.companyAddress || DEFAULT_COMPANY.companyAddress)
      .replace(/Tamil Nadu/gi, "Tamilnadu")
      .replace(/\s*-\s*/g, "-");
    const addressLines = pdf.splitTextToSize(fullAddress, 58) as string[];
    addressLines.forEach((line: string) => {
      if (line) {
        pdf.text(line, companyX, companyY);
        companyY += 4;
      }
    });

    companyY += 2;
    const emailText = `Email: ${company.companyEmail || DEFAULT_COMPANY.companyEmail}`;
    pdf.text(emailText, companyX, companyY);
    companyY += 4;
    const phoneText = `Phone: ${company.companyPhone || DEFAULT_COMPANY.companyPhone}`;
    pdf.text(phoneText, companyX, companyY);
    companyY += 4;
    const gstText = `GST: ${company.companyGST || DEFAULT_COMPANY.companyGST}`;
    pdf.text(gstText, companyX, companyY);
    companyY += 4;
    const panText = `PAN: ${company.companyPAN || DEFAULT_COMPANY.companyPAN}`;
    pdf.text(panText, companyX, companyY);
    companyY += 4;
    const msmeText = `MSME: ${company.companyMSME || DEFAULT_COMPANY.companyMSME}`;
    pdf.text(msmeText, companyX, companyY);

    companyY += 4;

    // Full line below header section - extend to full page width
    const lineStartX = 15; // Small margin from left edge
    const lineEndX = 200 - 5; // Small margin from right edge
    pdf.setDrawColor(200, 200, 200);
    pdf.line(lineStartX, companyY + 2, lineEndX, companyY + 2);
    companyY += 5;

    // Set Y position for next section (use the lower of the two)
    y = Math.max(headerY + 8, companyY + 5);

    // ============================================
    // BILL TO + SHIPPING ADDRESS (side-by-side)
    // ============================================
    // Ensure client exists
    let client: any = null;
    try {
      client = (clients || []).find((c) => c.id === invoice.clientId);
      if (!client)
        throw new Error(
          "Client not found for invoice.clientId=" + invoice.clientId
        );
    } catch (e) {
      console.error("[PDF] client resolution error", e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      toast.error(
        "Client information not found for invoice: " + errorMsg
      );
      return;
    }

    // LEFT COLUMN: Bill To
    let billToY = y;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Bill To:", leftMargin, billToY);
    billToY += 5;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(client.company || "—", leftMargin, billToY);
    billToY += 5;
    pdf.text(`Contact Person: ${client.contactPerson || "—"}`, leftMargin, billToY);
    billToY += 5;
    pdf.text(`Email: ${client.email || "—"}`, leftMargin, billToY);
    billToY += 5;
    pdf.text(`Phone: ${client.phone || "—"}`, leftMargin, billToY);
    billToY += 5;

    const clientAddress = client.billingAddress || {};
    const clientAddrLines = [
      clientAddress.street || "",
      `${clientAddress.city || ""}, ${clientAddress.state || ""}`,
      `${clientAddress.postalCode || ""}, ${clientAddress.country || "India"}`
    ].filter(Boolean);
    
    clientAddrLines.forEach((line: string) => {
      pdf.text(line, leftMargin, billToY);
      billToY += 5;
    });

    if (client.gstNumber) {
      billToY += 2;
      pdf.text(`GST: ${client.gstNumber}`, leftMargin, billToY);
      billToY += 5;
    }

    // RIGHT COLUMN: Shipping Address
    const shippingX = leftMargin + 100;
    let shippingY = y;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Shipping Address:", shippingX, shippingY);
    shippingY += 5;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(client.company || "—", shippingX, shippingY);
    shippingY += 5;
    const shippingContact =
      (client as any)?.shippingContactPerson ||
      (client as any)?.shippingContact ||
      client.contactPerson ||
      "—";
    const shippingPhone = (client as any)?.shippingPhone || client.phone || "—";
    const shippingEmail = (client as any)?.shippingEmail || client.email || "—";
    pdf.text(`Contact: ${shippingContact}`, shippingX, shippingY);
    shippingY += 5;
    pdf.text(`Email: ${shippingEmail}`, shippingX, shippingY);
    shippingY += 5;
    pdf.text(`Phone: ${shippingPhone}`, shippingX, shippingY);
    shippingY += 5;
    const shippingAddress = (client as any)?.shippingAddress || client.billingAddress || {};
    const shippingAddrLines = [
      shippingAddress.street || "",
      `${shippingAddress.city || ""}, ${shippingAddress.state || ""}`.replace(/^,\s*|,\s*$/g, ""),
      `${shippingAddress.postalCode || ""}, ${shippingAddress.country || "India"}`.replace(
        /^,\s*|,\s*$/g,
        ""
      ),
    ].filter(Boolean);
    shippingAddrLines.forEach((line: string) => {
      pdf.text(line, shippingX, shippingY);
      shippingY += 5;
    });

    y = Math.max(billToY, shippingY) + 10;

    // ============================================
    // ITEMS & SERVICES TABLE
    // ============================================
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(147, 51, 234); // Purple
    pdf.text("Items & Services:", leftMargin, y);
    y += 8;

    // Table column positions (removed Currency and Supplier columns)
    // Description and Model columns reduced to half size
    const colX = {
      description: leftMargin,
      model: leftMargin + 70,  // Reduced from 70 to 35 (half)
      qty: leftMargin + 90,     // Adjusted from 110 to 55
      uom: leftMargin + 105,     // Adjusted from 125 to 70
      unitPrice: leftMargin + 125, // Adjusted from 145 to 90
      total: leftMargin + 155,   // Adjusted from 175 to 120
    };
    const tableEndX = rightMargin;

    // Table header (match invoice/challan style: light gray with dark text)
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(242, 244, 248);
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(leftMargin, y - 4, tableEndX - leftMargin, 6, "FD");
    [colX.model - 2, colX.qty - 2, colX.uom - 2, colX.unitPrice - 2, colX.total - 2].forEach((x) => {
      pdf.line(x, y - 4, x, y + 2);
    });
    pdf.setTextColor(0, 0, 0);
    pdf.text("Description", colX.description, y);
    pdf.text("Model", colX.model, y);
    pdf.text("Qty", colX.qty, y);
    pdf.text("UOM", colX.uom, y);
    pdf.text("Unit Price", colX.unitPrice, y);
    pdf.text("Total", colX.total, y);
    
    // Header bottom line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(leftMargin, y + 2, tableEndX, y + 2);
    y += 6;

    // Table rows (tabular grid with vertical separators)
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    const items = invoice.items || [];
    const lineHeight = 4;
    const maxY = 250; // Start new page before this

    items.forEach((it: any, index: number) => {
      if (y > maxY) {
        pdf.addPage();
        y = 30;
      }

      const descLines = wrapText(it.name || it.description || "", 32.5); // Reduced from 65 to 32.5 (half)
      const modelLines = wrapText(it.model || "NA", 10); // Reduced from 20 to 10 (half)
      const maxLines = Math.max(descLines.length, modelLines.length, 1);

      const rowHeight = maxLines * lineHeight + 2;
      pdf.setDrawColor(220, 220, 220);
      pdf.rect(leftMargin, y - 3, tableEndX - leftMargin, rowHeight);
      [colX.model - 2, colX.qty - 2, colX.uom - 2, colX.unitPrice - 2, colX.total - 2].forEach((x) => {
        pdf.line(x, y - 3, x, y - 3 + rowHeight);
      });
      for (let i = 0; i < maxLines; i++) {
        if (descLines[i]) pdf.text(descLines[i], colX.description, y + i * lineHeight);
        if (modelLines[i]) pdf.text(modelLines[i], colX.model, y + i * lineHeight);
        
        if (i === 0) {
          pdf.text(String(it.quantity ?? 0), colX.qty, y);
          pdf.text(it.uom || "", colX.uom, y);
          
          // Unit Price - use consistent font
          pdf.setFont("helvetica", "normal");
          const unitPrice = safeFormatCurrency(it.unitPrice || 0, DEFAULT_CURRENCY);
          pdf.text(unitPrice, colX.total - 4, y, { align: "right" });
          
          // Total - use consistent font (normal, not bold)
          const total = safeFormatCurrency(it.total || 0, DEFAULT_CURRENCY);
          pdf.text(total, tableEndX - 2, y, { align: "right" });
        }
      }

      y += rowHeight;
    });

    // ============================================
    // PAYMENT SUMMARY
    // ============================================
    y += 5;
    const totalsX = leftMargin + 110; // Moved 20mm to the left (was 120)
    const totalsW = 70;
    
    const subtotal = invoice.subtotal || 0;
    const taxRate = (settings?.defaultTaxRate || 18) / 100;
    const tax = invoice.tax || (subtotal * taxRate);
    const total = invoice.total || (subtotal + tax);

    pdf.setFillColor(245, 245, 245);
    pdf.setDrawColor(200, 200, 200);
    const summaryHeight = 20;
    pdf.rect(totalsX, y, totalsW, summaryHeight, "FD");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    let ty = y + 5;
    
    pdf.text("Subtotal:", totalsX + 3, ty);
    const subtotalText = safeFormatCurrency(subtotal, DEFAULT_CURRENCY);
    // Right align: calculate text width and position from right edge (moved left by increasing padding)
    const subtotalWidth = subtotalText.length * 0.4;
    pdf.text(subtotalText, totalsX + totalsW - 3, ty, { align: "right" });
    ty += 5;

    pdf.text(`Tax (${settings?.defaultTaxRate || 18}% GST):`, totalsX + 3, ty);
    const taxText = safeFormatCurrency(tax, DEFAULT_CURRENCY);
    const taxWidth = taxText.length * 0.4;
    pdf.text(taxText, totalsX + totalsW - 3, ty, { align: "right" });
    ty += 5;

    // Separator line before total
    pdf.setDrawColor(200, 200, 200);
    pdf.line(totalsX, ty, totalsX + totalsW, ty);
    ty += 4;

    // Total Amount - use consistent font (normal, same as others)
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Total Amount:", totalsX + 3, ty);
    const totalText = safeFormatCurrency(total, DEFAULT_CURRENCY);
    const totalWidth = totalText.length * 0.4;
    pdf.text(totalText, totalsX + totalsW - 3, ty, { align: "right" });
    y = ty + 8;

    // Note about currency
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Note: All amounts are in ${DEFAULT_CURRENCY} (Base Currency).`, leftMargin, y);
    y += 10;

    // ============================================
    // PAYMENT INSTRUCTIONS
    // ============================================
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Payment Instructions:", leftMargin, y);
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Payment is due within ${paymentTerms} days of the invoice date.`, leftMargin, y);
    y += 5;
    pdf.text(`Reference invoice number ${invoice.invoiceNumber || "—"} with your payment.`, leftMargin, y);
    y += 10;

    // ============================================
    // TERMS & CONDITIONS
    // ============================================
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Terms & Conditions:", leftMargin, y);
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Tax Rate: ${settings?.defaultTaxRate || 18}% GST as applicable per Indian tax regulations.`, leftMargin, y);
    y += 5;
    pdf.text("Late payments may incur additional charges.", leftMargin, y);
    y += 10;

    // ============================================
    // OPERATION HEAD SIGNATURE (below terms)
    // ============================================
    if (y > 240) {
      pdf.addPage();
      y = 20;
    }
    y += 2;
    const signLineY = y + 16;
    const signLabelX = rightMargin - 42;
    const operationSign = await loadImageDataUrl("/operation-head-signature.png");
    safeAddImage(operationSign, signLabelX, y, 36, 10);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(signLabelX, signLineY, rightMargin, signLineY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81);
    pdf.text("Operation Head", rightMargin, signLineY + 4, { align: "right" });
    y = signLineY + 12;

    // ============================================
    // FOOTER
    // ============================================
    const footerY = fullPageHeight - 20;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    const thankYouText = "Thank you for your business!";
    pdf.text(thankYouText, fullPageWidth / 2, footerY, { align: "center" });
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    const footerText = `${company.companyName || DEFAULT_COMPANY.companyName} - Your trusted technology partner`;
    pdf.text(footerText, fullPageWidth / 2, footerY + 5, { align: "center" });
    const footerLogo = await loadImageDataUrl("/fedhub-logo.png");
    safeAddImage(footerLogo, fullPageWidth - 18, footerY - 2, 10, 10);

    // ============================================
    // SAVE PDF
    // ============================================
    try {
      pdf.save(`${invoice.invoiceNumber || "invoice"}.pdf`);
      toast.success(`Invoice ${invoice.invoiceNumber} downloaded successfully!`);
    } catch (saveErr) {
      console.error("[PDF] pdf.save failed", saveErr);
      const saveErrMsg = saveErr instanceof Error ? saveErr.message : String(saveErr);
      toast.error("Failed to save PDF: " + saveErrMsg);
    }
  } catch (outerErr) {
    console.error("[PDF] outer exception", outerErr);
    const outerErrMsg = outerErr instanceof Error ? outerErr.message : String(outerErr);
    toast.error("Failed to generate PDF: " + outerErrMsg);
  }
}

export async function downloadInvoiceDeliveryChallanPDF(
  invoice: Invoice,
  clients: Client[],
  settings?: AppSettings | null
): Promise<void> {
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const company = settings || DEFAULT_COMPANY;
    const client = (clients || []).find((c) => c.id === invoice.clientId);
    const invoiceNo = (invoice.invoiceNumber || "").toString().trim();
    const rawSuffix = invoiceNo
      ? invoiceNo.replace(/^INV[-/#\s]*/i, "").replace(/\s+/g, "")
      : String(invoice.id || "").slice(-6).toUpperCase() || new Date().getTime().toString().slice(-6);
    // Keep DC number/file-system safe
    const invoiceSuffix = String(rawSuffix).replace(/[^A-Za-z0-9-]/g, "");
    const dcNumber = `DC-${invoiceSuffix || "0001"}`;
    const pageWidth = 150;
    const fullPageWidth =
      (pdf as any)?.internal?.pageSize?.getWidth?.() ??
      (pdf as any)?.internal?.pageSize?.width ??
      210;
    const left = 15;
    const right = pageWidth - 15;
    const companyRightMargin = pageWidth - 25;
    let y = 20;
    const pageBottom = 285;
    const fmtDate = (v: any) =>
      v ? new Date(v).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB");
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

    // Header (invoice-like hierarchy)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text("DELIVERY CHALLAN", left, y);
    y += 8;
    pdf.setFontSize(12);
    pdf.text(`DC No: ${dcNumber}`, left, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Challan Date: ${fmtDate(new Date())}`, left, y);
    y += 4.5;
    pdf.text(`Invoice Date: ${fmtDate(invoice.createdAt)}`, left, y);
    y += 4.5;

    const companyX = companyRightMargin;
    let companyY = 20;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(30, 64, 175);
    pdf.text(company.companyName || DEFAULT_COMPANY.companyName, companyX, companyY);
    companyY += 6;
    const headerLogo = await loadImageDataUrl("/fedhub-logo.png");
    if (headerLogo) {
      // Place logo at the top-right header area
      try {
        pdf.addImage(headerLogo, "PNG", fullPageWidth - 26, 8, 16, 8);
      } catch (e) {
        console.warn("[DeliveryChallan] header logo render failed", e);
      }
    }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const addressLines = pdf.splitTextToSize(
      company.companyAddress || DEFAULT_COMPANY.companyAddress,
      56
    ) as string[];
    addressLines.forEach((line) => {
      pdf.text(line, companyX, companyY);
      companyY += 4;
    });
    pdf.text(`Email: ${company.companyEmail || DEFAULT_COMPANY.companyEmail}`, companyX, companyY);
    companyY += 4;
    pdf.text(`Phone: ${company.companyPhone || DEFAULT_COMPANY.companyPhone}`, companyX, companyY);
    companyY += 4;
    pdf.text(`GST: ${company.companyGST || DEFAULT_COMPANY.companyGST}`, companyX, companyY);
    companyY += 4;
    pdf.text(`PAN: ${company.companyPAN || DEFAULT_COMPANY.companyPAN}`, companyX, companyY);
    companyY += 4;
    pdf.text(`MSME: ${company.companyMSME || DEFAULT_COMPANY.companyMSME}`, companyX, companyY);

    const lineY = Math.max(y, companyY) + 3;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, lineY, 200 - 5, lineY);
    y = lineY + 8;

    // Bill To + Shipping Address (side-by-side)
    let leftColY = y;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Bill To:", left, leftColY);
    leftColY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(client?.company || "—", left, leftColY);
    leftColY += 4.5;
    pdf.text(`Contact: ${client?.contactPerson || "—"}`, left, leftColY);
    leftColY += 4.5;
    pdf.text(`Email: ${client?.email || "—"}`, left, leftColY);
    leftColY += 4.5;
    pdf.text(`Phone: ${client?.phone || "—"}`, left, leftColY);
    leftColY += 4.5;
    const billingAddress = client?.billingAddress || {};
    const billingLines = [
      billingAddress.street || "",
      `${billingAddress.city || ""}, ${billingAddress.state || ""}`.replace(/^,\s*|,\s*$/g, ""),
      `${billingAddress.postalCode || ""}, ${billingAddress.country || "India"}`.replace(
        /^,\s*|,\s*$/g,
        ""
      ),
    ].filter(Boolean);
    billingLines.forEach((line: string) => {
      pdf.text(line, left, leftColY);
      leftColY += 4.5;
    });

    let rightColY = y;
    const detailsX = left + 95;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Shipping Address:", detailsX, rightColY);
    rightColY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const shippingAddress = client?.shippingAddress || client?.billingAddress || {};
    const shippingContact =
      (client as any)?.shippingContactPerson || (client as any)?.shippingContact || client?.contactPerson || "—";
    const shippingPhone = (client as any)?.shippingPhone || client?.phone || "—";
    const shippingEmail = (client as any)?.shippingEmail || client?.email || "—";
    pdf.text(client?.company || "—", detailsX, rightColY);
    rightColY += 4.5;
    pdf.text(`Contact: ${shippingContact}`, detailsX, rightColY);
    rightColY += 4.5;
    pdf.text(`Email: ${shippingEmail}`, detailsX, rightColY);
    rightColY += 4.5;
    pdf.text(`Phone: ${shippingPhone}`, detailsX, rightColY);
    rightColY += 4.5;
    const shippingLines = [
      shippingAddress.street || "",
      `${shippingAddress.city || ""}, ${shippingAddress.state || ""}`.replace(/^,\s*|,\s*$/g, ""),
      `${shippingAddress.postalCode || ""}, ${shippingAddress.country || "India"}`.replace(
        /^,\s*|,\s*$/g,
        ""
      ),
    ].filter(Boolean);
    shippingLines.forEach((line: string) => {
      pdf.text(line, detailsX, rightColY);
      rightColY += 4.5;
    });

    y = Math.max(leftColY, rightColY) + 8;

    // Items section
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(147, 51, 234);
    pdf.text("Items & Services:", left, y);
    y += 7;

    const col = { item: left, model: left + 70, qty: left + 90, uom: left + 105, unitPrice: left + 125, total: left + 155 };
    const tableRight = col.total + 25;
    const rowH = 7;

    const drawHeader = () => {
      pdf.setFillColor(242, 244, 248);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(left, y, tableRight - left, rowH, "FD");
      [col.model, col.qty, col.uom, col.unitPrice, col.total].forEach((x) => {
        pdf.line(x, y, x, y + rowH);
      });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Description", col.item + 2, y + 5);
      pdf.text("Model", col.model + 2, y + 5);
      pdf.text("Qty", col.qty + 2, y + 5);
      pdf.text("UOM", col.uom + 2, y + 5);
      pdf.text("Unit Price", col.unitPrice + 2, y + 5);
      pdf.text("Total", col.total + 2, y + 5);
      y += rowH;
    };

    const safeFormatCurrency = (val: any) => {
      const num = Number(val || 0);
      return `Rs.${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    drawHeader();
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    for (const item of items) {
      const descLines = pdf.splitTextToSize(String((item as any).name || "-"), col.model - col.item - 4) as string[];
      const modelLines = pdf.splitTextToSize(String((item as any).model || "-"), col.qty - col.model - 4) as string[];
      const lines = Math.max(descLines.length, modelLines.length, 1);
      const h = Math.max(rowH, lines * 4 + 3);
      if (y + h > pageBottom - 28) {
        pdf.addPage();
        y = 20;
        drawHeader();
      }

      pdf.setDrawColor(230, 230, 230);
      pdf.rect(left, y, tableRight - left, h);
      [col.model, col.qty, col.uom, col.unitPrice, col.total].forEach((x) => {
        pdf.line(x, y, x, y + h);
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      for (let i = 0; i < lines; i++) {
        const yy = y + 4 + i * 4;
        if (descLines[i]) pdf.text(descLines[i], col.item + 2, yy);
        if (modelLines[i]) pdf.text(modelLines[i], col.model + 2, yy);
      }
      pdf.text(String((item as any).quantity || 0), col.qty + 2, y + 4);
      pdf.text(String((item as any).uom || "-"), col.uom + 2, y + 4);
      pdf.text(safeFormatCurrency((item as any).unitPrice || 0), col.total - 2, y + 4, {
        align: "right",
      });
      pdf.text(safeFormatCurrency((item as any).total || 0), tableRight - 2, y + 4, {
        align: "right",
      });
      y += h;
    }

    // Summary rows directly below table, aligned under Unit Price/Total columns
    const subtotal = Number(invoice.subtotal || 0);
    const tax = Number(invoice.tax || subtotal * ((settings?.defaultTaxRate || 18) / 100));
    const total = Number(invoice.total || subtotal + tax);
    y += 4;
    if (y > pageBottom - 32) {
      pdf.addPage();
      y = 20;
    }
    const amountRightX = tableRight - 2;
    const labelRightX = col.total - 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(col.unitPrice, y - 1, tableRight, y - 1);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Subtotal:", labelRightX, y + 4, { align: "right" });
    pdf.text(safeFormatCurrency(subtotal), amountRightX, y + 4, { align: "right" });
    pdf.text(`GST (${settings?.defaultTaxRate || 18}%):`, labelRightX, y + 9, { align: "right" });
    pdf.text(safeFormatCurrency(tax), amountRightX, y + 9, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text("Total:", labelRightX, y + 14, { align: "right" });
    pdf.text(safeFormatCurrency(total), amountRightX, y + 14, { align: "right" });
    pdf.line(col.unitPrice, y + 16, tableRight, y + 16);
    y += 20;

    if (invoice.notes) {
      y += 6;
      if (y > pageBottom - 24) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Additional Notes:", left, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      const noteLines = pdf.splitTextToSize(String(invoice.notes), tableRight - left) as string[];
      noteLines.forEach((line) => {
        if (y > pageBottom - 22) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, left, y);
        y += 4;
      });
    }

    // Footer/signatures (invoice-like closing)
    // Keep extra gap from totals so the total line remains fully visible.
    const signY = Math.max(y + 16, pageBottom - 24);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(left, signY, left + 50, signY);
    pdf.line(right - 50, signY, right, signY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Received By", left, signY + 5);
    const signImgX = fullPageWidth - 50;
    const signImgY = signY - 12;
    const signImgW = 36;
    const signImgH = 10;
    const authorizedSign = await loadImageDataUrl("/operation-head-signature.png");
    if (authorizedSign) {
      // Place signature at the right-side marked area (above Authorized Signature line)
      try {
        pdf.addImage(authorizedSign, "PNG", signImgX, signImgY, signImgW, signImgH);
      } catch (e) {
        console.warn("[DeliveryChallan] authorized sign render failed", e);
      }
    }
    pdf.text("Authorized Signature", signImgX, signImgY + signImgH + 6);

    const footerY = signY + 12;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    pdf.text("Thank you for your business!", fullPageWidth / 2, footerY, { align: "center" });
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `${company.companyName || DEFAULT_COMPANY.companyName} - Your trusted technology partner`,
      fullPageWidth / 2,
      footerY + 5,
      { align: "center" }
    );
    const footerLogo = await loadImageDataUrl("/fedhub-logo.png");
    if (footerLogo) {
      // Place logo at bottom-right marked area
      try {
        pdf.addImage(footerLogo, "PNG", fullPageWidth - 18, footerY - 2, 12, 6);
      } catch (e) {
        console.warn("[DeliveryChallan] footer logo render failed", e);
      }
    }

    pdf.save(`${dcNumber}.pdf`);
    toast.success("Delivery challan downloaded");
  } catch (err: any) {
    console.error("[DeliveryChallan] generation failed", err);
    const msg = err?.message || String(err) || "Unknown error";
    // Fallback: ensure user still gets a DC file even if advanced layout fails.
    try {
      const { jsPDF } = await import("jspdf");
      const fallback = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      fallback.setFont("helvetica", "bold");
      fallback.setFontSize(16);
      fallback.text("DELIVERY CHALLAN", 15, 20);
      fallback.setFontSize(11);
      fallback.text(`DC No: ${dcNumber}`, 15, 28);
      fallback.setFont("helvetica", "normal");
      fallback.setFontSize(10);
      fallback.text(`Invoice Number: ${invoice?.invoiceNumber || "-"}`, 15, 36);
      fallback.text(`Client: ${clients?.find((c) => c.id === invoice?.clientId)?.company || "-"}`, 15, 43);
      fallback.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 15, 50);
      fallback.text("Items:", 15, 60);
      const lines = (Array.isArray(invoice?.items) ? invoice.items : [])
        .slice(0, 20)
        .map((it: any, i: number) => `${i + 1}. ${it?.name || "-"} | Qty: ${it?.quantity || 0} | UOM: ${it?.uom || "-"}`);
      let yy = 67;
      for (const line of lines) {
        fallback.text(line, 15, yy);
        yy += 6;
      }
      fallback.save(`${dcNumber}.pdf`);
      toast.error(`DC styled template failed (${msg}). Downloaded basic DC instead.`);
    } catch (fallbackErr: any) {
      const fallbackMsg = fallbackErr?.message || String(fallbackErr) || "Unknown fallback error";
      toast.error(`Failed to download delivery challan: ${msg}; fallback failed: ${fallbackMsg}`);
    }
  }
}
