"use client";

import { useState, useEffect } from "react";

export default function Settings() {
  const [formData, setFormData] = useState<any>({
    phoneNumber: "",
    photoUrl: "",
    upiId: "",
    bankLogoUrl: "",
    addressLines: [""],
    bankDetails: {},
    footer: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBankLogo, setUploadingBankLogo] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setFormData((prev: any) => ({
            ...prev,
            ...data,
            addressLines: data.addressLines?.length ? data.addressLines : [""],
            bankDetails: { ...prev.bankDetails, ...data.bankDetails },
            footer: { ...prev.footer, ...data.footer },
            templateName: data.templateName || "default",
          }));
        }
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, section?: string) => {
    const { name, value } = e.target;
    if (section === "bankDetails") {
      setFormData((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, [name]: value } }));
    } else if (section === "footer") {
      setFormData((prev: any) => ({ ...prev, footer: { ...prev.footer, [name]: value } }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === "logoUrl") setUploadingLogo(true);
    else setUploadingBankLogo(true);

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_upload");

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      setFormData((prev: any) => ({ ...prev, [field]: json.secure_url }));
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      if (field === "logoUrl") setUploadingLogo(false);
      else setUploadingBankLogo(false);
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
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">

        {/* PDF Template Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">PDF Template</label>
            <select name="templateName" value={formData.templateName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900">
              <option value="default">Default</option>
              <option value="simple">Simple template</option>
            </select>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Prefix</label>
              <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" placeholder="e.g. INV-" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">UPI ID</label>
              <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" placeholder="e.g. username@bank" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
              <div className="flex items-center gap-3">
                {formData.logoUrl && (
                  <img src={formData.logoUrl} alt="Logo" className="h-10 w-auto object-contain border rounded" />
                )}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, "logoUrl")} disabled={uploadingLogo} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                {uploadingLogo && <span className="text-sm text-blue-600">Uploading...</span>}
              </div>
            </div>
            {/* Bank Logo Upload */}
            <div className="flex items-center gap-3 mb-4">
              {formData.bankLogoUrl && (
                <img src={formData.bankLogoUrl} alt="Bank Logo" className="h-10 w-auto object-contain border rounded" />
              )}
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, "bankLogoUrl")} disabled={uploadingBankLogo} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              {uploadingBankLogo && <span className="text-sm text-blue-600">Uploading...</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GSTIN / UIN</label>
            <input type="text" name="gstinUin" value={formData.gstinUin} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State Name</label>
            <input type="text" name="stateName" value={formData.stateName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State Code</label>
            <input type="text" name="stateCode" value={formData.stateCode} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          {formData.addressLines.map((line: string, idx: number) => (
            <input key={idx} type="text" value={line} onChange={(e) => handleAddressChange(idx, e.target.value)} className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder={`Address Line ${idx + 1}`} />
          ))}
          <button type="button" onClick={addAddressLine} className="text-sm text-blue-600 hover:text-blue-800">+ Add Address Line</button>
        </div>


        {/* Bank Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bank Name</label>
              <input type="text" name="bankName" value={formData.bankDetails.bankName} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account No.</label>
              <input type="text" name="accountNo" value={formData.bankDetails.accountNo} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <input type="text" name="branch" value={formData.bankDetails.branch} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
              <input type="text" name="ifscCode" value={formData.bankDetails.ifscCode} onChange={(e) => handleChange(e, "bankDetails")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
          </div>
        </div>

        {/* Footer Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Footer Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Declaration</label>
              <textarea name="declaration" value={formData.footer.declaration} onChange={(e) => handleChange(e, "footer")} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Signatory Label (e.g., for Company Name)</label>
              <input type="text" name="signatoryLabel" value={formData.footer.signatoryLabel} onChange={(e) => handleChange(e, "footer")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Signatory Title</label>
              <input type="text" name="signatoryTitle" value={formData.footer.signatoryTitle} onChange={(e) => handleChange(e, "footer")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jurisdiction Note</label>
              <input type="text" name="jurisdictionNote" value={formData.footer.jurisdictionNote} onChange={(e) => handleChange(e, "footer")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" />
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
