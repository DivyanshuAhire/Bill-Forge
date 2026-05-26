import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Utility: convert millimeters to PDF points (1 mm ≈ 2.8345 pt)
const mmToPt = (mm: number) => mm * 2.8345;

/**
 * Generates a PDF invoice based on a JSON template and data.
 * @param template The invoice layout template (the object supplied by the user).
 * @param data    An object containing invoiceData, companyData, and any other needed sections.
 * @returns Uint8Array containing the PDF bytes.
 */
export async function generateInvoicePdf(
  template: any,
  data: { invoiceData: any; companyData: any }
): Promise<Uint8Array> {
  const { invoiceData, companyData } = data;

  // Create a new PDF and add a page with the requested size/orientation
  const pdfDoc = await PDFDocument.create();
  const pageSize = template.page;
  const widthPt = mmToPt(pageSize.widthMm);
  const heightPt = mmToPt(pageSize.heightMm);
  const page = pdfDoc.addPage([widthPt, heightPt]);

  // Load fonts
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper to fetch a style definition
  const getStyle = (key: string) => {
    const style = template.styles?.[key] ?? {};
    return {
      font: style.font === "Helvetica-Bold" ? boldFont : regularFont,
      size: style.size ?? 8,
      color: rgb(0, 0, 0),
      align: style.align ?? "left",
    };
  };

  // Simple text drawer respecting alignment
  const drawText = (
    text: string,
    x: number,
    y: number,
    styleKey: string = "normal"
  ) => {
    const { font, size, color, align } = getStyle(styleKey);
    const textWidth = font.widthOfTextAtSize(text, size);
    let drawX = x;
    if (align === "center") {
      drawX = x - textWidth / 2;
    } else if (align === "right") {
      drawX = x - textWidth;
    }
    page.drawText(text, { x: drawX, y, size, font, color });
  };

  // ------------------------------------------------------------------
  // Render each block defined in the template
  // ------------------------------------------------------------------
  const blocks = template.blocks ?? {};

  for (const [blockName, block] of Object.entries<any>(blocks)) {
    const baseX = mmToPt(block.x);
    const baseY = heightPt - mmToPt(block.y); // PDF origin is bottom‑left
    const wPt = mmToPt(block.w);
    const hPt = mmToPt(block.h);

    switch (blockName) {
      case "invoiceTitle": {
        drawText(block.text, baseX + wPt / 2, baseY, block.style);
        break;
      }
      case "sellerSection":
      case "consigneeSection":
      case "buyerSection": {
        // Render each field vertically
        let curY = baseY;
        const lineHeight = getStyle("normal").size + 2;
        for (const fieldPath of block.fields) {
          const value = fieldPath
            .split(".")
            .reduce((acc: any, key: string) => acc?.[key],
            data;
          if (value) {
            drawText(String(value), baseX, curY, "normal");
            curY -= lineHeight;
          }
        }
        break;
      }
      case "invoiceMeta": {
        let curY = baseY;
        const lineHeight = getStyle("normal").size + 2;
        for (const row of block.rows) {
          const label = row.label;
          const fieldVal = invoiceData[row.field] ?? "";
          drawText(`${label}: ${fieldVal}`, baseX, curY, "normal");
          curY -= lineHeight;
        }
        break;
      }
      case "itemsTable": {
        // Table header
        let curY = baseY;
        const headerStyle = "bold";
        const columnX: number[] = [];
        let accX = baseX;
        for (const col of block.columns) {
          columnX.push(accX);
          accX += mmToPt(col.width);
        }
        block.columns.forEach((col: any, idx: number) => {
          drawText(col.title, columnX[idx], curY, headerStyle);
        });
        // Divider line under header
        page.drawLine({
          start: { x: baseX, y: curY - 2 },
          end: { x: baseX + wPt, y: curY - 2 },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
        curY -= mmToPt(6);
        // Rows – dynamicRows flag means iterate invoiceData.items
        if (block.dynamicRows && Array.isArray(invoiceData.items)) {
          invoiceData.items.forEach((item: any, idx: number) => {
            block.columns.forEach((col: any, colIdx: number) => {
              let txt = "";
              switch (col.field) {
                case "description":
                  txt = item.description ?? item.productName ?? "";
                  break;
                case "hsn":
                  txt = item.hsn ?? "";
                  break;
                case "qty":
                  txt = `${item.qty ?? ""} ${item.unit ?? ""}`;
                  break;
                case "rate":
                  txt = `${item.rate ?? ""}`;
                  break;
                case "unit":
                  txt = item.unit ?? "";
                  break;
                case "amount":
                  txt = `${item.amount ?? ""}`;
                  break;
                default:
                  txt = item[col.field] ?? "";
              }
              const align = col.align ?? "left";
              const styleKey = "normal";
              const { font, size, color } = getStyle(styleKey);
              const textWidth = font.widthOfTextAtSize(txt, size);
              let drawX = columnX[colIdx];
              if (align === "right") {
                drawX = columnX[colIdx] + mmToPt(col.width) - textWidth;
              } else if (align === "center") {
                drawX = columnX[colIdx] + (mmToPt(col.width) - textWidth) / 2;
              }
              page.drawText(txt, { x: drawX, y: curY, size, font, color });
            });
            curY -= mmToPt(6);
          });
        }
        break;
      }
      case "taxSection": {
        let curY = baseY;
        const lineHeight = getStyle("normal").size + 2;
        for (const field of block.fields) {
          const val = invoiceData[field] ?? "";
          const label = field.toUpperCase();
          drawText(`${label}: ${val}`, baseX, curY, "normal");
          curY -= lineHeight;
        }
        break;
      }
      case "grandTotal": {
        drawText(`Grand Total: ${invoiceData.grandTotal}`, baseX, baseY, "bold");
        break;
      }
      case "amountWords": {
        drawText(`Amount in words: ${invoiceData.amountInWords}`, baseX, baseY, "normal");
        break;
      }
      case "bankDetails": {
        let curY = baseY;
        const lineHeight = getStyle("normal").size + 2;
        for (const field of block.fields) {
          const parts = field.split(".");
          const val = parts.reduce((acc: any, k: string) => acc?.[k], companyData) ?? "";
          const label = parts[1] ? parts[1].replace(/([A-Z])/g, " $1").trim() : field;
          drawText(`${label}: ${val}`, baseX, curY, "normal");
          curY -= lineHeight;
        }
        break;
      }
      case "declaration": {
        drawText(block.staticText, baseX, baseY, "normal");
        break;
      }
      case "signature": {
        drawText(`Authorized Signatory: ${invoiceData.authorizedSignatory || ""}`,
          baseX,
          baseY,
          "normal"
        );
        break;
      }
      case "footer": {
        let curY = baseY;
        const lineHeight = getStyle("small").size + 1;
        for (const line of block.lines) {
          drawText(line, widthPt / 2, curY, "small");
          curY -= lineHeight;
        }
        break;
      }
      default:
        // Unknown block – ignore
        break;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Helper to trigger a browser download of the generated PDF.
 */
export function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}


export async function generateInvoicePdf(invoiceData: any, companyData: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  const margin = 50;

  const drawText = (text: string, x: number, y: number, size = 10, isBold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  // Header - Company Details
  drawText(companyData.companyName || "COMPANY NAME", margin, height - 50, 20, true);
  drawText(companyData.address || "Company Address", margin, height - 70);
  drawText(`State: ${companyData.state || ""}`, margin, height - 85);
  drawText(`GSTIN/UIN: ${companyData.gstNumber || ""}`, margin, height - 100);
  drawText(`E-Mail: ${companyData.email || ""}`, margin, height - 115);

  // Invoice Details
  drawText("TAX INVOICE", width / 2 - 40, height - 50, 16, true);
  drawText(`Invoice No: ${invoiceData.invoiceNumber}`, width - margin - 150, height - 70);
  drawText(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`, width - margin - 150, height - 85);

  // Divider
  page.drawLine({
    start: { x: margin, y: height - 130 },
    end: { x: width - margin, y: height - 130 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Buyer Details
  drawText("Billed To:", margin, height - 150, 12, true);
  drawText(invoiceData.customer?.name || "", margin, height - 170, 10, true);
  drawText(invoiceData.customer?.address || "", margin, height - 185);
  drawText(`State: ${invoiceData.customer?.state || ""}`, margin, height - 200);
  drawText(`GSTIN/UIN: ${invoiceData.customer?.gstNumber || ""}`, margin, height - 215);

  // Divider
  page.drawLine({
    start: { x: margin, y: height - 235 },
    end: { x: width - margin, y: height - 235 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Table Headers
  let currentY = height - 255;
  drawText("S.No", margin, currentY, 10, true);
  drawText("Description", margin + 40, currentY, 10, true);
  drawText("HSN/SAC", margin + 250, currentY, 10, true);
  drawText("Qty", margin + 320, currentY, 10, true);
  drawText("Rate", margin + 370, currentY, 10, true);
  drawText("Amount", margin + 440, currentY, 10, true);

  page.drawLine({
    start: { x: margin, y: currentY - 5 },
    end: { x: width - margin, y: currentY - 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;

  // Table Items
  if (invoiceData.items && invoiceData.items.length > 0) {
    invoiceData.items.forEach((item: any, index: number) => {
      drawText(`${index + 1}`, margin, currentY);
      drawText(item.productName || "Product", margin + 40, currentY);
      drawText(item.hsnCode || "-", margin + 250, currentY);
      drawText(`${item.qty} ${item.unit}`, margin + 320, currentY);
      drawText(`${item.rate}`, margin + 370, currentY);
      drawText(`${item.amount}`, margin + 440, currentY);
      currentY -= 20;
    });
  }

  // Divider below items
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;

  // Totals
  drawText("Sub Total", margin + 350, currentY, 10, true);
  drawText(`${invoiceData.subtotal}`, margin + 440, currentY);
  currentY -= 20;

  drawText("CGST", margin + 350, currentY, 10, true);
  drawText(`${invoiceData.cgstAmount}`, margin + 440, currentY);
  currentY -= 20;

  drawText("SGST", margin + 350, currentY, 10, true);
  drawText(`${invoiceData.sgstAmount}`, margin + 440, currentY);
  currentY -= 20;

  drawText("Round Off", margin + 350, currentY, 10, true);
  drawText(`${invoiceData.roundoff}`, margin + 440, currentY);
  currentY -= 20;

  page.drawLine({
    start: { x: margin + 340, y: currentY + 10 },
    end: { x: width - margin, y: currentY + 10 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  drawText("Grand Total", margin + 350, currentY - 5, 12, true);
  drawText(`Rs. ${invoiceData.grandTotal}`, margin + 440, currentY - 5, 12, true);

  // Amount in words
  currentY -= 40;
  drawText("Amount Chargeable (in words):", margin, currentY, 10, true);
  drawText(`INR ${invoiceData.amountWords}`, margin, currentY - 15);

  // Footer - Bank Details & Declaration
  currentY -= 50;
  drawText("Company's Bank Details", margin, currentY, 10, true);
  drawText(`Bank Name: ${companyData.bankName || ""}`, margin, currentY - 15);
  drawText(`A/c No.: ${companyData.accountNumber || ""}`, margin, currentY - 30);
  drawText(`IFSC: ${companyData.ifsc || ""}`, margin, currentY - 45);

  drawText("Declaration", width / 2, currentY, 10, true);
  drawText(companyData.declaration || "We declare that this invoice shows the actual price of the goods.", width / 2, currentY - 15);

  drawText(`For ${companyData.companyName}`, width - margin - 150, currentY - 60, 10, true);
  drawText("Authorised Signatory", width - margin - 150, currentY - 100);

  // Disclaimer
  drawText("SUBJECT TO LOCAL JURISDICTION", width / 2 - 80, margin, 8);
  drawText("This is a Computer Generated Invoice", width / 2 - 80, margin - 15, 8);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}
