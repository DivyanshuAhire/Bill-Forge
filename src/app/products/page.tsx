"use client";

import { useState, useEffect } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Product {
  _id: string;
  description: string;
  hsnSac: string;
  unit: string;
  rate: number;
  cgstRate: number;
  sgstRate: number;
}

const getEmptyProductForm = () => ({
  description: "",
  hsnSac: "",
  unit: "",
  rate: 0,
  cgstRate: 0,
  sgstRate: 0,
});

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getEmptyProductForm);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProductId(null);
    setFormData(getEmptyProductForm());
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product._id);
    setFormData({
      description: product.description,
      hsnSac: product.hsnSac,
      unit: product.unit,
      rate: product.rate,
      cgstRate: product.cgstRate,
      sgstRate: product.sgstRate,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingProductId ? { ...formData, id: editingProductId } : formData;
    const res = await fetch("/api/products", {
      method: editingProductId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const savedProduct = await res.json();
      setProducts((prev) =>
        editingProductId
          ? prev.map((product) => (product._id === editingProductId ? savedProduct : product))
          : [...prev, savedProduct]
      );
    }

    setShowModal(false);
    setEditingProductId(null);
    setFormData(getEmptyProductForm());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;

    const res = await fetch(`/api/products?id=${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setProducts((prev) => prev.filter((product) => product._id !== id));
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products Catalog</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="hidden md:block">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CGST %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SGST %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">No products found. Add one to get started.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{product.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.hsnSac || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.unit || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₹{product.rate?.toFixed(2) || "0.00"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{product.cgstRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{product.sgstRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:text-blue-800" aria-label={`Edit ${product.description}`}>
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 text-red-600 hover:text-red-800" aria-label={`Delete ${product.description}`}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block md:hidden">
        {products.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">No products found. Add one to get started.</div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">{product.description}</h2>
                    <p className="text-sm text-gray-600">HSN/SAC: {product.hsnSac || "-"}</p>
                    <p className="text-sm text-gray-600">Unit: {product.unit || "-"}</p>
                    <p className="text-sm text-gray-600">Rate: ₹{product.rate?.toFixed(2) || "0.00"}</p>
                    <p className="text-sm text-gray-600">CGST/SGST: {product.cgstRate}% / {product.sgstRate}%</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:text-blue-800" aria-label={`Edit ${product.description}`}>
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product._id)} className="p-2 text-red-600 hover:text-red-800" aria-label={`Delete ${product.description}`}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editingProductId ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description / Name</label>
                <input required type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">HSN/SAC</label>
                  <input type="text" value={formData.hsnSac} onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit (e.g. Kg, Pcs)</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rate per Unit</label>
                <input type="number" step="0.01" required value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CGST Rate (%)</label>
                  <input type="number" step="0.1" value={formData.cgstRate} onChange={(e) => setFormData({ ...formData, cgstRate: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SGST Rate (%)</label>
                  <input type="number" step="0.1" value={formData.sgstRate} onChange={(e) => setFormData({ ...formData, sgstRate: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingProductId ? "Save Changes" : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
