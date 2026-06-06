"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Building2, TrendingUp, Users } from "lucide-react";

const branchData = [
  { name: "Cabang Utama", omzet: 45000000, target: 40000000 },
  { name: "Cabang Timur", omzet: 32000000, target: 35000000 },
  { name: "Cabang Barat", omzet: 28000000, target: 25000000 },
  { name: "Klinik 24 Jam", omzet: 52000000, target: 48000000 },
];

export default function HQDashboardPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">HQ Dashboard (Multi-Cabang)</h1>
          <p className="text-slate-500 mt-1">Monitoring performa dan operasional lintas cabang.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-500">Total Omzet (Bulan Ini)</h3>
            <div className="w-10 h-10 rounded-[14px] bg-teal-50 flex items-center justify-center text-teal-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">Rp 157.000.000</div>
          <p className="text-[13px] font-bold text-teal-600 mt-2 bg-teal-50 inline-block px-2.5 py-1 rounded-md">+8.5% dari bulan lalu</p>
        </div>
        
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-500">Cabang Aktif</h3>
            <div className="w-10 h-10 rounded-[14px] bg-sky-50 flex items-center justify-center text-sky-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">4 Outlet</div>
          <p className="text-[13px] font-bold text-slate-500 mt-2">Semua sistem terhubung</p>
        </div>
        
        <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-500">Total Staf Aktif</h3>
            <div className="w-10 h-10 rounded-[14px] bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">24 Karyawan</div>
          <p className="text-[13px] font-bold text-slate-500 mt-2">Tersebar di 4 cabang</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8">
          <h3 className="text-xl font-black text-slate-900 m-0 mb-6">Performa Omzet per Cabang</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} layout="vertical" margin={{ left: 40, top: 10, bottom: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(value) => `Rp${value / 1000000}M`} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={13} fontWeight={700} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toLocaleString()}`, "Omzet"]}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="omzet" fill="#0ea5e9" radius={[0, 8, 8, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6 md:p-8">
          <h3 className="text-xl font-black text-slate-900 m-0 mb-6">Kinerja Operasional</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-spacing-0">
              <thead>
                <tr>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Nama Cabang</th>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-center">Stok Kritis</th>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-center">Resep Pending</th>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {branchData.map((b, i) => (
                  <tr key={b.name} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                      {b.name}
                    </td>
                    <td className="py-4 px-4 text-center border-b border-slate-100 group-last:border-0">
                      <span className={`text-[13px] font-black ${i === 1 ? "text-rose-600 bg-rose-50 px-3 py-1 rounded-md" : "text-slate-900"}`}>
                        {i === 1 ? "15" : "2"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center border-b border-slate-100 group-last:border-0">
                      <span className="text-[13px] font-black text-slate-900">
                        {i === 2 ? "4" : "0"}
                      </span>
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px] text-right">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                        Online
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
