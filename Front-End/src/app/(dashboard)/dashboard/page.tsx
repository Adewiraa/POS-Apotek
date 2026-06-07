"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardAPI } from "@/lib/api";
import type { DashboardMetricsData } from "@/types/api";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
} from "lucide-react";

// ── Formatter ─────────────────────────────────────────────────
function formatRupiah(value: number): string {
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (value >= 1_000_000)
    return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (value >= 1_000)
    return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 animate-pulse">
      <div className="h-3 w-24 rounded bg-slate-200 mb-4" />
      <div className="h-8 w-32 rounded bg-slate-200 mb-3" />
      <div className="h-3 w-20 rounded bg-slate-100" />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
  accent: string;
}

function KpiCard({ label, value, sub, subColor = "text-slate-500", icon, accent }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-black uppercase tracking-[0.05em]">{label}</span>
        <span className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${accent}`}>
          {icon}
        </span>
      </div>
      <div className="text-[28px] font-black text-slate-900 leading-none">{value}</div>
      <div className={`text-xs font-extrabold ${subColor}`}>{sub}</div>
    </div>
  );
}

// ── Activity Border Mapping ───────────────────────────────────
const activityBorder: Record<string, string> = {
  danger: "border-rose-500",
  warning: "border-amber-500",
  info: "border-teal-500",
  success: "border-emerald-500",
};

// ── Main Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await DashboardAPI.getMetrics();
      if (res.status === "success") {
        setMetrics(res.data);
        setLastFetch(new Date());
      } else {
        setError("Server mengembalikan status tidak dikenal.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal terhubung ke server.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + auto-refresh setiap 60 detik
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const d = metrics;

  const omsetTrendIcon = d?.omset_hari_ini.trend === "up"
    ? <TrendingUp className="w-4 h-4" />
    : <TrendingDown className="w-4 h-4" />;
  const omsetSubColor = d?.omset_hari_ini.trend === "up" ? "text-emerald-600" : "text-rose-600";
  const omsetSub = d
    ? `${d.omset_hari_ini.trend === "up" ? "↑" : "↓"} ${Math.abs(d.omset_hari_ini.percentage)}% dari kemarin`
    : "";

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Operasional</h1>
          <p className="text-slate-500 mt-1">
            Monitoring omzet, stok kritis, resep, dan aktivitas apotek hari ini.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors rounded-[12px] px-4 py-2 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {lastFetch && (
            <span className="text-[11px] text-slate-400">
              Diperbarui {lastFetch.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-[16px] px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div>
            <p className="text-rose-800 font-bold text-sm">Gagal memuat data metrics</p>
            <p className="text-rose-600 text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchMetrics}
            className="ml-auto text-xs font-bold text-rose-700 hover:text-rose-900 underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : d ? (
          <>
            {/* Card 1: Omzet */}
            <KpiCard
              label={d.omset_hari_ini.label}
              value={formatRupiah(d.omset_hari_ini.value)}
              sub={omsetSub}
              subColor={omsetSubColor}
              icon={omsetTrendIcon}
              accent={d.omset_hari_ini.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}
            />

            {/* Card 2: Transaksi */}
            <KpiCard
              label={d.transaksi_hari_ini.label}
              value={d.transaksi_hari_ini.value.toString()}
              sub={`${d.transaksi_hari_ini.otc} OTC • ${d.transaksi_hari_ini.resep} Resep`}
              subColor="text-slate-500"
              icon={<ShoppingCart className="w-4 h-4" />}
              accent="bg-sky-50 text-sky-600"
            />

            {/* Card 3: Stok Kritis */}
            <KpiCard
              label={d.stok_kritis.label}
              value={d.stok_kritis.value.toString()}
              sub={`${d.stok_kritis.high_priority} item high priority (stok habis)`}
              subColor={d.stok_kritis.high_priority > 0 ? "text-rose-600" : "text-slate-500"}
              icon={<AlertTriangle className="w-4 h-4" />}
              accent={d.stok_kritis.high_priority > 0 ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"}
            />

            {/* Card 4: ED ≤ 90 Hari */}
            <KpiCard
              label={d.ed_kurang_90_hari.label}
              value={d.ed_kurang_90_hari.value.toString()}
              sub={`${d.ed_kurang_90_hari.butuh_fefo} batch butuh FEFO review`}
              subColor={d.ed_kurang_90_hari.butuh_fefo > 0 ? "text-rose-600" : "text-slate-500"}
              icon={<CalendarClock className="w-4 h-4" />}
              accent={d.ed_kurang_90_hari.butuh_fefo > 0 ? "bg-rose-50 text-rose-500" : "bg-violet-50 text-violet-500"}
            />
          </>
        ) : null}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-6 mt-2">
        {/* Weekly Bar Chart */}
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <h3 className="text-lg font-bold text-slate-900 m-0">Tren Penjualan Mingguan</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Omzet berdasarkan transaksi selesai (7 hari terakhir).</p>
          <div className="h-[240px] flex items-end gap-3 md:gap-4 border-l border-b border-slate-200 pt-5 px-2 pb-1">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold animate-pulse">
                Memuat chart...
              </div>
            ) : d?.sales_trend && d.sales_trend.length > 0 ? (
              (() => {
                const maxTotal = Math.max(...d.sales_trend.map(item => item.total));
                return d.sales_trend.map((item, i) => {
                  const percent = maxTotal > 0 ? (item.total / maxTotal) * 85 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-md">
                        {formatRupiah(item.total)}
                      </div>
                      <div
                        className="w-full rounded-t-[12px] bg-gradient-to-b from-teal-400 to-teal-700 relative hover:from-teal-300 hover:to-teal-600 transition-all duration-300"
                        style={{ height: item.total > 0 ? `${Math.max(percent, 6)}%` : '4px' }}
                      />
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] text-slate-500 font-extrabold whitespace-nowrap">
                        {item.day}
                      </span>
                    </div>
                  );
                });
              })()
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                Tidak ada data penjualan
              </div>
            )}
          </div>
        </div>

        {/* Aktivitas Penting — dinamis dari API */}
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <h3 className="text-lg font-bold text-slate-900 m-0 mb-5">Aktivitas Penting</h3>

          {loading ? (
            <div className="flex flex-col gap-5 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="border-l-4 border-slate-100 pl-4">
                  <div className="h-3 w-40 rounded bg-slate-200 mb-2" />
                  <div className="h-3 w-56 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : d ? (
            <div className="flex flex-col gap-5">
              {d.activities && d.activities.length > 0 ? (
                d.activities.map((act) => (
                  <div key={act.id} className={`border-l-4 pl-4 ${activityBorder[act.type] ?? "border-slate-300"}`}>
                    <p className="text-slate-900 font-bold text-sm">{act.title}</p>
                    <p className="text-slate-500 text-sm mt-1">{act.description}</p>
                  </div>
                ))
              ) : (
                <div className="border-l-4 border-emerald-300 pl-4">
                  <p className="text-slate-900 font-bold text-sm">Semua indikator normal</p>
                  <p className="text-slate-500 text-sm mt-1">Tidak ada aktivitas kritis yang perlu ditangani hari ini.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
