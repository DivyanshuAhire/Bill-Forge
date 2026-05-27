import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

function formatDate(dateString: string) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { template, dataParam } = body;
    
    let invoiceData: any;
    let companyData: any;
    if (dataParam?.invoiceData) {
      invoiceData = dataParam.invoiceData;
      companyData = dataParam.companyData || {};
    } else {
      invoiceData = dataParam;
      companyData = {};
    }

    const company = {
      company_name: companyData?.companyName || companyData?.name || "",
      address_lines: [companyData?.address || ""],
      gstin_uin: companyData?.gstNumber || companyData?.gstIn || "",
      state_name: companyData?.state || companyData?.state_name || "",
      state_code: "27",
      email: companyData?.email || "",
    };

    const customer = {
      company_name: invoiceData?.customer?.name || invoiceData?.customer?.company_name || "",
      gstin_uin: invoiceData?.customer?.gstNumber || invoiceData?.customer?.gstIn || invoiceData?.customer?.gstin_uin || invoiceData?.customer?.gstin || "",
      state_name: invoiceData?.customer?.state || invoiceData?.customer?.state_name || "",
      state_code: "27",
    };
    
    // Read GST percents from first item's product details (passed from frontend)
    const firstItem = invoiceData?.items?.[0];
    const cgstPercent = firstItem?.cgstPercent ?? 9;
    const sgstPercent = firstItem?.sgstPercent ?? 9;

    const fullJson = {
      invoice: {
        meta: {
          ...template.invoice.meta,
          invoice_no: invoiceData?.invoiceNumber || "",
          dated: formatDate(invoiceData?.invoiceDate),
        },
        seller: company,
        buyer: customer,
        consignee: customer,
        line_items: (invoiceData?.items || []).map((item: any, idx: number) => ({
          sl_no: idx + 1,
          description: item.productName || item.name || "",
          hsn_sac: item.hsnCode || "",
          quantity: item.qty || 0,
          rate: item.rate || 0,
          per: item.unit || "Brass",
          amount: item.amount || 0
        })),
        taxes: [
          { label: "CGST", rate_percent: cgstPercent, amount: invoiceData?.cgstAmount || 0 },
          { label: "SGST", rate_percent: sgstPercent, amount: invoiceData?.sgstAmount || 0 }
        ],
        totals: {
          subtotal: invoiceData?.subtotal || 0,
          total_tax: (invoiceData?.cgstAmount || 0) + (invoiceData?.sgstAmount || 0),
          round_off: invoiceData?.roundoff || 0,
          grand_total: invoiceData?.grandTotal || 0,
          total_quantity: invoiceData?.items?.reduce((acc: number, item: any) => acc + (item.qty || 0), 0) || 0,
          total_quantity_unit: invoiceData?.items?.[0]?.unit || "Brass",
          amount_in_words: invoiceData?.amountWords || ""
        },
        bank_details: {
          bank_name: companyData?.bankName || companyData?.bank_name || "",
          account_no: companyData?.accountNumber || companyData?.account_no || "",
          branch: companyData?.branch || "",
          ifsc_code: companyData?.ifsc || companyData?.ifsc_code || "",
        },
        footer: template.invoice.footer
      },
      layout: template.layout,
      formatting_rules: template.formatting_rules
    };

    // Remove round_off_row from table sub_rows
    if (fullJson.layout?.sections) {
      for (const section of fullJson.layout.sections) {
        if (section.type === 'table' && section.sub_rows_after_items) {
          section.sub_rows_after_items = section.sub_rows_after_items.filter(
            (r: any) => r.type !== 'round_off_row'
          );
        }
      }
    }

    const tmpId = Math.random().toString(36).substring(7);
    const tmpJsonPath = path.join(os.tmpdir(), `invoice_${tmpId}.json`);
    const tmpPdfPath = path.join(os.tmpdir(), `invoice_${tmpId}.pdf`);

    await fs.writeFile(tmpJsonPath, JSON.stringify(fullJson, null, 2));

    const pythonScript = path.join(process.cwd(), "invoice_engine", "main.py");
    
    await new Promise((resolve, reject) => {
      exec(`python "${pythonScript}" "${tmpJsonPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(stdout, stderr);
          reject(new Error(stdout || stderr || error.message));
        } else {
          resolve(true);
        }
      });
    });

    const pdfBuffer = await fs.readFile(tmpPdfPath);
    
    // Cleanup
    await fs.unlink(tmpJsonPath).catch(() => {});
    await fs.unlink(tmpPdfPath).catch(() => {});
    await fs.unlink(path.join(os.tmpdir(), `invoice_${tmpId}.html`)).catch(() => {});

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice.pdf"`,
      },
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
