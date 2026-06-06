"use client";

import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, CheckCircle, Clock, Printer, Copy, Filter } from "lucide-react";

export default function PrescriptionsPage() {
  const prescriptions = [
    { id: "RX-20260606-001", patient: "Budi Santoso", doctor: "dr. Andi", status: "Pending", date: "2026-06-06 10:30" },
    { id: "RX-20260606-002", patient: "Siti Aminah", doctor: "dr. Ratna", status: "Approved", date: "2026-06-06 09:15" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daftar Resep</h1>
          <p className="text-slate-500 mt-1">Kelola resep pasien dan persetujuan apoteker.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-gradient-to-br from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-[14px] px-6 py-3 font-black text-sm shadow-lg shadow-blue-500/20 border-0 transition-all flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Input Resep Baru
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
              placeholder="Cari nomor resep, nama pasien..." 
              className="w-full pl-11 py-5 rounded-[16px] border border-slate-200 font-bold bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none transition-all" 
            />
          </div>
          <button className="bg-white border border-slate-200 text-slate-600 rounded-[14px] px-5 py-4 font-bold hover:bg-slate-50 transition-colors flex items-center whitespace-nowrap">
            <Filter className="mr-2 h-4 w-4" /> Filter Status
          </button>
        </div>

        {/* Custom Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">No. Resep</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Tanggal</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Nama Pasien</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Dokter</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Status</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((r) => (
                <tr key={r.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                    {r.id}
                  </td>
                  <td className="py-4 px-4 text-[13px] font-bold text-slate-600 border-b border-slate-100 group-last:border-0">
                    {r.date}
                  </td>
                  <td className="py-4 px-4 text-[13px] font-bold text-slate-800 border-b border-slate-100 group-last:border-0">
                    {r.patient}
                  </td>
                  <td className="py-4 px-4 text-[13px] font-bold text-slate-600 border-b border-slate-100 group-last:border-0">
                    {r.doctor}
                  </td>
                  <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                    {r.status === "Pending" ? (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600 border border-orange-100">
                        <Clock className="mr-1 h-3 w-3" /> {r.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 border border-emerald-100">
                        <CheckCircle className="mr-1 h-3 w-3" /> {r.status}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px] text-right">
                    <div className="flex justify-end gap-2">
                      {r.status === "Pending" && (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[10px] px-4 py-2 font-bold text-xs transition-colors">
                          Validasi
                        </button>
                      )}
                      {r.status === "Approved" && (
                        <>
                          <Dialog>
                            <DialogTrigger className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[10px] h-8 w-8 flex items-center justify-center transition-colors" title="Preview Etiket">
                                <Printer className="h-4 w-4" />
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-[22px] border-slate-200">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-black text-slate-900">Preview Etiket Obat</DialogTitle>
                              </DialogHeader>
                              <div className="border border-slate-200 p-6 rounded-[16px] bg-yellow-50/50 font-mono text-sm shadow-inner mt-2">
                                <div className="font-bold text-center border-b border-dashed border-slate-300 pb-3 mb-3 text-slate-800">APOTEK POS MODERN</div>
                                <div className="flex justify-between text-slate-700">
                                  <span>No: {r.id}</span>
                                  <span>Tgl: {r.date.split(" ")[0]}</span>
                                </div>
                                <div className="mt-4 font-bold text-lg text-slate-900">{r.patient}</div>
                                <div className="mt-6 text-center text-xl font-bold text-slate-900">3 x Sehari 1 Tablet</div>
                                <div className="mt-2 text-center text-xs text-slate-600 font-bold uppercase tracking-wider">Sesudah Makan</div>
                                <div className="mt-6 border-t border-dashed border-slate-300 pt-3 flex justify-between text-xs font-bold text-slate-700">
                                  <span>Amoxicillin 500mg</span>
                                  <span>ED: 10-2026</span>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <button className="bg-gradient-to-br from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-[14px] px-6 py-4 font-black shadow-lg shadow-blue-500/20 border-0 transition-all flex items-center">
                                  <Printer className="mr-2 h-4 w-4" /> Cetak Sekarang
                                </button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[10px] h-8 w-8 flex items-center justify-center transition-colors" title="Copy Resep / Tebus Ulang">
                            <Copy className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[10px] px-4 py-2 font-bold text-xs transition-colors">
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
