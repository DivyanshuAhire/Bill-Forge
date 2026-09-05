"use client";

import { useState, useEffect } from "react";
import { formatIndianNumber } from "@/lib/formatIndian";
import { 
  ShoppingCartIcon, 
  CurrencyRupeeIcon, 
  ArrowTrendingUpIcon, 
  CheckCircleIcon, 
  BanknotesIcon,
  ClockIcon,
  WalletIcon
} from "@heroicons/react/24/outline";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface SummaryData {
  totalBuying: number | null;
  totalSelling: number | null;
  totalProfit: number | null;
  totalReceived: number | null;
  totalPaid: number | null;
}

interface ProductRow {
  name: string;
  unitsSold: number;
  totalRevenue: number;
}

/* ── Components ────────────────────────────────────────────────────────── */

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "text-gray-900" 
}: { 
  title: string, 
  value: number | null | undefined, 
  icon: any, 
  color?: string 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500 tracking-wide">{title}</span>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className={`text-3xl font-bold ${color}`}>
        {value !== null && value !== undefined
          ? `₹${formatIndianNumber(value)}`
          : "—"}
      </p>
    </div>
  );
}

/* ── Main Page Component ───────────────────────────────────────────────── */

export default function SummaryPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  /* ── Fetch financial summary from Apps Script ──────────────────────── */
  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summary");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to fetch summary");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch product analytics from DB ───────────────────────────────── */
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/summary/products");
      const json = await res.json();
      if (res.ok) setProducts(json.products || []);
    } catch {
      /* silent – product section simply stays empty */
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchProducts();
  }, []);

  /* ── Derived metrics ───────────────────────────────────────────────── */
  const dues = data ? (data.totalBuying || 0) - (data.totalPaid || 0) : null;
  const balance = data ? (data.totalSelling || 0) - (data.totalReceived || 0) : null;

  const profitMargin =
    data?.totalSelling && data.totalSelling > 0 && data.totalProfit !== null
      ? Math.min(Math.max((data.totalProfit / data.totalSelling) * 100, 0), 100)
      : 0;

  const collectionRatio =
    data?.totalSelling && data.totalSelling > 0 && data.totalReceived !== null
      ? Math.min(Math.max((data.totalReceived / data.totalSelling) * 100, 0), 100)
      : 0;

  const maxRevenue = products.length > 0 ? products[0].totalRevenue : 0;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Financial Summary</h1>
        <button
          onClick={() => { fetchSummary(); fetchProducts(); }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* ── Error state ─────────────────────────────────────────────── */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-center">
          <p className="text-amber-800 font-medium text-lg mb-2">⚠️ Setup Required</p>
          <p className="text-amber-700 text-sm">{error}</p>
          <a
            href="/settings"
            className="inline-block mt-4 px-5 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium transition-colors"
          >
            Go to Settings
          </a>
        </div>
      )}

      {/* ── Skeleton loader ─────────────────────────────────────────── */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse text-center">
             <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
             <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      {data && (
        <>
          {/* Total Profit - Top Level */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow mb-6">
            <div className="flex justify-center items-center gap-2 mb-2">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Profit</h2>
            </div>
            <p className="text-5xl font-extrabold text-green-600 tracking-tight">
              {data.totalProfit !== null && data.totalProfit !== undefined
                ? `₹${formatIndianNumber(data.totalProfit)}`
                : "—"}
            </p>
          </div>

          {/* Buying Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard title="Total Buying" value={data.totalBuying} icon={ShoppingCartIcon} />
            <MetricCard title="Total Paid" value={data.totalPaid} icon={BanknotesIcon} />
            <MetricCard title="Dues" value={dues} icon={ClockIcon} color="text-orange-600" />
          </div>

          {/* Selling Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <MetricCard title="Total Selling" value={data.totalSelling} icon={CurrencyRupeeIcon} />
            <MetricCard title="Total Received" value={data.totalReceived} icon={CheckCircleIcon} />
            <MetricCard title="Balance" value={balance} icon={WalletIcon} color="text-blue-600" />
          </div>

          {/* ── Visual Insights ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Profit Margin Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Profit Margin
              </h3>
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${profitMargin}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">0%</span>
                <span className="text-sm font-bold text-green-600">{profitMargin.toFixed(1)}%</span>
                <span className="text-xs text-gray-400">100%</span>
              </div>
            </div>

            {/* Collection Ratio Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Collection Ratio (Received / Selling)
              </h3>
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${collectionRatio}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">0%</span>
                <span className="text-sm font-bold text-blue-600">{collectionRatio.toFixed(1)}%</span>
                <span className="text-xs text-gray-400">100%</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Product Performance ─────────────────────────────────────── */}
      <div className="mt-2">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Product Performance</h2>

        {productsLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        )}

        {!productsLoading && products.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">No invoice data yet. Create invoices to see product analytics.</p>
          </div>
        )}

        {!productsLoading && products.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-right">Units Sold</div>
              <div className="col-span-4 text-right">Revenue</div>
            </div>

            {/* Rows */}
            {products.map((p, idx) => {
              const barWidth = maxRevenue > 0 ? (p.totalRevenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={p.name}
                  className="grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                >
                  <div className="col-span-1 text-sm text-gray-400 font-medium">{idx + 1}</div>
                  <div className="col-span-5">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    {/* Mini revenue bar */}
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-700">
                    {formatIndianNumber(p.unitsSold, 0)}
                  </div>
                  <div className="col-span-4 text-right text-sm font-bold text-gray-900">
                    ₹{formatIndianNumber(p.totalRevenue)}
                  </div>
                </div>
              );
            })}

            {/* Footer totals */}
            <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm font-bold">
              <div className="col-span-1" />
              <div className="col-span-5 text-gray-600">Total</div>
              <div className="col-span-2 text-right text-gray-700">
                {formatIndianNumber(products.reduce((s, p) => s + p.unitsSold, 0), 0)}
              </div>
              <div className="col-span-4 text-right text-gray-900">
                ₹{formatIndianNumber(products.reduce((s, p) => s + p.totalRevenue, 0))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
