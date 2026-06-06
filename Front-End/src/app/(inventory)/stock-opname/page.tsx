"use client";

import { useState } from "react";
import { Plus, Search, Save, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function StockOpnamePage() {
  const [items, setItems] = useState([
    { id: "PRD-001", name: "Paracetamol 500mg", batch: "BATCH-1", systemQty: 150, physicalQty: 150, note: "" },
    { id: "PRD-002", name: "Vitamin C 1000mg", batch: "BATCH-2", systemQty: 85, physicalQty: 80, note: "5 botol rusak pecah" },
  ]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Stock Opname</h1>
          <p className="text-slate-500 mt-1">Catat perhitungan fisik stok dan ajukan persetujuan selisih.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 rounded-[14px] px-5 py-3 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center">
            <Save className="mr-2 h-4 w-4" /> Simpan Draft
          </button>
          <button className="bg-gradient-to-br from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-[14px] px-6 py-3 font-black text-sm shadow-lg shadow-blue-500/20 border-0 transition-all flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" /> Ajukan Approval
          </button>
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
              className="w-full pl-11 py-4 rounded-[16px] border border-slate-200 font-bold bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500/50 focus:outline-none transition-all" 
            />
          </div>
          <button className="bg-slate-900 text-white rounded-[14px] px-5 py-4 font-bold text-sm hover:bg-slate-800 transition-colors flex items-center whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Tambah Item
          </button>
        </div>

        {/* Custom Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Kode</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Nama & Batch</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-center">Stok Sistem</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-center w-[150px]">Stok Fisik</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-center">Selisih</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Keterangan Selisih</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const diff = item.physicalQty - item.systemQty;
                return (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-[13px] font-black text-slate-700 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                      {item.id}
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                      <div className="font-bold text-[13px] text-slate-900">{item.name}</div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5">{item.batch}</div>
                    </td>
                    <td className="py-4 px-4 text-center border-b border-slate-100 group-last:border-0 bg-slate-50/50">
                      <span className="text-[13px] font-black text-slate-900">{item.systemQty}</span>
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                      <Input 
                        type="number" 
                        value={item.physicalQty} 
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].physicalQty = Number(e.target.value);
                          setItems(newItems);
                        }}
                        className="h-10 rounded-[12px] text-center font-black text-[13px] bg-white"
                      />
                    </td>
                    <td className="py-4 px-4 text-center border-b border-slate-100 group-last:border-0">
                      <span className={`text-[13px] font-black ${diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px]">
                      <Input 
                        value={item.note} 
                        placeholder="Wajib jika ada selisih"
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].note = e.target.value;
                          setItems(newItems);
                        }}
                        className="h-10 rounded-[12px] font-bold text-[13px] bg-white"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
