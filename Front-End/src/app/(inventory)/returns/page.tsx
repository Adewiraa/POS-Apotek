"use client";

import { useState } from "react";
import { RefreshCcw, Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState<"supplier" | "penjualan">("supplier");

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Retur Barang</h1>
          <p className="text-slate-500 mt-1">Kelola retur barang ke PBF (Supplier) atau retur dari penjualan kasir.</p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-[16px] w-full max-w-[420px]">
        <button
          className={`flex-1 py-3 text-[13px] font-black rounded-[12px] transition-all ${
            activeTab === "supplier"
              ? "bg-white text-teal-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("supplier")}
        >
          Retur ke Supplier (PBF)
        </button>
        <button
          className={`flex-1 py-3 text-[13px] font-black rounded-[12px] transition-all ${
            activeTab === "penjualan"
              ? "bg-white text-teal-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("penjualan")}
        >
          Retur Penjualan
        </button>
      </div>
        
      {activeTab === "supplier" ? (
        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8 w-full max-w-3xl">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 m-0">Buat Retur ke Supplier</h3>
            <p className="text-slate-500 text-sm mt-1">Pilih dokumen Purchase Order (PO) atau Receiving untuk diretur.</p>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nomor Faktur / PO</label>
                <div className="flex gap-2">
                  <Input className="rounded-[12px] border-slate-200 font-bold bg-slate-50 focus-visible:ring-teal-500" placeholder="INV-2026-..." />
                  <button className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Supplier (PBF)</label>
                <Input disabled className="rounded-[12px] border-slate-200 font-bold bg-slate-100 text-slate-400" placeholder="Otomatis terisi..." />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Alasan Retur</label>
              <textarea 
                className="w-full min-h-[100px] rounded-[16px] border border-slate-200 p-4 font-bold text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-y"
                placeholder="Misal: Barang mendekati expired, kemasan rusak, dll." 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Upload Bukti Kerusakan (Opsional)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-[16px] p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-teal-300 cursor-pointer transition-colors group">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors mb-3">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-[13px] font-bold">Klik untuk upload foto (Max 2MB)</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="bg-gradient-to-br from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 text-white rounded-[14px] px-8 py-4 font-black shadow-lg shadow-teal-500/20 border-0 transition-all flex items-center">
                <RefreshCcw className="mr-2 h-4 w-4" /> Proses Retur
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8 w-full max-w-3xl">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 m-0">Buat Retur Penjualan</h3>
            <p className="text-slate-500 text-sm mt-1">Pilih transaksi kasir yang dibatalkan sebagian atau seluruhnya oleh pelanggan.</p>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="space-y-2 max-w-md">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nomor Struk / Transaksi</label>
              <div className="flex gap-2">
                <Input className="rounded-[12px] border-slate-200 font-bold bg-slate-50 focus-visible:ring-teal-500" placeholder="TRX-20260606-..." />
                <button className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="rounded-[16px] border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center text-slate-400 font-bold text-sm bg-slate-50">
              <Search className="h-8 w-8 mb-4 text-slate-300" />
              Silakan cari nomor transaksi untuk memunculkan item.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
