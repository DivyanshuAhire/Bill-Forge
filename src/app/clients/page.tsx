"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

interface Client {
  _id: string;
  companyName: string;
  gstinUin: string;
  stateName: string;
  stateCode: string;
  addressLines: string[];
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    gstinUin: "",
    stateName: "",
    stateCode: "",
    addressLines: [""],
  });

  const fetchClients = async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddressChange = (index: number, value: string) => {
    const newAddress = [...formData.addressLines];
    newAddress[index] = value;
    setFormData({ ...formData, addressLines: newAddress });
  };

  const addAddressLine = () => {
    setFormData({ ...formData, addressLines: [...formData.addressLines, ""] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    
    if (res.ok) {
      const newClient = await res.json();
      setClients([...clients, newClient]);
    }
    
    setShowModal(false);
    setFormData({ companyName: "", gstinUin: "", stateName: "", stateCode: "", addressLines: [""] });
  };

  if (loading) return <div>Loading clients...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN/UIN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No clients found. Add one to get started.</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{client.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.gstinUin || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.stateName} {client.stateCode ? `(${client.stateCode})` : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {client.addressLines?.filter(Boolean).join(", ") || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input required type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GSTIN/UIN</label>
                <input type="text" value={formData.gstinUin} onChange={(e) => setFormData({ ...formData, gstinUin: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">State Name</label>
                  <input type="text" value={formData.stateName} onChange={(e) => setFormData({ ...formData, stateName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State Code</label>
                  <input type="text" value={formData.stateCode} onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {formData.addressLines.map((line, idx) => (
                  <input key={idx} type="text" value={line} onChange={(e) => handleAddressChange(idx, e.target.value)} className="mb-2 block w-full border border-gray-300 rounded-md p-2" placeholder={`Address Line ${idx + 1}`} />
                ))}
                <button type="button" onClick={addAddressLine} className="text-sm text-blue-600 hover:text-blue-800">+ Add Address Line</button>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
