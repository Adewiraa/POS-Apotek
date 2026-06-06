"use client";

import { CheckCircle, AlertCircle, Link as LinkIcon, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SatuSehatIntegrationPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Integrasi SATUSEHAT</h1>
          <p className="text-slate-500 mt-1">Monitoring sinkronisasi rekam medis dan data farmasi Kemenkes.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-gradient-to-br from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-[14px] px-6 py-3 font-black text-sm shadow-lg shadow-blue-500/20 border-0 transition-all flex items-center">
            <RefreshCcw className="mr-2 h-4 w-4" /> Sinkronisasi Manual
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-emerald-50/50 rounded-[22px] border border-emerald-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 relative overflow-hidden group">
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-emerald-800">Status Koneksi API</h3>
            <div className="flex items-center text-emerald-600">
              <CheckCircle className="h-6 w-6 mr-3" />
              <span className="font-black text-xl">Terhubung</span>
            </div>
            <span className="text-[13px] font-bold text-emerald-700 bg-emerald-100/50 self-start px-3 py-1 rounded-md">Lingkungan: Production</span>
          </div>
        </div>

        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 relative overflow-hidden group">
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-500">Antrean Sinkronisasi</h3>
            <div className="text-4xl font-black text-slate-900">14</div>
            <p className="text-[13px] font-bold text-slate-500">Transaksi menunggu dikirim</p>
          </div>
        </div>

        <div className="bg-orange-50/50 rounded-[22px] border border-orange-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 relative overflow-hidden group">
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-orange-800">Mapping Produk Belum Selesai</h3>
            <div className="flex items-center text-orange-600">
              <AlertCircle className="h-6 w-6 mr-3" />
              <span className="font-black text-3xl">45</span>
            </div>
            <p className="text-[13px] font-bold text-orange-700">Produk lokal butuh KFA Code</p>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8">
        <div className="mb-8">
          <h3 className="text-xl font-black text-slate-900 m-0">Mapping Kode KFA (Kamus Farmasi)</h3>
          <p className="text-slate-500 text-sm mt-1">Produk lokal harus dipetakan dengan kode referensi Kementerian Kesehatan.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Kode Produk</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Nama Produk Lokal</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">KFA Code (SATUSEHAT)</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Status Mapping</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "PRD-001", name: "Paracetamol 500mg", kfa: "93001234", mapped: true },
                { id: "PRD-002", name: "Amoxicillin 500mg", kfa: "93005678", mapped: true },
                { id: "PRD-003", name: "Sirup Batuk Herbal", kfa: "", mapped: false },
              ].map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                    {item.id}
                  </td>
                  <td className="py-4 px-4 text-[13px] font-bold text-slate-700 border-b border-slate-100 group-last:border-0">
                    {item.name}
                  </td>
                  <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                    {item.mapped ? (
                      <span className="font-mono text-[13px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                        {item.kfa}
                      </span>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Input KFA Code..." 
                        className="h-10 px-3 rounded-[10px] border border-slate-200 font-bold bg-white text-[13px] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none transition-all w-full max-w-[200px]" 
                      />
                    )}
                  </td>
                  <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                    {item.mapped ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 border border-emerald-100">
                        Mapped
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600 border border-orange-100">
                        Unmapped
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px] text-right">
                    {!item.mapped ? (
                      <button className="bg-slate-900 hover:bg-slate-800 text-white rounded-[10px] px-4 py-2 font-bold text-[13px] transition-colors flex items-center justify-end ml-auto">
                        <LinkIcon className="h-3 w-3 mr-2" /> Map
                      </button>
                    ) : (
                      <button className="text-slate-400 hover:text-slate-700 font-bold text-[13px] transition-colors px-3 py-1">
                        Edit
                      </button>
                    )}
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
