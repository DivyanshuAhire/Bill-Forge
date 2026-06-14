"use client";

import { useState, useEffect } from "react";

export default function Settings() {
  const [formData, setFormData] = useState({
    companyName: "",
    invoicePrefix: "INV-",
    logoUrl: "",
    addressLines: [""],
    gstinUin: "",
    stateName: "",
    stateCode: "",
    email: "",
    bankDetails: {
      bankName: "",
      accountNo: "",
      branch: "",
      ifscCode: "",
    },
    footer: {
      declaration: "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
      eoAndE: "E. & O.E",
      signatoryLabel: "",
      signatoryTitle: "Authorised Signatory",
      jurisdictionNote: "SUBJECT TO JURISDICTION",
      computerGeneratedNote: "This is a Computer Generated Invoice",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setFormData((prev) => ({
            ...prev,
            ...data,
            addressLines: data.addressLines?.length ? data.addressLines : [""],
            bankDetails: { ...prev.bankDetails, ...data.bankDetails },
            footer: { ...prev.footer, ...data.footer },
          }));
        }
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section?: string) => {
    const { name, value } = e.target;
    if (section === "bankDetails") {
      setFormData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, [name]: value } }));
    } else if (section === "footer") {
      setFormData((prev) => ({ ...prev, footer: { ...prev.footer, [name]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddressChange = (index: number, value: string) => {
    const newAddress = [...formData.addressLines];
    newAddress[index] = value;
    setFormData({ ...formData, addressLines: newAddress });
  };

  const addAddressLine = () => {
    setFormData({ ...formData, addressLines: [...formData.addressLines, ""] });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    setUploadingLogo(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);

    try {
      if (!cloudName || !uploadPreset) {
        alert('Upload failed. Ensure Cloudinary environment variables NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set.');
        setUploadingLogo(false);
        return;
      }
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setFormData((prev) => ({ ...prev, logoUrl: fileData.secure_url }));
      } else {
        alert("Upload failed. Make sure Cloudinary env variables are set.");
      }
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setSaving(false);
    window.location.reload(); // Reload to update sidebar name
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Company Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Prefix</label>
              <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="e.g. INV-" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
              <div className="flex items-center gap-3">
                {formData.logoUrl && (
                  <img src={formData.logoUrl} alt="Logo" className="h-10 w-auto object-contain border rounded" />
                )}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                {uploadingLogo && <span className="text-sm text-blue-600">Uploading...</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">GSTIN / UIN</label>
              <input type="text" name="gstinUin" value={formData.gstinUin} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State Name</label>
              <input type="text" name="stateName" value={formData.stateName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State Code</label>
              <input type="text" name="stateCode" value={formData.stateCode} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            {formData.addressLines.map((line, idx) => (
              <input key={idx} type="text" value={line} onChange={(e) => handleAddressChange(idx, e.target.value)} className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder={`Address Line ${idx + 1}`} />
            ))}
            <button type="button" onClick={addAddressLine} className="text-sm text-blue-600 hover:text-blue-800">+ Add Address Line</button>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bank Name</label>
              <input type="text" name="bankName" value={formData.bankDetails.bankName} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account No.</label>
              <input type="text" name="accountNo" value={formData.bankDetails.accountNo} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <input type="text" name="branch" value={formData.bankDetails.branch} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
              <input type="text" name="ifscCode" value={formData.bankDetails.ifscCode} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
        </div>

        {/* Footer Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Footer Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Declaration</label>
              <textarea name="declaration" value={formData.footer.declaration} onChange={(e) => handleChange(e, "footer")} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Signatory Label (e.g., for Company Name)</label>
              <input type="text" name="signatoryLabel" value={formData.footer.signatoryLabel} onChange={(e) => handleChange(e, "footer")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Signatory Title</label>
              <input type="text" name="signatoryTitle" value={formData.footer.signatoryTitle} onChange={(e) => handleChange(e, "footer")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jurisdiction Note</label>
              <input type="text" name="jurisdictionNote" value={formData.footer.jurisdictionNote} onChange={(e) => handleChange(e, "footer")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
