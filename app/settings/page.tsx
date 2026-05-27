"use client";

import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    address: "",
    state: "",
    phone: "",
    email: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    invoicePrefix: "",
    declaration: "",
    logo: ""
  });

  useEffect(() => {
    const fetchCompany = async () => {
      const res = await fetch("/api/companies/settings");
      const data = await res.json();
      if (data.company) {
        const logo = data.company.logo || "";
        setFormData({
          companyName: data.company.companyName || "",
          gstNumber: data.company.gstNumber || "",
          address: data.company.address || "",
          state: data.company.state || "",
          phone: data.company.phone || "",
          email: data.company.email || "",
          bankName: data.company.bankName || "",
          accountNumber: data.company.accountNumber || "",
          ifsc: data.company.ifsc || "",
          invoicePrefix: data.company.invoicePrefix || "",
          declaration: data.company.declaration || "",
          logo
        });
        if (logo) setLogoPreview(logo);
      }
      setLoading(false);
    };
    fetchCompany();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setFormData(prev => ({ ...prev, logo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setFormData(prev => ({ ...prev, logo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/companies/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert("Settings saved successfully!");
    } else {
      alert("Failed to save settings");
    }
  };

  if (loading) return <AppLayout><div className="p-8">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your company profile and invoice details.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Company Logo (1:1 square)</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 border-2 border-dashed border-muted-foreground/40 rounded-lg flex items-center justify-center cursor-pointer bg-muted/20 overflow-hidden hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground text-center px-1">Click to upload</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                    {logoPreview && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive block" onClick={handleRemoveLogo}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <p className="text-xs text-muted-foreground">Recommended: square PNG or JPG, max 1MB</p>
              </div>

              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} required />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={formData.ifsc} onChange={(e) => setFormData({...formData, ifsc: e.target.value})} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input value={formData.invoicePrefix} onChange={(e) => setFormData({...formData, invoicePrefix: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Declaration</Label>
                  <Input value={formData.declaration} onChange={(e) => setFormData({...formData, declaration: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg">Save Changes</Button>
        </div>
      </form>
    </AppLayout>
  );
}
