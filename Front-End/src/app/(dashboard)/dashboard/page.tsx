"use client";

import { useMemo } from "react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Operasional</h1>
        <p className="text-slate-500 mt-1">Monitoring omzet, stok kritis, resep, dan aktivitas apotek hari ini.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <div className="text-slate-500 text-xs font-black uppercase tracking-[0.05em]">Omzet hari ini</div>
          <div className="text-[28px] font-black mt-2 mb-1 text-slate-900">Rp 18,7 jt</div>
          <div className="text-emerald-600 font-extrabold text-xs">↑ 12,4% dari kemarin</div>
        </div>
        
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <div className="text-slate-500 text-xs font-black uppercase tracking-[0.05em]">Transaksi</div>
          <div className="text-[28px] font-black mt-2 mb-1 text-slate-900">147</div>
          <div className="text-slate-500 font-extrabold text-xs">89 OTC • 58 Resep</div>
        </div>

        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <div className="text-slate-500 text-xs font-black uppercase tracking-[0.05em]">Stok kritis</div>
          <div className="text-[28px] font-black mt-2 mb-1 text-slate-900">23</div>
          <div className="text-rose-600 font-extrabold text-xs">8 item high priority</div>
        </div>

        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <div className="text-slate-500 text-xs font-black uppercase tracking-[0.05em]">ED ≤ 90 hari</div>
          <div className="text-[28px] font-black mt-2 mb-1 text-slate-900">31</div>
          <div className="text-rose-600 font-extrabold text-xs">Butuh FEFO review</div>
        </div>
      </div>

      {/* Two Columns Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-6 mt-2">
        {/* Chart Column */}
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <h3 className="text-lg font-bold text-slate-900 m-0">Tren Penjualan Mingguan</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Omzet OTC dan resep berdasarkan transaksi selesai.</p>
          
          <div className="h-[240px] flex items-end gap-3 md:gap-4 border-l border-b border-slate-200 pt-5 px-2">
            {[48, 58, 64, 52, 78, 70, 41].map((v, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-t-[12px] bg-gradient-to-b from-teal-400 to-teal-700 relative hover:from-teal-300 hover:to-teal-600 transition-colors"
                style={{ height: `${v}%` }}
              >
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] text-slate-500 font-extrabold">
                  {['Sen','Sel','Rab','Kam','Jum','Sab','Min'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline Column */}
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <h3 className="text-lg font-bold text-slate-900 m-0 mb-6">Aktivitas Penting</h3>
          
          <div className="flex flex-col gap-5">
            <div className="border-l-4 border-teal-100 pl-4">
              <p className="text-slate-900 font-bold text-sm">3 batch Amoxicillin ED dekat</p>
              <p className="text-slate-500 text-sm mt-1">Sistem menyarankan FEFO dan review batch.</p>
            </div>
            <div className="border-l-4 border-teal-100 pl-4">
              <p className="text-slate-900 font-bold text-sm">5 resep menunggu validasi</p>
              <p className="text-slate-500 text-sm mt-1">Prioritas tinggi karena mengandung obat keras.</p>
            </div>
            <div className="border-l-4 border-teal-100 pl-4">
              <p className="text-slate-900 font-bold text-sm">PO otomatis disarankan</p>
              <p className="text-slate-500 text-sm mt-1">Paracetamol 500 mg berada di bawah reorder point.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
