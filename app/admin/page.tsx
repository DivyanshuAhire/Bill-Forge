"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
  const [companies, setCompanies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "", ownerName: "", email: "", phone: "",
    username: "", password: "", gstNumber: "", address: "", state: "", invoicePrefix: ""
  });

  const fetchCompanies = async () => {
    const res = await fetch("/api/admin/companies");
    const data = await res.json();
    setCompanies(data.companies || []);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsOpen(false);
      setFormData({
        companyName: "", ownerName: "", email: "", phone: "",
        username: "", password: "", gstNumber: "", address: "", state: "", invoicePrefix: ""
      });
      fetchCompanies();
    } else {
      const data = await res.json();
      alert("Error: " + data.error);
    }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
          <p className="text-muted-foreground mt-2">Manage companies on BillForge.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger>
            <Button>Create Company</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Invoice Prefix (e.g. SSN/26-27/)</Label>
                <Input value={formData.invoicePrefix} onChange={(e) => setFormData({...formData, invoicePrefix: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                <div className="space-y-2">
                  <Label>Admin Username</Label>
                  <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Admin Password</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Save Company</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length > 0 ? companies.map((c: any) => (
              <TableRow key={c._id}>
                <TableCell className="font-medium">{c.companyName}</TableCell>
                <TableCell>{c.ownerName}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No companies found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
