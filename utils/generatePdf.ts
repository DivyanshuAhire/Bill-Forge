import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";

// ── helpers ──────────────────────────────────────────────────────────────────

const getNum = (val: any): number => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

/** Format a number in Indian numbering with 2 decimal places */
const formatINR = (amount: number): string => {
  const abs = Math.abs(amount);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  let result = "";
  let count = 0;
  for (let i = intPart.length - 1; i >= 0; i--) {
    if (count > 0 && count % 2 === 0 && count !== 0) result = "," + result;
    result = intPart[i] + result;
    count++;
  }
  return (amount < 0 ? "-" : "") + result + "." + decPart;
};

interface DrawContext {
  page: PDFPage;
  regular: any;
  bold: any;
  BLACK: any;
  LIGHT_GREY: any;
  S_TITLE: number;
  S_HEADER: number;
  S_NORMAL: number;
  S_SMALL: number;
  PAGE_W: number;
  PAGE_H: number;
  currentY: number;
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Generates a GST Tax Invoice PDF following the template structure.
 */
export async function generateInvoicePdf(
  template: any,
  dataParam: any,
): Promise<Uint8Array> {
  // ── 1. Normalise data ───────────────────────────────────────────────────────
  let invoiceData: any;
  let companyData: any;

  if (dataParam?.invoiceData) {
    invoiceData = dataParam.invoiceData;
    companyData = dataParam.companyData || {};
  } else {
    invoiceData = dataParam;
    companyData = {};
  }

  // Flatten company fields
  const company = {
    name: companyData?.companyName || companyData?.company_name || companyData?.name || "",
    address: companyData?.address || "",
    gstin: companyData?.gstNumber || companyData?.gstin_uin || companyData?.gstIn || "",
    state: companyData?.state || companyData?.state_name || "",
    email: companyData?.email || "",
    phone: companyData?.phone || "",
    bankName: companyData?.bankName || companyData?.bank_name || "",
    accountNo: companyData?.accountNumber || companyData?.account_no || "",
    ifsc: companyData?.ifsc || companyData?.ifsc_code || "",
    branch: companyData?.branch || "",
  };

  // Flatten customer fields
  const cust = invoiceData?.customer || {};
  const customer = {
    name: cust?.company_name || cust?.name || "",
    address: cust?.address || "",
    gstin: cust?.gstIn || cust?.gstin_uin || cust?.gstin || "",
    state: cust?.state || cust?.state_name || "",
  };

  // ── 2. Create PDF ───────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ctx: DrawContext = {
    page,
    regular,
    bold,
    BLACK: rgb(0, 0, 0),
    LIGHT_GREY: rgb(0.92, 0.92, 0.92),
    S_TITLE: 14,
    S_HEADER: 10,
    S_NORMAL: 9,
    S_SMALL: 8,
    PAGE_W: 595,
    PAGE_H: 842,
    currentY: 842 - 40, // Start from top with margin
  };

  const data = {
    invoice: template.invoice,
    invoiceData,
    company,
    customer,
  };

  // ── 3. Render sections from template ─────────────────────────────────────────
  const sections = template.layout?.sections || [];
  const MARGIN_L = 40;
  const MARGIN_R = 40;
  const MARGIN_B = 40;
  const contentWidth = ctx.PAGE_W - MARGIN_L - MARGIN_R;

