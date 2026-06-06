"use client";

import { Input } from "@/components/ui/input";
import { ArrowDownToLine, CheckCircle, Search, Save } from "lucide-react";
import { toast } from "sonner";

export default function ReceivingPage() {
  const handleReceive = () => {
    toast.success("Barang masuk berhasil diproses!", {
      description: "Stok gudang otomatis terupdate untuk Batch M-1010.",
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Barang Masuk (Receiving)</h1>
          <p className="text-slate-500 mt-1">Proses penerimaan barang dari Supplier/PBF.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 rounded-[14px] px-5 py-3 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center">
            <Save className="mr-2 h-4 w-4" /> Simpan Draft
          </button>
          <button 
            className="bg-gradient-to-br from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-[14px] px-6 py-3 font-black text-sm shadow-lg shadow-blue-500/20 border-0 transition-all flex items-center"
            onClick={handleReceive}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Proses GR
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <h3 className="text-lg font-bold text-slate-900 m-0 mb-6">Info Dokumen</h3>
          
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">No. Purchase Order (PO)</label>
                <div className="flex gap-2">
                  <Input className="rounded-[12px] border-slate-200 font-bold bg-slate-50" placeholder="PO-20260606..." />
                  <button className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">No. Surat Jalan / Faktur</label>
                <Input className="rounded-[12px] border-slate-200 font-bold bg-slate-50" placeholder="SJ-..." />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Supplier (PBF)</label>
              <Input disabled className="rounded-[12px] border-slate-200 font-bold bg-slate-100 text-slate-500" placeholder="Otomatis dari PO..." value="PT. Bina San Prima" />
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
        <h3 className="text-lg font-bold text-slate-900 m-0 mb-6">Daftar Barang Diterima</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Kode & Nama</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Qty Pesan (PO)</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 w-[140px]">Qty Terima</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 w-[160px]">No. Batch</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 w-[160px]">Expired Date</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="group hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                  <div className="font-bold text-slate-900 text-[13px]">Paracetamol 500mg</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">PRD-001</div>
                </td>
                <td className="py-4 px-4 text-[13px] font-bold text-slate-700 border-b border-slate-100 group-last:border-0">
                  100 Box
                </td>
                <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                  <Input type="number" defaultValue={100} className="h-9 rounded-[10px] text-[13px] font-bold text-center" />
                </td>
                <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                  <Input placeholder="Batch..." defaultValue="M-1010" className="h-9 rounded-[10px] text-[13px] font-bold" />
                </td>
                <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                  <Input type="date" defaultValue="2028-12-01" className="h-9 rounded-[10px] text-[13px] font-bold" />
                </td>
                <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px]">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Sesuai
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
