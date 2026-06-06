"use client";

import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, ArrowUpDown, RefreshCcw } from "lucide-react";
import { useState } from "react";

export default function BatchesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [batches] = useState([
    { id: 1, name: "Paracetamol 500mg", batch: "BCH-2023-A", stock: 45, ed: "2026-08-15", status: "Mendekati ED" },
    { id: 2, name: "Amoxicillin 500mg", batch: "AMX-998", stock: 120, ed: "2028-10-01", status: "Aman" }
  ]);

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Stok & Batch</h1>
          <p className="text-slate-500 mt-1">Kartu stok dan manajemen Expired Date.</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Cari nama produk, batch..." 
              className="w-full pl-11 py-5 rounded-[16px] border border-slate-200 font-bold bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500/50 focus:outline-none transition-all" 
            />
          </div>
          <button className="bg-white border border-slate-200 text-slate-600 rounded-[14px] px-5 py-4 font-bold hover:bg-slate-50 transition-colors flex items-center whitespace-nowrap">
            <ArrowUpDown className="mr-2 h-4 w-4" /> Urutkan ED Terdekat
          </button>
          <button 
            onClick={loadData} 
            title="Refresh" 
            className="rounded-[14px] h-[54px] w-[54px] border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          >
            <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Custom Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Produk</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">No. Batch</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right">Sisa Stok</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Expired Date</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Status ED</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                    Memuat data...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                    Data batch kosong.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-[13px] font-bold text-slate-900 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                      {b.name}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-black text-slate-700 border-b border-slate-100 group-last:border-0">
                      {b.batch}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 text-right">
                      {b.stock}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-bold text-slate-600 border-b border-slate-100 group-last:border-0">
                      {b.ed}
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px]">
                      {b.status === "Mendekati ED" ? (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 border border-rose-100">
                          <AlertTriangle className="mr-1 h-3 w-3" /> {b.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 border border-emerald-100">
                          {b.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
