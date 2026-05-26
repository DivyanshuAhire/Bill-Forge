import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Generates a GST Tax Invoice PDF.
 *
 * @param template  – contents of utils/template.json
 * @param dataParam – { invoiceData, companyData }  (the shape used by create/page.tsx)
 * @returns Uint8Array PDF bytes
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
    // legacy: the whole object is invoice data
    invoiceData = dataParam;
    companyData = {};
  }

  // Flatten company fields (Company model uses camelCase)
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

  // ── 2. Read template page config ────────────────────────────────────────────
  const PAGE_W = getNum(template?.page?.width) || 595;
  const PAGE_H = getNum(template?.page?.height) || 842;
  const MARGIN_L = getNum(template?.page?.margin?.left) || 40;
  const MARGIN_T = getNum(template?.page?.margin?.top) || 40;

  // Inner canvas dimensions
  const CANVAS_W = getNum(template?.container?.width) || PAGE_W - 2 * MARGIN_L;
  const CANVAS_X = getNum(template?.container?.x) || MARGIN_L;
  const CANVAS_Y_TOP = PAGE_H - MARGIN_T; // PDF Y grows upward

  // ── 3. Create PDF ───────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const styles = template?.styles || {};
  const S_TITLE = getNum(styles.title?.fontSize) || 14;
  const S_HEADER = getNum(styles.header?.fontSize) || 10;
  const S_NORMAL = getNum(styles.normal?.fontSize) || 9;
  const S_SMALL = getNum(styles.small?.fontSize) || 8;

  // pdf-lib uses BOTTOM-LEFT origin. We store template Y values as "distance
  // from top", so we convert:  pdfY = PAGE_H - templateY
  const pdfY = (templateY: number) => PAGE_H - templateY;

  const BLACK = rgb(0, 0, 0);
  const LIGHT_GREY = rgb(0.92, 0.92, 0.92);

  // ── drawing primitives ──────────────────────────────────────────────────────

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    font = regular,
    color = BLACK,
    maxWidth?: number
  ) => {
    if (!text) return;
    const str = String(text);

    if (maxWidth && font.widthOfTextAtSize(str, size) > maxWidth) {
      // simple word-wrap
      const words = str.split(" ");
      let line = "";
      let currentY = y;
      const lineH = size + 2;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxWidth) {
          if (line) page.drawText(line, { x, y: currentY, size, font, color });
          currentY -= lineH;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) page.drawText(line, { x, y: currentY, size, font, color });
      return;
    }

    page.drawText(str, { x, y, size, font, color });
  };

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    opts?: { fill?: any; borderWidth?: number }
  ) => {
    page.drawRectangle({
      x,
      y: y - h,          // pdf-lib: y is bottom-left
      width: w,
      height: h,
      borderColor: BLACK,
      borderWidth: opts?.borderWidth ?? 0.5,
      color: opts?.fill,
    });
  };

  const drawHLine = (x1: number, y: number, x2: number, thickness = 0.5) => {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: BLACK });
  };

  // ── 4. Outer container border ───────────────────────────────────────────────
  if (template?.container?.border) {
    const cH = getNum(template.container.height) || PAGE_H - 2 * MARGIN_T;
    drawRect(CANVAS_X, pdfY(MARGIN_T - cH + PAGE_H - CANVAS_Y_TOP + MARGIN_T), CANVAS_W, cH);
    // Simpler: draw using raw template coords
    page.drawRectangle({
      x: getNum(template.container.x),
      y: PAGE_H - getNum(template.container.y) - getNum(template.container.height),
      width: getNum(template.container.width),
      height: getNum(template.container.height),
      borderColor: BLACK,
      borderWidth: 0.5,
    });
  }

  // ── 5. Title "TAX INVOICE" ─────────────────────────────────────────────────
  const titleText = "TAX INVOICE";
  const titleW = bold.widthOfTextAtSize(titleText, S_TITLE);
  drawText(titleText, PAGE_W / 2 - titleW / 2, pdfY(MARGIN_T + 15), S_TITLE, bold);
  drawHLine(CANVAS_X, pdfY(MARGIN_T + 22), CANVAS_X + CANVAS_W);

  // ── 6. Seller block ─────────────────────────────────────────────────────────
  {
    const blk = template?.sellerBlock || {};
    const bx = getNum(blk.x) || MARGIN_L + 10;
    const by = getNum(blk.y) || MARGIN_T + 25;
    const bw = getNum(blk.width) || 250;
    const bh = getNum(blk.height) || 120;

    // Draw border for this block
    page.drawRectangle({
      x: bx,
      y: PAGE_H - by - bh,
      width: bw,
      height: bh,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    const pad = 5;
    const lineH = 13;
    let cy = pdfY(by + pad);

    const fieldMap: Record<string, string> = {
      "seller.company": company.name,
      "seller.address1": company.address,
      "seller.address2": "",
      "seller.address3": "",
      "seller.gstin": company.gstin,
      "seller.state": company.state,
      "seller.email": company.email,
    };

    const rows: Array<{ label: string; field: string }> = blk.rows || [];
    for (const row of rows) {
      const val = fieldMap[row.field] ?? "";
      if (!val) continue;
      const label = row.label ? `${row.label}: ` : "";
      const isFirst = row.field === "seller.company";
      drawText(label + val, bx + pad, cy, isFirst ? S_HEADER : S_SMALL, isFirst ? bold : regular, BLACK, bw - pad * 2);
      cy -= lineH;
    }
  }

  // ── 7. Invoice meta boxes (right column) ────────────────────────────────────
  {
    const metaBoxes: any[] = template?.invoiceMetaBoxes || [];

    const metaValues: Record<string, string> = {
      invoiceNo: invoiceData?.invoiceNumber || "",
      date: invoiceData?.invoiceDate
        ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-IN")
        : "",
      deliveryNote: "",
      paymentTerms: "",
      referenceNo: "",
      otherReferences: "",
      buyerOrderNo: "",
      buyerDate: "",
      dispatchDocNo: "",
      deliveryDate: "",
      dispatchThrough: "",
      destination: "",
      deliveryTerms: "",
    };

    for (const box of metaBoxes) {
      const bx = getNum(box.x);
      const by = getNum(box.y);
      const bw = getNum(box.width);
      const bh = getNum(box.height);

      page.drawRectangle({
        x: bx,
        y: PAGE_H - by - bh,
        width: bw,
        height: bh,
        borderColor: BLACK,
        borderWidth: 0.5,
      });

      const title: string = box.title || "";
      const value: string = metaValues[box.field] || "";
      const pad = 4;

      // title label (small)
      drawText(title, bx + pad, pdfY(by + pad + 2), S_SMALL - 1, regular);
      // value (slightly larger, bold if filled)
      if (value) {
        drawText(value, bx + pad, pdfY(by + pad + 2 + S_SMALL + 2), S_SMALL, bold);
      }
    }
  }

  // ── 8. Consignee block ──────────────────────────────────────────────────────
  {
    const blk = template?.consigneeBlock || {};
    const bx = getNum(blk.x) || MARGIN_L + 10;
    const by = getNum(blk.y) || 175;
    const bw = getNum(blk.width) || 250;
    const bh = getNum(blk.height) || 95;

    page.drawRectangle({
      x: bx,
      y: PAGE_H - by - bh,
      width: bw,
      height: bh,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    const pad = 5;
    const lineH = 12;
    let cy = pdfY(by + pad);

    drawText("Consignee (Ship to):", bx + pad, cy, S_SMALL, bold);
    cy -= lineH;

    const fieldMap: Record<string, string> = {
      "buyer.name": customer.name,
      "buyer.address": customer.address,
      "buyer.gstin": customer.gstin,
      "buyer.state": customer.state,
    };

    const rows: Array<{ label: string; field: string }> = blk.rows || [];
    for (const row of rows) {
      const val = fieldMap[row.field] ?? "";
      if (!val || row.label === "Consignee") continue; // header already drawn
      const label = row.label ? `${row.label}: ` : "";
      drawText(label + val, bx + pad, cy, S_SMALL, regular, BLACK, bw - pad * 2);
      cy -= lineH;
    }
  }

  // ── 9. Buyer block (Bill To) ────────────────────────────────────────────────
  {
    const blk = template?.buyerBlock || {};
    const bx = getNum(blk.x) || MARGIN_L + 10;
    const by = getNum(blk.y) || 270;
    const bw = getNum(blk.width) || 250;
    const bh = getNum(blk.height) || 95;

    page.drawRectangle({
      x: bx,
      y: PAGE_H - by - bh,
      width: bw,
      height: bh,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    const pad = 5;
    const lineH = 12;
    let cy = pdfY(by + pad);

    drawText("Buyer (Bill to):", bx + pad, cy, S_SMALL, bold);
    cy -= lineH;

    const fieldMap: Record<string, string> = {
      "billTo.name": customer.name,
      "billTo.address": customer.address,
      "billTo.gstin": customer.gstin,
      "billTo.state": customer.state,
    };

    const rows: Array<{ label: string; field: string }> = blk.rows || [];
    for (const row of rows) {
      const val = fieldMap[row.field] ?? "";
      if (!val || row.label === "Buyer") continue;
      const label = row.label ? `${row.label}: ` : "";
      drawText(label + val, bx + pad, cy, S_SMALL, regular, BLACK, bw - pad * 2);
      cy -= lineH;
    }
  }

  // ── 10. Items table ─────────────────────────────────────────────────────────
  {
    const tbl = template?.itemsTable || {};
    const tx = getNum(tbl.x) || MARGIN_L + 10;
    const ty = getNum(tbl.y) || 380;
    const tw = getNum(tbl.width) || CANVAS_W - 20;
    const columns: any[] = tbl.columns || [];

    const ROW_H = 16;
    const HDR_H = 18;
    const lineItems: any[] = invoiceData?.items || [];
    const MIN_ROWS = 10;
    const totalRows = Math.max(lineItems.length, MIN_ROWS);

    const tableHeight = HDR_H + totalRows * ROW_H + 4 * ROW_H + 10; // rows + tax rows buffer

    // Outer border
    page.drawRectangle({
      x: tx,
      y: PAGE_H - ty - tableHeight,
      width: tw,
      height: tableHeight,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    // Header row background
    page.drawRectangle({
      x: tx,
      y: PAGE_H - ty - HDR_H,
      width: tw,
      height: HDR_H,
      color: LIGHT_GREY,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    // Draw column headers & vertical dividers
    let cx = tx;
    for (const col of columns) {
      const cw = getNum(col.width);
      drawText(col.title || "", cx + 3, pdfY(ty + 4), S_SMALL, bold);
      // vertical divider
      if (cx > tx) {
        page.drawLine({
          start: { x: cx, y: PAGE_H - ty - tableHeight },
          end: { x: cx, y: PAGE_H - ty },
          thickness: 0.5,
          color: BLACK,
        });
      }
      cx += cw;
    }

    // Data rows
    let rowY = ty + HDR_H;
    for (let i = 0; i < totalRows; i++) {
      const item = lineItems[i] || {};
      cx = tx;

      // row bottom line
      drawHLine(tx, pdfY(rowY + ROW_H), tx + tw);

      for (const col of columns) {
        const cw = getNum(col.width);
        let cellText = "";

        switch (col.field) {
          case "description":
            cellText = item.productName || item.description || "";
            break;
          case "hsn":
            cellText = item.hsnCode || item.hsn_sac || item.hsn || "";
            break;
          case "quantity":
            cellText = item.qty != null ? `${item.qty} ${item.unit || ""}`.trim() : "";
            break;
          case "rate":
            cellText = item.rate ? formatINR(getNum(item.rate)) : "";
            break;
          case "amount":
            cellText = item.amount ? formatINR(getNum(item.amount)) : "";
            break;
          default:
            cellText = item[col.field] != null ? String(item[col.field]) : "";
        }

        const textSize = S_SMALL;
        const isRight = col.field === "rate" || col.field === "amount";
        let drawX = cx + 3;
        if (isRight && cellText) {
          drawX = cx + cw - 3 - regular.widthOfTextAtSize(cellText, textSize);
        }
        drawText(cellText, drawX, pdfY(rowY + 4), textSize, regular);
        cx += cw;
      }

      rowY += ROW_H;
    }

    // ── Tax rows ────────────────────────────────────────────────────────────
    const taxSection = template?.taxSection || {};
    const taxRows: any[] = taxSection.rows || [
      { label: "CGST", field: "cgst" },
      { label: "SGST", field: "sgst" },
      { label: "Round Off", field: "roundOff" },
      { label: "Grand Total", field: "grandTotal" },
    ];

    const taxValues: Record<string, number> = {
      cgst: getNum(invoiceData?.cgstAmount),
      sgst: getNum(invoiceData?.sgstAmount),
      roundOff: getNum(invoiceData?.roundoff),
      grandTotal: getNum(invoiceData?.grandTotal),
    };

    for (const taxRow of taxRows) {
      const val = taxValues[taxRow.field];
      const isGrandTotal = taxRow.field === "grandTotal";

      drawHLine(tx, pdfY(rowY + ROW_H), tx + tw);

      cx = tx;
      for (const col of columns) {
        const cw = getNum(col.width);
        let cellText = "";

        if (col.field === "description") {
          cellText = taxRow.label;
        } else if (col.field === "amount") {
          cellText = val !== undefined ? formatINR(val) : "";
        }

        if (cellText) {
          const isRight = col.field === "amount";
          let drawX = cx + 3;
          const f = isGrandTotal ? bold : regular;
          if (isRight) {
            drawX = cx + cw - 3 - f.widthOfTextAtSize(cellText, S_SMALL);
          }
          drawText(cellText, drawX, pdfY(rowY + 4), S_SMALL, f);
        }
        cx += cw;
      }

      rowY += ROW_H;
    }
  }

  // ── 11. Amount in words ─────────────────────────────────────────────────────
  {
    const awBlk = template?.amountWords || {};
    const ax = getNum(awBlk.x) || MARGIN_L + 10;
    const ay = getNum(awBlk.y) || 660;
    const aw = getNum(awBlk.width) || CANVAS_W - 20;
    const words = invoiceData?.amountWords || "";

    page.drawRectangle({
      x: ax,
      y: PAGE_H - ay - 25,
      width: aw,
      height: 25,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    drawText("Amount Chargeable (in words):", ax + 5, pdfY(ay + 5), S_SMALL, regular);
    drawText(`INR ${words} Only`, ax + 5, pdfY(ay + 15), S_SMALL, bold, BLACK, aw - 10);
  }

  // ── 12. Bank details ────────────────────────────────────────────────────────
  {
    const bdBlk = template?.bankDetails || {};
    const bx = getNum(bdBlk.x) || MARGIN_L + 10;
    const by = getNum(bdBlk.y) || 700;
    const bw = 250;
    const bh = 70;

    page.drawRectangle({
      x: bx,
      y: PAGE_H - by - bh,
      width: bw,
      height: bh,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    const pad = 5;
    const lineH = 12;
    let cy = pdfY(by + pad);

    drawText("Bank Details:", bx + pad, cy, S_SMALL, bold);
    cy -= lineH;

    const bankValues: Record<string, string> = {
      "bank.name": company.bankName,
      "bank.account": company.accountNo,
      "bank.ifsc": company.ifsc,
      "bank.branch": company.branch,
    };

    const rows: any[] = bdBlk.rows || [];
    for (const row of rows) {
      const val = bankValues[row.field] ?? "";
      if (!val) continue;
      drawText(`${row.label}: ${val}`, bx + pad, cy, S_SMALL, regular, BLACK, bw - pad * 2);
      cy -= lineH;
    }
  }

  // ── 13. Signature block ─────────────────────────────────────────────────────
  {
    const sig = template?.signature || {};
    const sx = getNum(sig.x) || 420;
    const sy = getNum(sig.y) || 720;
    const sw = CANVAS_X + CANVAS_W - sx;
    const sh = 60;

    page.drawRectangle({
      x: sx,
      y: PAGE_H - sy - sh,
      width: sw,
      height: sh,
      borderColor: BLACK,
      borderWidth: 0.5,
    });

    drawText(`for ${company.name}`, sx + 5, pdfY(sy + 5), S_SMALL, regular);
    drawText(sig.text || "Authorised Signatory", sx + 5, pdfY(sy + sh - 10), S_SMALL, bold);
  }

  // ── 14. Footer ──────────────────────────────────────────────────────────────
  {
    const ftr = template?.footer || {};
    const fx = getNum(ftr.x) || MARGIN_L + 10;
    const fy = getNum(ftr.y) || 790;
    const text = ftr.text || "This is a Computer Generated Invoice";
    const tw2 = CANVAS_W - 20;
    const textW = regular.widthOfTextAtSize(text, S_SMALL);
    drawText(text, fx + (tw2 - textW) / 2, pdfY(fy), S_SMALL, regular);
  }

  // ── 15. Declaration ─────────────────────────────────────────────────────────
  {
    const decl =
      companyData?.declaration ||
      "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
    drawText(decl, CANVAS_X + 10, pdfY(700), S_SMALL, regular, BLACK, 240);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
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