  for (const section of sections) {
    ctx.currentY -= 5; // gap between sections

    switch (section.type) {
      case "full_width_centered_text":
        renderFullWidthCenteredText(ctx, section, data, contentWidth);
        break;

      case "two_column_split":
        renderTwoColumnSplit(ctx, section, data, contentWidth, MARGIN_L);
        break;

      case "table":
        renderTable(ctx, section, data, contentWidth, MARGIN_L);
        break;

      case "full_width_text":
        renderFullWidthText(ctx, section, data, contentWidth, MARGIN_L);
        break;

      default:
        break;
    }

    if (ctx.currentY < MARGIN_B) {
      // Would overflow, stop rendering
      break;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}


// ── Render Functions ────────────────────────────────────────────────────────

function renderFullWidthCenteredText(
  ctx: DrawContext,
  section: any,
  data: any,
  contentWidth: number,
) {
  const value = getFieldValue(section.value_key || section.content_key, data);
  if (!value) return;

  const text = String(value);
  const size = ctx.S_TITLE;
  const font = ctx.bold;

  const textWidth = font.widthOfTextAtSize(text, size);
  const x = (ctx.PAGE_W - textWidth) / 2;

  ctx.page.drawText(text, { x, y: ctx.currentY - size, size, font, color: ctx.BLACK });
  ctx.currentY -= size + 8;

  if (section.style?.border_bottom) {
    ctx.page.drawLine({
      start: { x: 40, y: ctx.currentY },
      end: { x: ctx.PAGE_W - 40, y: ctx.currentY },
      thickness: 0.5,
      color: ctx.BLACK,
    });
    ctx.currentY -= 3;
  }
}

function renderTwoColumnSplit(
  ctx: DrawContext,
  section: any,
  data: any,
  contentWidth: number,
  marginL: number,
) {
  const left = section.left || {};
  const right = section.right || {};

  const leftWidth = (contentWidth * (left.width_percent || 50)) / 100;
  const rightWidth = (contentWidth * (right.width_percent || 50)) / 100;
  const rightX = marginL + leftWidth;

  const startY = ctx.currentY;

  // Render left column
  if (left.content === "seller_block") {
    renderSellerBlock(ctx, left, data, marginL, leftWidth);
  } else if (left.content === "meta_grid") {
    renderMetaGrid(ctx, left, data, marginL, leftWidth);
  } else if (left.rows) {
    renderBlockRows(ctx, left, data, marginL, leftWidth);
  }

  // Reset Y for right column
  ctx.currentY = startY;

  // Render right column
  if (right.content === "seller_block") {
    renderSellerBlock(ctx, right, data, rightX, rightWidth);
  } else if (right.content === "meta_grid") {
    renderMetaGrid(ctx, right, data, rightX, rightWidth);
  } else if (right.content === "consignee_block") {
    renderConsigneeBlock(ctx, right, data, rightX, rightWidth);
  } else if (right.content === "buyer_block") {
    renderBuyerBlock(ctx, right, data, rightX, rightWidth);
  } else if (right.rows) {
    renderBlockRows(ctx, right, data, rightX, rightWidth);
  }
}

function renderSellerBlock(
  ctx: DrawContext,
  block: any,
  data: any,
  x: number,
  width: number,
) {
  const company = data.company;
  const fields = block.fields || [];

  const boxHeight = calculateBoxHeight(ctx, fields.length, ctx.S_SMALL);
  const boxTop = ctx.currentY;
  const boxBottom = boxTop - boxHeight;

  // Draw border
  ctx.page.drawRectangle({
    x,
    y: boxBottom,
    width,
    height: boxHeight,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  let currentY = boxTop - 6;
  const pad = 5;

  for (const field of fields) {
    const key = field.key;
    let text = "";

    if (key === "seller.company_name") {
      text = company.name;
    } else if (key === "seller.address_lines") {
      text = company.address;
    } else if (key === "seller.gstin_uin") {
      text = `${field.label} ${company.gstin}`;
    } else if (key === "seller.state_name") {
      text = `${field.label} ${company.state} Code: 27`;
    } else if (key === "seller.email") {
      text = `${field.label} ${company.email}`;
    }

    if (!text) continue;

    const font = field.style === "bold_large" ? ctx.bold : ctx.regular;
    const size = field.style === "bold_large" ? ctx.S_HEADER : ctx.S_SMALL;

    drawTextInBox(ctx, text, x + pad, currentY, width - pad * 2, size, font);
    currentY -= size + 4;
  }

  ctx.currentY = boxBottom - 5;
}

function renderMetaGrid(
  ctx: DrawContext,
  block: any,
  data: any,
  x: number,
  width: number,
) {
  const invoice = data.invoice;
  const rows = block.rows || [];

  const boxHeight = calculateBoxHeight(ctx, rows.length * 2, ctx.S_SMALL);
  const boxTop = ctx.currentY;
  const boxBottom = boxTop - boxHeight;

  // Draw border
  ctx.page.drawRectangle({
    x,
    y: boxBottom,
    width,
    height: boxHeight,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  let currentY = boxTop - 6;
  const pad = 4;
  const colWidth = (width - pad * 2) / 2;

  for (const row of rows) {
    const cols = row.cols || [];

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const colX = x + pad + i * colWidth;

      // Label
      drawTextInBox(ctx, col.label, colX, currentY, colWidth - 2, ctx.S_SMALL - 1, ctx.regular);
      currentY -= ctx.S_SMALL + 1;

      // Value
      const value = getFieldValue(col.value_key, data);
      if (value) {
        drawTextInBox(ctx, String(value), colX, currentY, colWidth - 2, ctx.S_SMALL, ctx.bold);
      }
      currentY -= ctx.S_SMALL + 2;
    }
  }

  ctx.currentY = boxBottom - 5;
}

function renderConsigneeBlock(
  ctx: DrawContext,
  block: any,
  data: any,
  x: number,
  width: number,
) {
  const customer = data.customer;
  const fields = block.fields || [];

  const boxHeight = calculateBoxHeight(ctx, fields.length + 1, ctx.S_SMALL);
  const boxTop = ctx.currentY;
  const boxBottom = boxTop - boxHeight;

  // Draw border
  ctx.page.drawRectangle({
    x,
    y: boxBottom,
    width,
    height: boxHeight,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  let currentY = boxTop - 6;
  const pad = 5;

  // Title
  drawTextInBox(ctx, block.label, x + pad, currentY, width - pad * 2, ctx.S_SMALL, ctx.bold);
  currentY -= ctx.S_SMALL + 4;

  for (const field of fields) {
    const key = field.key;
    let text = "";

    if (key === "consignee.company_name") {
      text = customer.name;
    } else if (key === "consignee.gstin_uin") {
      text = `${field.label} ${customer.gstin}`;
    } else if (key === "consignee.state_name") {
      text = `${field.label} ${customer.state}`;
    }

    if (!text) continue;

    drawTextInBox(ctx, text, x + pad, currentY, width - pad * 2, ctx.S_SMALL, ctx.regular);
    currentY -= ctx.S_SMALL + 3;
  }

  ctx.currentY = boxBottom - 5;
}

function renderBuyerBlock(
  ctx: DrawContext,
  block: any,
  data: any,
  x: number,
  width: number,
) {
  const customer = data.customer;
  const fields = block.fields || [];

  const boxHeight = calculateBoxHeight(ctx, fields.length + 1, ctx.S_SMALL);
  const boxTop = ctx.currentY;
  const boxBottom = boxTop - boxHeight;

  // Draw border
  ctx.page.drawRectangle({
    x,
    y: boxBottom,
    width,
    height: boxHeight,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  let currentY = boxTop - 6;
  const pad = 5;

  // Title
  drawTextInBox(ctx, block.label, x + pad, currentY, width - pad * 2, ctx.S_SMALL, ctx.bold);
  currentY -= ctx.S_SMALL + 4;

  for (const field of fields) {
    const key = field.key;
    let text = "";

    if (key === "buyer.company_name") {
      text = customer.name;
    } else if (key === "buyer.gstin_uin") {
      text = `${field.label} ${customer.gstin}`;
    } else if (key === "buyer.state_name") {
      text = `${field.label} ${customer.state}`;
    }

    if (!text) continue;

    drawTextInBox(ctx, text, x + pad, currentY, width - pad * 2, ctx.S_SMALL, ctx.regular);
    currentY -= ctx.S_SMALL + 3;
  }

  ctx.currentY = boxBottom - 5;
}

function renderTable(
  ctx: DrawContext,
  section: any,
  data: any,
  contentWidth: number,
  marginL: number,
) {
  const headerRow = section.header_row || {};
  const columns = headerRow.columns || [];
  const lineItems = data.invoiceData?.items || [];

  const colWidths = columns.map((col: any) => (contentWidth * col.width_percent) / 100);

  const rowHeight = 14;
  const headerHeight = 16;
  const taxRowCount = 4; // CGST, SGST, Round Off, Total
  const minRows = 3;
  const dataRowCount = Math.max(lineItems.length, minRows);
  const totalHeight = headerHeight + dataRowCount * rowHeight + taxRowCount * rowHeight + 10;

  const boxTop = ctx.currentY;
  const boxBottom = boxTop - totalHeight;

  // Draw outer border
  ctx.page.drawRectangle({
    x: marginL,
    y: boxBottom,
    width: contentWidth,
    height: totalHeight,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  // Draw header background
  ctx.page.drawRectangle({
    x: marginL,
    y: boxTop - headerHeight,
    width: contentWidth,
    height: headerHeight,
    color: ctx.LIGHT_GREY,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  // Draw header text and column dividers
  let colX = marginL;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const colW = colWidths[i];

    drawTextInBox(ctx, col.label, colX + 3, boxTop - 6, colW - 6, ctx.S_SMALL, ctx.bold);

    if (i > 0) {
      ctx.page.drawLine({
        start: { x: colX, y: boxBottom },
        end: { x: colX, y: boxTop },
        thickness: 0.5,
        color: ctx.BLACK,
      });
    }
    colX += colW;
  }

  // Draw data rows
  let rowY = boxTop - headerHeight;
  for (let i = 0; i < dataRowCount; i++) {
    const item = lineItems[i] || {};

    colX = marginL;
    for (let j = 0; j < columns.length; j++) {
      const col = columns[j];
      const colW = colWidths[j];
      let cellText = "";

      switch (col.id) {
        case "description":
          cellText = item.productName || item.description || "";
          break;
        case "hsn_sac":
          cellText = item.hsnCode || item.hsn_sac || item.hsn || "";
          break;
        case "quantity":
          cellText = item.qty != null ? String(item.qty) : "";
          break;
        case "rate":
          cellText = item.rate ? formatINR(getNum(item.rate)) : "";
          break;
        case "per":
          cellText = item.unit || "";
          break;
        case "amount":
          cellText = item.amount ? formatINR(getNum(item.amount)) : "";
          break;
      }

      const align = col.align === "right" ? "right" : "left";
      drawTextInBox(
        ctx,
        cellText,
        colX + 2,
        rowY - 3,
        colW - 4,
        ctx.S_SMALL,
        ctx.regular,
        align,
      );

      colX += colW;
    }

    // Draw row divider
    ctx.page.drawLine({
      start: { x: marginL, y: rowY - rowHeight },
      end: { x: marginL + contentWidth, y: rowY - rowHeight },
      thickness: 0.5,
      color: ctx.BLACK,
    });

    rowY -= rowHeight;
  }

  // Draw tax rows
  const taxValues = {
    cgst: getNum(data.invoiceData?.cgstAmount),
    sgst: getNum(data.invoiceData?.sgstAmount),
    roundoff: getNum(data.invoiceData?.roundoff),
    grandTotal: getNum(data.invoiceData?.grandTotal),
  };

  const taxLabels = [
    { label: "CGST", value: taxValues.cgst },
    { label: "SGST", value: taxValues.sgst },
    { label: "Round Off", value: taxValues.roundoff },
    { label: "Grand Total", value: taxValues.grandTotal, isBold: true },
  ];

  for (const taxRow of taxLabels) {
    colX = marginL;

    for (let j = 0; j < columns.length; j++) {
      const col = columns[j];
      const colW = colWidths[j];
      let cellText = "";

      if (col.id === "description") {
        cellText = taxRow.label;
      } else if (col.id === "amount") {
        cellText = formatINR(taxRow.value);
      }

      if (cellText) {
        const font = taxRow.isBold ? ctx.bold : ctx.regular;
        const align = col.align === "right" ? "right" : "left";
        drawTextInBox(ctx, cellText, colX + 2, rowY - 3, colW - 4, ctx.S_SMALL, font, align);
      }

      colX += colW;
    }

    ctx.page.drawLine({
      start: { x: marginL, y: rowY - rowHeight },
      end: { x: marginL + contentWidth, y: rowY - rowHeight },
      thickness: 0.5,
      color: ctx.BLACK,
    });

    rowY -= rowHeight;
  }

  ctx.currentY = boxBottom - 5;
}

function renderFullWidthText(
  ctx: DrawContext,
  section: any,
  data: any,
  contentWidth: number,
  marginL: number,
) {
  const label = section.label || "";
  const value = getFieldValue(section.value_key, data) || "";

  const boxHeight = 30;
  const boxTop = ctx.currentY;
  const boxBottom = boxTop - boxHeight;

  // Draw border
  ctx.page.drawRectangle({
    x: marginL,
    y: boxBottom,
    width: contentWidth,
    height: boxHeight,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  const pad = 5;
  let currentY = boxTop - 6;

  // Draw label
  drawTextInBox(ctx, label, marginL + pad, currentY, contentWidth - pad * 2, ctx.S_SMALL, ctx.regular);
  currentY -= ctx.S_SMALL + 2;

  // Draw value
  drawTextInBox(ctx, String(value), marginL + pad, currentY, contentWidth - pad * 2, ctx.S_SMALL, ctx.bold);

  // Draw right corner text if exists
  if (section.right_corner_text) {
    const cornerText = section.right_corner_text;
    drawTextInBox(
      ctx,
      cornerText,
      marginL + contentWidth - 40,
      currentY,
      35,
      ctx.S_SMALL - 1,
      ctx.regular,
      "right",
    );
  }

  ctx.currentY = boxBottom - 5;
}

function renderBlockRows(
  ctx: DrawContext,
  block: any,
  data: any,
  x: number,
  width: number,
) {
  const rows = block.rows || [];
  const rowCount = rows.reduce((acc: number, row: any) => acc + (row.fields?.length || 0), 0) + rows.length;

  const boxHeight = calculateBoxHeight(ctx, rowCount, ctx.S_SMALL);
  const boxTop = ctx.currentY;
  const boxBottom = boxTop - boxHeight;

  // Draw border
  ctx.page.drawRectangle({
    x,
    y: boxBottom,
    width,
    height: boxHeight,
    borderColor: ctx.BLACK,
    borderWidth: 0.5,
  });

  let currentY = boxTop - 6;
  const pad = 5;

  for (const row of rows) {
    if (row.label) {
      drawTextInBox(ctx, row.label, x + pad, currentY, width - pad * 2, ctx.S_SMALL, ctx.bold);
      currentY -= ctx.S_SMALL + 4;
    }

    for (const field of row.fields || []) {
      let text = "";
      if (field.value_key) {
        text = getFieldValue(field.value_key, data) || "";
      } else if (field.value) {
        text = field.value;
      }

      if (text) {
        const font = field.style === "bold" ? ctx.bold : ctx.regular;
        drawTextInBox(ctx, String(text), x + pad, currentY, width - pad * 2, ctx.S_SMALL, font);
        currentY -= ctx.S_SMALL + 3;
      }
    }
  }

  ctx.currentY = boxBottom - 5;
}

// ── Helper Functions ────────────────────────────────────────────────────────

function drawTextInBox(
  ctx: DrawContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: any,
  align: string = "left",
) {
  if (!text) return;

  const str = String(text);
  const textWidth = font.widthOfTextAtSize(str, size);

  let drawX = x;
  if (align === "right") {
    drawX = x + maxWidth - textWidth;
  } else if (align === "center") {
    drawX = x + (maxWidth - textWidth) / 2;
  }

  // Clamp to box boundaries
  drawX = Math.max(x, Math.min(drawX, x + maxWidth - textWidth));

  if (textWidth > maxWidth) {
    // Word wrap
    const words = str.split(" ");
    let line = "";
    let currentY = y;

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(test, size);

      if (testWidth > maxWidth) {
        if (line) {
          ctx.page.drawText(line, { x: drawX, y: currentY, size, font, color: ctx.BLACK });
          currentY -= size + 2;
        }
        line = word;
      } else {
        line = test;
      }
    }

    if (line) {
      ctx.page.drawText(line, { x: drawX, y: currentY, size, font, color: ctx.BLACK });
    }
  } else {
    ctx.page.drawText(str, { x: drawX, y, size, font, color: ctx.BLACK });
  }
}

function calculateBoxHeight(ctx: DrawContext, lineCount: number, fontSize: number): number {
  return Math.max(lineCount * (fontSize + 4) + 10, 50);
}

function getFieldValue(key: string, data: any): any {
  if (!key) return "";

  const parts = key.split(".");
  let value = data;

  for (const part of parts) {
    if (value == null) return "";
    value = value[part];
  }

  return value;
}

/**
 * Triggers a browser file-download for the generated PDF bytes.
 */
export function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
