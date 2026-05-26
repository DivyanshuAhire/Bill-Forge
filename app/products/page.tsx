"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", hsnCode: "", unit: "Brass", rate: 0, cgstPercent: 2.5, sgstPercent: 2.5 
  });

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsOpen(false);
      setFormData({ name: "", hsnCode: "", unit: "Brass", rate: 0, cgstPercent: 2.5, sgstPercent: 2.5 });
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-2">Manage your inventory and rates.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input value={formData.hsnCode} onChange={(e) => setFormData({...formData, hsnCode: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Input type="number" step="0.01" value={formData.rate} onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CGST %</Label>
                  <Input type="number" step="0.01" value={formData.cgstPercent} onChange={(e) => setFormData({...formData, cgstPercent: parseFloat(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label>SGST %</Label>
                  <Input type="number" step="0.01" value={formData.sgstPercent} onChange={(e) => setFormData({...formData, sgstPercent: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Save Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 max-w-sm">
        <Input 
          placeholder="Search products..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>HSN Code</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>CGST %</TableHead>
              <TableHead>SGST %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? filteredProducts.map((product: any) => (
              <TableRow key={product._id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.hsnCode || "-"}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>₹{product.rate}</TableCell>
                <TableCell>{product.cgstPercent}%</TableCell>
                <TableCell>{product.sgstPercent}%</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
