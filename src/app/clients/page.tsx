"use client";

import { useState, useEffect } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Client {
  _id: string;
  companyName: string;
  gstinUin: string;
  stateName: string;
  stateCode: string;
  addressLines: string[];
}

const getEmptyClientForm = () => ({
  companyName: "",
  gstinUin: "",
  stateName: "",
  stateCode: "",
  addressLines: [""],
});

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getEmptyClientForm);

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

  const openAddModal = () => {
    setEditingClientId(null);
    setFormData(getEmptyClientForm());
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClientId(client._id);
    setFormData({
      companyName: client.companyName,
      gstinUin: client.gstinUin,
      stateName: client.stateName,
      stateCode: client.stateCode,
      addressLines: client.addressLines?.length ? client.addressLines : [""],
    });
    setShowModal(true);
  };

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
    const payload = editingClientId ? { ...formData, id: editingClientId } : formData;
    const res = await fetch("/api/clients", {
      method: editingClientId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const savedClient = await res.json();
      setClients((prev) =>
        editingClientId
          ? prev.map((client) => (client._id === editingClientId ? savedClient : client))
          : [...prev, savedClient]
      );
    }

    setShowModal(false);
    setEditingClientId(null);
    setFormData(getEmptyClientForm());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this client?")) return;

    const res = await fetch(`/api/clients?id=${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setClients((prev) => prev.filter((client) => client._id !== id));
    }
  };

  if (loading) return <div>Loading clients...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" /> Add Client
        </button>
      </div>

      {/* Table view for md and larger */}
      <div className="hidden md:block">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN/UIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No clients found. Add one to get started.</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{client.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.gstinUin || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.stateName} {client.stateCode ? `(${client.stateCode})` : ""}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{client.addressLines?.filter(Boolean).join(", ") || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(client)} className="p-2 text-blue-600 hover:text-blue-800" aria-label={`Edit ${client.companyName}`}>
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(client._id)} className="p-2 text-red-600 hover:text-red-800" aria-label={`Delete ${client.companyName}`}>
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
      {/* Card view for mobile */}
      <div className="block md:hidden">
        {clients.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">No clients found. Add one to get started.</div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">{client.companyName}</h2>
                    <p className="text-sm text-gray-600">GSTIN/UIN: {client.gstinUin || "-"}</p>
                    <p className="text-sm text-gray-600">State: {client.stateName} {client.stateCode ? `(${client.stateCode})` : ""}</p>
                    <p className="text-sm text-gray-600">Address: {client.addressLines?.filter(Boolean).join(", ") || "-"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(client)} className="p-2 text-blue-600 hover:text-blue-800" aria-label={`Edit ${client.companyName}`}>
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(client._id)} className="p-2 text-red-600 hover:text-red-800" aria-label={`Delete ${client.companyName}`}>
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editingClientId ? "Edit Client" : "Add New Client"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input required type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GSTIN/UIN</label>
                <input type="text" value={formData.gstinUin} onChange={(e) => setFormData({ ...formData, gstinUin: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingClientId ? "Save Changes" : "Save Client"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
