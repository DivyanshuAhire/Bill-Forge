"use client";

import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import styles from "./page.module.css";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { formatIndianNumber, indianNumberToWords } from "@/lib/formatIndian";

export default function CreateInvoice() {
  const [settings, setSettings] = useState<any>({});
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [invoiceData, setInvoiceData] = useState<any>({
    invoiceNo: "",
    dated: new Date().toISOString().split("T")[0],
    buyerId: "",
    buyer: {},
    consignee: {},
    lineItems: [],
    totals: { subtotal: 0, cgstTotal: 0, sgstTotal: 0, totalTax: 0, roundOff: 0, grandTotal: 0, totalQuantity: 0, amountInWords: "" },
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setSettings);
    fetch("/api/clients").then(r => r.json()).then(data => {
      setClients(data);
      setFilteredClients(data);
    });
    fetch("/api/products").then(r => r.json()).then(setProducts);
    fetch("/api/invoices/next").then(r => r.json()).then(data => {
      if (data.nextInvoiceNo) {
        setInvoiceData((prev: any) => ({ ...prev, invoiceNo: data.nextInvoiceNo }));
      }
    });
  }, []);

  const handleBuyerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buyerId = e.target.value;
    const buyer = clients.find(c => c._id === buyerId);
    setInvoiceData({ ...invoiceData, buyerId, buyer: buyer || {}, consignee: buyer || {} });
  };

  const addLineItem = () => {
    setInvoiceData({
      ...invoiceData,
      lineItems: [
        ...invoiceData.lineItems,
        { productId: "", slNo: invoiceData.lineItems.length + 1, description: "", hsnSac: "", quantity: 1, unit: "", rate: 0, amount: 0, cgstRate: 0, sgstRate: 0, cgstAmount: 0, sgstAmount: 0 }
      ]
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceData.lineItems];
    
    if (field === "productId") {
      const product = products.find(p => p._id === value);
      if (product) {
        newItems[index] = { ...newItems[index], productId: value, description: product.description, hsnSac: product.hsnSac, unit: product.unit, rate: product.rate, cgstRate: product.cgstRate, sgstRate: product.sgstRate };
      }
    } else if (field === "description") {
      const product = products.find(p => p.description === value);
      if (product) {
        newItems[index] = { ...newItems[index], productId: product._id, description: product.description, hsnSac: product.hsnSac, unit: product.unit, rate: product.rate, cgstRate: product.cgstRate, sgstRate: product.sgstRate };
      } else {
        newItems[index].description = value;
        newItems[index].productId = "";
      }
    } else {
      newItems[index][field] = value;
    }

    // Auto calculate
    const qty = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    const amount = qty * rate;
    const cgstAmount = amount * ((parseFloat(newItems[index].cgstRate) || 0) / 100);
    const sgstAmount = amount * ((parseFloat(newItems[index].sgstRate) || 0) / 100);

    newItems[index].amount = amount;
    newItems[index].cgstAmount = cgstAmount;
    newItems[index].sgstAmount = sgstAmount;

    recalculateTotals(newItems);
  };

  const removeLineItem = (index: number) => {
    const newItems = invoiceData.lineItems.filter((_: any, i: number) => i !== index);
    recalculateTotals(newItems);
  };

  const recalculateTotals = (items: any[]) => {
    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let totalQuantity = 0;

    items.forEach(i => {
      subtotal += i.amount;
      cgstTotal += i.cgstAmount;
      sgstTotal += i.sgstAmount;
      totalQuantity += parseFloat(i.quantity) || 0;
    });

    const totalTax = cgstTotal + sgstTotal;
    const rawGrandTotal = subtotal + totalTax;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = grandTotal - rawGrandTotal;
    
    let amountInWords = "";
    try {
      amountInWords = indianNumberToWords(grandTotal).toUpperCase();
    } catch (e) {}

    setInvoiceData({
      ...invoiceData,
      lineItems: items,
      totals: { subtotal, cgstTotal, sgstTotal, totalTax, roundOff, grandTotal, totalQuantity, amountInWords }
    });
  };

  const generatePDF = async (overrideData?: any) => {
    const data = overrideData || invoiceData;
    const blob = await pdf(<InvoicePDF data={data} settings={settings} />).toBlob();
    const url = URL.createObjectURL(blob);
    
    // Auto download
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${data.invoiceNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Auto share on mobile
    if (navigator.share) {
      const file = new File([blob], `Invoice_${data.invoiceNo}.pdf`, { type: "application/pdf" });
      try {
        await navigator.share({ files: [file], title: `Invoice ${data.invoiceNo}` });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (settings?.templateName === "simple" && invoiceData.simpleName && !invoiceData.buyerId) {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName: invoiceData.simpleName })
        });
        const newClient = await res.json();
        invoiceData.buyerId = newClient._id;
      }
    // Save invoice and capture server response (which includes the final invoiceNo)
    const saveRes = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData)
    });
    const savedInvoice = await saveRes.json();
    // Ensure the PDF uses the server‑generated invoice number
    const updatedData = { ...invoiceData, invoiceNo: savedInvoice.invoiceNo || invoiceData.invoiceNo };
    await generatePDF(updatedData);
    setSaving(false);
    window.location.href = "/";
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Invoice</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
        
        {/* Template-specific fields */}
          {settings?.templateName === "simple" ? (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <AutocompleteInput
                  value={invoiceData.simpleName || ""}
                  onChange={(val) => {
                    const existing = clients.find(c => c.companyName === val);
                    setInvoiceData({ 
                      ...invoiceData, 
                      simpleName: val,
                      buyerId: existing ? existing._id : "",
                      buyer: existing || { companyName: val },
                      consignee: existing || { companyName: val }
                    });
                  }}
                  options={clients.map(c => c.companyName)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  placeholder="Search existing customer or enter new..."
                  required
                />
              </div>
            </div>
          ) : (
            <>
              {/* Existing meta info fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice No.</label>
                  <input required type="text" value={invoiceData.invoiceNo} onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNo: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input required type="date" value={invoiceData.dated} onChange={(e) => setInvoiceData({ ...invoiceData, dated: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Client (Buyer)</label>
                  <AutocompleteInput
                    value={invoiceData.buyer?.companyName || ""}
                    onChange={(val) => {
                      const existing = clients.find(c => c.companyName === val);
                      if (existing) {
                        setInvoiceData({ ...invoiceData, buyerId: existing._id, buyer: existing, consignee: existing });
                      } else {
                        setInvoiceData({ ...invoiceData, buyerId: "", buyer: { companyName: val }, consignee: { companyName: val } });
                      }
                    }}
                    options={clients.map(c => c.companyName)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                    placeholder="Search and select existing customer..."
                    required
                  />
                </div>
              </div>
            </>
          )}

        {/* Line Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Line Items</h2>
            <button type="button" onClick={addLineItem} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm transition-colors">
              <PlusIcon className="w-5 h-5" /> Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto pb-48">
            <table className={"min-w-full divide-y divide-gray-200 " + styles.lineItemsTable}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Rate</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">CGST %</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">SGST %</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Amount</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceData.lineItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-2" data-label="Product">
                      <AutocompleteInput 
                        value={item.description || ''} 
                        onChange={(val) => updateLineItem(index, "description", val)}
                        options={products.map((p: any) => p.description)}
                        placeholder="Search or enter product..."
                        className="block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm" 
                      />
                    </td>
                    <td className="px-3 py-2" data-label="Qty">
                      <input type="number" min="0.01" step="0.01" required value={item.quantity} onChange={(e) => updateLineItem(index, "quantity", e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm" />
                    </td>
                    <td className="px-3 py-2" data-label="Rate">
                      <input type="number" step="0.01" value={item.rate} onChange={(e) => updateLineItem(index, "rate", e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm" />
                    </td>
                    <td className="px-3 py-2" data-label="CGST %">
                      <input type="number" step="0.1" value={item.cgstRate} onChange={(e) => updateLineItem(index, "cgstRate", e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm" />
                    </td>
                    <td className="px-3 py-2" data-label="SGST %">
                      <input type="number" step="0.1" value={item.sgstRate} onChange={(e) => updateLineItem(index, "sgstRate", e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm" />
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-gray-900 font-medium" data-label="Amount">
                      ₹{formatIndianNumber(item.amount)}
                    </td>
                    <td className="px-3 py-2 text-right" data-label="Actions">
                      <button type="button" onClick={() => removeLineItem(index)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Box */}
        <div className="flex justify-end">
          <div className="w-72 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>₹{formatIndianNumber(invoiceData.totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>CGST:</span>
              <span>₹{formatIndianNumber(invoiceData.totals.cgstTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>SGST:</span>
              <span>₹{formatIndianNumber(invoiceData.totals.sgstTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Round Off:</span>
              <span>₹{formatIndianNumber(invoiceData.totals.roundOff)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
              <span>Grand Total:</span>
              <span>₹{formatIndianNumber(invoiceData.totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button type="submit" disabled={saving || invoiceData.lineItems.length === 0} className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors shadow-sm">
            {saving ? "Saving & Generating..." : "Generate Bill & Download PDF"}
          </button>
        </div>
      </form>
    </div>
  );
}
