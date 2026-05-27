"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { numberToWords } from "@/utils/numberToWords";
import { generateInvoicePdf, downloadPdf } from "@/utils/generatePdf";
// Load invoice template (JSON) from template.txt
// eslint-disable-next-line @typescript-eslint/no-var-requires
const invoiceTemplate = require("@/utils/template.json");

export default function CreateInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [company, setCompany] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState([{ productId: "", qty: 1, rate: 0, amount: 0, cgst: 0, sgst: 0, name: "", unit: "", hsnCode: "" }]);

  useEffect(() => {
    const fetchData = async () => {
      const [custRes, prodRes, compRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/products"),
        fetch("/api/companies/settings")
      ]);
      const custData = await custRes.json();
      const prodData = await prodRes.json();
      const compData = await compRes.json();

      setCustomers(custData.customers || []);
      setProducts(prodData.products || []);
      setCompany(compData.company || {});
    };
    fetchData();
  }, []);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p: any) => p._id === productId) as any;
    const newItems = [...items];
    if (product) {
      newItems[index] = {
        ...newItems[index],
        productId,
        rate: product.rate,
        cgst: product.cgstPercent,
        sgst: product.sgstPercent,
        name: product.name,
        unit: product.unit,
        hsnCode: product.hsnCode,
        amount: product.rate * newItems[index].qty
      };
    }
    setItems(newItems);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].qty = qty;
    newItems[index].amount = newItems[index].rate * qty;
    setItems(newItems);
  };

  const handleRateChange = (index: number, rate: number) => {
    const newItems = [...items];
    newItems[index].rate = rate;
    newItems[index].amount = rate * newItems[index].qty;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: "", qty: 1, rate: 0, amount: 0, cgst: 0, sgst: 0, name: "", unit: "", hsnCode: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  // Simplification for V1: calculating GST on overall subtotal based on the first item's GST % 
  // (Assuming single product mostly, as per "Even if crusher mostly uses one item" rule)
  const cgstPercent = items[0]?.cgst || 0;
  const sgstPercent = items[0]?.sgst || 0;

  const cgstAmount = Number((subtotal * (cgstPercent / 100)).toFixed(2));
  const sgstAmount = Number((subtotal * (sgstPercent / 100)).toFixed(2));
  const totalBeforeRound = subtotal + cgstAmount + sgstAmount;
  const grandTotal = Math.round(totalBeforeRound);
  const roundoff = Number((grandTotal - totalBeforeRound).toFixed(2));
  const amountWords = numberToWords(grandTotal);

  const handleSaveAndGenerate = async () => {
    if (!selectedCustomer) return alert("Select a customer");
    if (!items[0].productId) return alert("Add at least one product");

    const payload = {
      customerId: selectedCustomer,
      subtotal,
      cgstAmount,
      sgstAmount,
      roundoff,
      grandTotal,
      amountWords,
      items: items.map(i => ({ productId: i.productId, qty: i.qty, rate: i.rate, amount: i.amount }))
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      // Generate PDF
      const customer = customers.find((c: any) => c._id === selectedCustomer);
      const invoiceDataForPdf = {
        invoiceNumber: data.invoice.invoiceNumber,
        invoiceDate: data.invoice.invoiceDate,
        customer,
        items: items.map(i => ({
          productName: i.name,
          hsnCode: i.hsnCode,
          qty: i.qty,
          unit: i.unit,
          rate: i.rate,
          amount: i.amount,
          cgstPercent: i.cgst,
          sgstPercent: i.sgst
        })),
        subtotal,
        cgstAmount,
        sgstAmount,
        roundoff,
        grandTotal,
        amountWords
      };

      const pdfBytes = await generateInvoicePdf(invoiceTemplate, { invoiceData: invoiceDataForPdf, companyData: company });
      downloadPdf(pdfBytes, `${data.invoice.invoiceNumber.replace(/\//g, "_")}.pdf`);
      router.push("/invoices");
    } else {
      alert("Failed to create invoice: " + data.error);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <Label>Select Customer</Label>
              <Select onValueChange={(value: any) => setSelectedCustomer(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end mb-4">
                <div className="flex-1 space-y-2">
                  <Label>Product</Label>
                  <Select onValueChange={(val: any) => handleProductChange(index, val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qty</Label>
                  <Input type="number" value={item.qty} onChange={(e) => handleQtyChange(index, parseFloat(e.target.value))} />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Rate</Label>
                  <Input type="number" value={item.rate} onChange={(e) => handleRateChange(index, parseFloat(e.target.value))} />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" value={item.amount} disabled />
                </div>
                <Button variant="destructive" onClick={() => removeItem(index)}>X</Button>
              </div>
            ))}
            <Button variant="outline" onClick={addItem}>+ Add Item</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="w-64 ml-auto space-y-2 text-right">
              <div className="flex justify-between"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>CGST ({cgstPercent}%):</span> <span>₹{cgstAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>SGST ({sgstPercent}%):</span> <span>₹{sgstAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Roundoff:</span> <span>₹{roundoff.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-xl pt-2 border-t"><span>Total:</span> <span>₹{grandTotal}</span></div>
            </div>
            <div className="mt-4 text-right italic">
              Amount in words: {amountWords} Rupees
            </div>
            <div className="mt-6 flex justify-end">
              <Button size="lg" onClick={handleSaveAndGenerate}>Generate Invoice</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
