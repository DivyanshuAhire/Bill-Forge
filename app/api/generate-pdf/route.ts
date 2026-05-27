import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

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
      company_name: companyData?.companyName || companyData?.name || template.invoice.seller.company_name,
      address_lines: [companyData?.address || template.invoice.seller.address_lines[0]],
      gstin_uin: companyData?.gstNumber || companyData?.gstIn || template.invoice.seller.gstin_uin,
      state_name: companyData?.state || template.invoice.seller.state_name,
      state_code: "27",
      email: companyData?.email || template.invoice.seller.email,
    };

    const customer = {
      company_name: invoiceData?.customer?.name || template.invoice.buyer.company_name,
      gstin_uin: invoiceData?.customer?.gstIn || template.invoice.buyer.gstin_uin,
      state_name: invoiceData?.customer?.state || template.invoice.buyer.state_name,
      state_code: "27",
    };
    
    // Construct what python expects
    const fullJson = {
      invoice: {
        meta: {
          ...template.invoice.meta,
          invoice_no: invoiceData.invoiceNumber || template.invoice.meta.invoice_no,
          dated: invoiceData.invoiceDate || template.invoice.meta.dated,
        },
        seller: company,
        buyer: customer,
        consignee: customer,
        line_items: (invoiceData.items || []).map((item: any, idx: number) => ({
          sl_no: idx + 1,
          description: item.productName || item.name,
          hsn_sac: item.hsnCode,
          quantity: item.qty,
          rate: item.rate,
          per: item.unit || "Brass",
          amount: item.amount
        })),
        taxes: [
          { label: "CGST", rate_percent: 9, amount: invoiceData.cgstAmount || 0 },
          { label: "SGST", rate_percent: 9, amount: invoiceData.sgstAmount || 0 }
        ],
        totals: {
          subtotal: invoiceData.subtotal || 0,
          total_tax: (invoiceData.cgstAmount || 0) + (invoiceData.sgstAmount || 0),
          round_off: invoiceData.roundoff || 0,
          grand_total: invoiceData.grandTotal || 0,
          total_quantity: invoiceData.items?.reduce((acc: number, item: any) => acc + item.qty, 0) || 0,
          total_quantity_unit: invoiceData.items?.[0]?.unit || "Brass",
          amount_in_words: "INR " + (invoiceData.amountWords || "") + " Only"
        },
        bank_details: {
          bank_name: companyData.bankName || template.invoice.bank_details.bank_name,
          account_no: companyData.accountNumber || template.invoice.bank_details.account_no,
          branch: companyData.branch || template.invoice.bank_details.branch,
          ifsc_code: companyData.ifsc || template.invoice.bank_details.ifsc_code,
        },
        footer: template.invoice.footer
      },
      layout: template.layout,
      formatting_rules: template.formatting_rules
    };

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
    // also clean up html
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
