"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FileDown, Plus } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");

  const fetchInvoices = async () => {
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data.invoices || []);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv: any) => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-2">Manage and track your generated invoices.</p>
        </div>
        <Link href="/invoices/create">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="mb-4 max-w-sm">
        <Input 
          placeholder="Search by invoice number or customer..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length > 0 ? filteredInvoices.map((invoice: any) => (
              <TableRow key={invoice._id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell>{invoice.customerId?.name}</TableCell>
                <TableCell>₹{invoice.grandTotal.toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    <FileDown size={16} className="mr-2" /> Download
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No invoices found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
