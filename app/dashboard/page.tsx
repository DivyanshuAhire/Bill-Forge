"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, IndianRupee, Package } from "lucide-react";

export default function DashboardPage() {
  // In a real app, you would fetch these from an API endpoint like /api/dashboard/stats
  const [stats, setStats] = useState({
    todayInvoices: 0,
    monthlyRevenue: 0,
    customerCount: 0,
    productCount: 0
  });

  useEffect(() => {
    // Mock fetch for now, we have customers and products APIs we could fetch and count
    const fetchStats = async () => {
      try {
        const [custRes, prodRes, invRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
          fetch("/api/invoices")
        ]);
        
        const custData = await custRes.json();
        const prodData = await prodRes.json();
        const invData = await invRes.json();

        const invoices = invData.invoices || [];
        
        // Calculate today's invoices
        const today = new Date().toDateString();
        const todayInvoices = invoices.filter((i: any) => new Date(i.createdAt).toDateString() === today).length;
        
        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = invoices
          .filter((i: any) => new Date(i.createdAt).getMonth() === currentMonth)
          .reduce((acc: number, curr: any) => acc + curr.grandTotal, 0);

        setStats({
          todayInvoices,
          monthlyRevenue,
          customerCount: custData.customers?.length || 0,
          productCount: prodData.products?.length || 0
        });

      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your billing activity.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customerCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
