"use client";

import { useState } from "react";
import { Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const chartData = [
  { name: "Senin", penjualan: 4200000 },
  { name: "Selasa", penjualan: 3800000 },
  { name: "Rabu", penjualan: 5100000 },
  { name: "Kamis", penjualan: 4700000 },
  { name: "Jumat", penjualan: 6200000 },
  { name: "Sabtu", penjualan: 8400000 },
  { name: "Minggu", penjualan: 7900000 },
];

export default function SalesReportPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Laporan Penjualan berhasil diekspor ke format Excel.");
    }, 2000); // Simulate API latency
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Laporan Penjualan</h1>
          <p className="text-slate-500 mt-1">Analisa performa penjualan dan kasir.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 rounded-[14px] px-5 py-3 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center">
            <Filter className="mr-2 h-4 w-4" /> Filter Lanjutan
          </button>
          <button 
            className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-[14px] px-6 py-3 font-black text-sm shadow-lg shadow-emerald-500/20 border-0 transition-all flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} /> 
            {isExporting ? "Memproses..." : "Export (Excel)"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8 col-span-3 md:col-span-2">
          <h3 className="text-xl font-black text-slate-900 m-0 mb-6">Omzet 7 Hari Terakhir</h3>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `Rp${value / 1000000}M`}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toLocaleString()}`, "Penjualan"]}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="penjualan" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        
        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8 col-span-3 md:col-span-1">
          <h3 className="text-xl font-black text-slate-900 m-0 mb-8">Metode Pembayaran</h3>
          <div className="space-y-8 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-bold text-slate-600">Tunai</span>
                <span className="font-black text-slate-900">45%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[45%] rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-bold text-slate-600">QRIS</span>
                <span className="font-black text-slate-900">35%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 w-[35%] rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-bold text-slate-600">Debit / Kredit</span>
                <span className="font-black text-slate-900">20%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 w-[20%] rounded-full" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-black text-slate-900 m-0">Riwayat Transaksi Harian</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Cari struk / kasir..." 
              className="w-full pl-11 py-3 rounded-[12px] border border-slate-200 font-bold bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus:outline-none transition-all text-sm" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Nomor Struk</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Waktu</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Kasir</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Metode</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right">Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                    TRX-06062026-00{i}
                  </td>
                  <td className="py-4 px-4 text-[13px] font-bold text-slate-600 border-b border-slate-100 group-last:border-0">
                    1{i}:30
                  </td>
                  <td className="py-4 px-4 text-[13px] font-bold text-slate-800 border-b border-slate-100 group-last:border-0">
                    Kasir Pagi
                  </td>
                  <td className="py-4 px-4 text-[13px] font-bold text-slate-600 border-b border-slate-100 group-last:border-0">
                    {i % 2 === 0 ? "QRIS" : "Tunai"}
                  </td>
                  <td className="py-4 px-4 text-[13px] font-black text-emerald-600 border-b border-slate-100 group-last:border-0 rounded-r-[14px] text-right">
                    {(150000 * i).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
