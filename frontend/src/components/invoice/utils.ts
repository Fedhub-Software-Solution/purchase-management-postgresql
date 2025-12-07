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
  companyGST: "33AACCF2123P1Z5",
  companyPAN: "AACCF2123P",
  companyMSME: "UDYAM-TN-06-0012345",
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
    const pageWidth = 150;
    const leftMargin = 15;
    const rightMargin = pageWidth - 15;
    const companyRightMargin = pageWidth - 25; // Company details moved 10mm to the left
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

    // ============================================
    // HEADER: Two-column layout
    // Left: Invoice title, number, status
    // Right: Company info
    // ============================================
    let headerY = 20;
    
    // LEFT SIDE: Invoice title, number, status
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("INVOICE", leftMargin, headerY);
    headerY += 8;

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(invoice.invoiceNumber || "—", leftMargin, headerY);
    headerY += 6;

    // Status badge - support DRAFT (gray), SENT (blue), PAID (green)
    // const status = (invoice.status || "").toString().toUpperCase();
    // const isPaid = status === "PAID";
    // const isSent = status === "SENT";
    
    // Color based on status
    // if (isPaid) {
    //   pdf.setFillColor(34, 197, 94); // Green
    //   pdf.setDrawColor(34, 197, 94);
    // } else if (isSent) {
    //   pdf.setFillColor(59, 130, 246); // Blue
    //   pdf.setDrawColor(59, 130, 246);
    // } else {
    //   pdf.setFillColor(156, 163, 175); // Gray for draft/other
    //   pdf.setDrawColor(156, 163, 175);
    // }
    
    // pdf.setTextColor(255, 255, 255);
    // pdf.setFontSize(10);
    // pdf.setFont("helvetica", "bold");
    // const statusWidth = Math.max((status.length * 2.2) + 8, 25);
    // pdf.roundedRect(leftMargin, headerY - 4, statusWidth, 6, 2, 2, "FD");
    // pdf.text(status, leftMargin + 4, headerY);

    // RIGHT SIDE: Company info - left-aligned
    const companyX = companyRightMargin; // Left starting position for company details
    let companyY = 20;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175); // Blue
    const companyName = company.companyName || DEFAULT_COMPANY.companyName;
    pdf.text(companyName, companyX, companyY);
    companyY += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    
    // Format address properly - split by commas
    const fullAddress = company.companyAddress || DEFAULT_COMPANY.companyAddress;
    const addressParts = fullAddress.split(',').map(s => s.trim()).filter(Boolean);
    addressParts.forEach((part: string) => {
      if (part.length > 0) {
        pdf.text(part, companyX, companyY);
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
    const msmeText = `MSME UDYAN: ${company.companyMSME || DEFAULT_COMPANY.companyMSME}`;
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
    // BILL TO & INVOICE DETAILS (Side by side)
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

    // RIGHT COLUMN: Invoice Details
    const invoiceDetailsX = leftMargin + 95; // Position for right column (adjusted for better spacing)
    let invoiceDetailsY = y;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Details:", invoiceDetailsX, invoiceDetailsY);
    invoiceDetailsY += 5;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    
    const invoiceDate = invoice.createdAt 
      ? (invoice.createdAt instanceof Date 
          ? invoice.createdAt 
          : new Date(invoice.createdAt)
        ).toLocaleDateString('en-GB')
      : "—";
    const dueDate = invoice.dueDate 
      ? (invoice.dueDate instanceof Date 
          ? invoice.dueDate 
          : new Date(invoice.dueDate)
        ).toLocaleDateString('en-GB')
      : "—";
    const paymentTerms = invoice.paymentTerms || 30;
    
    pdf.text(`Invoice Date: ${invoiceDate}`, invoiceDetailsX, invoiceDetailsY);
    invoiceDetailsY += 4;
    pdf.text(`Due Date: ${dueDate}`, invoiceDetailsX, invoiceDetailsY);
    invoiceDetailsY += 4;
    
    if (invoice.purchaseId || (invoice.purchaseIds && invoice.purchaseIds.length > 0)) {
      const poNumbers = invoice.purchaseIds && invoice.purchaseIds.length > 0 
        ? invoice.purchaseIds.join(", ")
        : invoice.purchaseId || "—";
      pdf.text(`Purchase Order: ${poNumbers}`, invoiceDetailsX, invoiceDetailsY);
      invoiceDetailsY += 4;
    }
    
    pdf.text(`Payment Terms: ${paymentTerms} Days`, invoiceDetailsX, invoiceDetailsY);

    // Update y to the maximum of both columns
    y = Math.max(billToY, invoiceDetailsY) + 10;

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

    // Table header
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Description", colX.description, y);
    pdf.text("Model", colX.model, y);
    pdf.text("Qty", colX.qty, y);
    pdf.text("UOM", colX.uom, y);
    pdf.text("Unit Price", colX.unitPrice, y);
    pdf.text("Total", colX.total, y);
    
    // Header line - extend to full table width (from left margin to end of last column + padding)
    const tableEndX = colX.total + 25; // End of Total column + padding for content
    pdf.setDrawColor(200, 200, 200);
    pdf.line(leftMargin, y + 2, tableEndX, y + 2);
    y += 6;

    // Table rows
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
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

      for (let i = 0; i < maxLines; i++) {
        if (descLines[i]) pdf.text(descLines[i], colX.description, y + i * lineHeight);
        if (modelLines[i]) pdf.text(modelLines[i], colX.model, y + i * lineHeight);
        
        if (i === 0) {
          pdf.text(String(it.quantity ?? 0), colX.qty, y);
          pdf.text(it.uom || "", colX.uom, y);
          
          // Unit Price - use consistent font
          pdf.setFont("helvetica", "normal");
          const unitPrice = safeFormatCurrency(it.unitPrice || 0, DEFAULT_CURRENCY);
          pdf.text(unitPrice, colX.unitPrice, y);
          
          // Total - use consistent font (normal, not bold)
          const total = safeFormatCurrency(it.total || 0, DEFAULT_CURRENCY);
          pdf.text(total, colX.total, y);
        }
      }

      y += maxLines * lineHeight + 2;
      
      // Row separator
      if (index < items.length) {
        pdf.setDrawColor(240, 240, 240);
        pdf.line(leftMargin, y - 10, tableEndX, y - 10);
      }
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
    pdf.text(subtotalText, totalsX + totalsW - 20 - subtotalWidth, ty);
    ty += 5;

    pdf.text(`Tax (${settings?.defaultTaxRate || 18}% GST):`, totalsX + 3, ty);
    const taxText = safeFormatCurrency(tax, DEFAULT_CURRENCY);
    const taxWidth = taxText.length * 0.4;
    pdf.text(taxText, totalsX + totalsW - 20.3 - taxWidth, ty);
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
    pdf.text(totalText, totalsX + totalsW - 20 - totalWidth, ty);
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
    y += 15;

    // ============================================
    // FOOTER
    // ============================================
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    const thankYouText = "Thank you for your business!";
    // Center align manually (no align option)
    pdf.text(thankYouText, pageWidth / 2, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    const footerText = `${company.companyName || DEFAULT_COMPANY.companyName} - Your trusted technology partner`;
    // Center align manually
    pdf.text(footerText, pageWidth / 2, y);

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
