"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DocumentPlusIcon, DocumentIcon, TrashIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";

export default function Home() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data);
  };

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      fetchInvoices();
    }
  };

  const handleDownload = async (invoice: any) => {
    try {
      setDownloadingId(invoice._id);
      const blob = await pdf(<InvoicePDF data={invoice} settings={settings} />).toBlob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${invoice.invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <DocumentPlusIcon className="w-5 h-5" /> Create Invoice
        </Link>
      </div>

          {/* Table view for md and larger */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <DocumentIcon className="w-12 h-12 text-gray-300" />
                        <p>No invoices found. Create your first invoice!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{invoice.invoiceNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.dated).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.buyer?.companyName || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">₹{invoice.totals?.grandTotal?.toFixed(2) || "0.00"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleDownload(invoice)} disabled={downloadingId === invoice._id} className="text-blue-600 hover:text-blue-900 disabled:opacity-50" title="Download Invoice">
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(invoice._id)} className="text-red-600 hover:text-red-900 ml-4" title="Delete Invoice">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Card view for mobile */}
          <div className="block md:hidden">
            {invoices.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <DocumentIcon className="w-12 h-12 text-gray-300" />
                  <p>No invoices found. Create your first invoice!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice._id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-medium text-gray-900">{invoice.invoiceNo}</h2>
                      <div className="flex gap-4">
                        <button onClick={() => handleDownload(invoice)} disabled={downloadingId === invoice._id} className="text-blue-600 hover:text-blue-900 disabled:opacity-50" title="Download Invoice">
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(invoice._id)} className="text-red-600 hover:text-red-900" title="Delete Invoice">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Date: {new Date(invoice.dated).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Client: {invoice.buyer?.companyName || "N/A"}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-2">₹{invoice.totals?.grandTotal?.toFixed(2) || "0.00"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
    </div>
  );
}
