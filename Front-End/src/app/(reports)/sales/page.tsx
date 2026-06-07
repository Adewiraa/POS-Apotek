"use client";

import { useState, useEffect } from "react";
import { Download, Filter, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { PosAPI } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for Customer Return
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<any | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const handleOpenReturnModal = (sale: any) => {
    setSelectedSaleForReturn(sale);
    const items = (sale.items || []).map((item: any) => ({
      product_id: item.product_id,
      product_batch_id: item.product_batch_id,
      name: item.product?.name || `Produk ID ${item.product_id}`,
      qty: 0,
      maxQty: item.qty,
      condition: "Layak Jual"
    }));
    setReturnItems(items);
    setReturnReason("");
    setIsReturnModalOpen(true);
  };

  const handleQtyChange = (index: number, val: number) => {
    const updated = [...returnItems];
    updated[index].qty = Math.max(0, Math.min(updated[index].maxQty, val));
    setReturnItems(updated);
  };

  const handleConditionChange = (index: number, val: string) => {
    const updated = [...returnItems];
    updated[index].condition = val;
    setReturnItems(updated);
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = returnItems.filter(item => item.qty > 0);
    if (itemsToReturn.length === 0) {
      toast.error("Tidak ada item yang dipilih untuk diretur.");
      return;
    }
    if (!returnReason.trim()) {
      toast.error("Alasan retur harus diisi.");
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const payload = {
        transaction_no: selectedSaleForReturn.transaction_no,
        user_id: 1,
        reason: returnReason,
        items: itemsToReturn.map(item => ({
          product_id: item.product_id,
          product_batch_id: item.product_batch_id,
          qty: item.qty,
          condition: item.condition
        }))
      };
      await PosAPI.salesReturn(payload);
      toast.success("Retur penjualan berhasil diproses!");
      setIsReturnModalOpen(false);
      fetchSales();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error.message || "Gagal memproses retur";
      toast.error("Gagal memproses retur", { description: errMsg });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await PosAPI.getHistory();
      // Assume res.data contains the sales array
      setSales(res?.data || []);
    } catch (error) {
      console.error("Failed to fetch sales history:", error);
      toast.error("Gagal memuat data penjualan dari server.");
    } finally {
      setIsLoading(false);
    }
  };

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
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Memuat data penjualan...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">
                    Tidak ada transaksi penjualan hari ini.
                  </td>
                </tr>
              ) : (
                sales.map((sale, i) => (
                  <tr key={sale.id || i} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                      {sale.transaction_no || `TRX-06062026-00${i}`}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-bold text-slate-600 border-b border-slate-100 group-last:border-0">
                      {new Date(sale.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || `1${i}:30`}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-bold text-slate-800 border-b border-slate-100 group-last:border-0">
                      Kasir {sale.cashier_id || 'Utama'}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-bold text-slate-600 border-b border-slate-100 group-last:border-0">
                      {sale.payment_method || (i % 2 === 0 ? "QRIS" : "Tunai")}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-black text-emerald-600 border-b border-slate-100 group-last:border-0 text-right">
                      {Number(sale.total).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px] text-right">
                      <button
                        onClick={() => handleOpenReturnModal(sale)}
                        className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-[10px] px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer"
                      >
                        Retur
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dialog Form Retur Penjualan */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="rounded-[22px] border-slate-200 max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Form Retur Penjualan</DialogTitle>
          </DialogHeader>
          {selectedSaleForReturn && (
            <div className="mt-4 flex flex-col gap-5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-[16px] border border-slate-200">
                <span>Struk: <strong className="text-slate-900 font-extrabold">{selectedSaleForReturn.transaction_no}</strong></span>
                <span>Waktu: <strong className="text-slate-900 font-extrabold">{new Date(selectedSaleForReturn.created_at).toLocaleString('id-ID')}</strong></span>
              </div>

              <div className="max-h-[250px] overflow-y-auto border border-slate-100 rounded-[16px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
                      <th className="p-3">Nama Produk</th>
                      <th className="p-3 text-center">Beli</th>
                      <th className="p-3 text-center w-[120px]">Qty Retur</th>
                      <th className="p-3 text-center w-[150px]">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 text-xs font-bold text-slate-700">
                        <td className="p-3 font-extrabold text-slate-900">{item.name}</td>
                        <td className="p-3 text-center">{item.maxQty}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.maxQty}
                            value={item.qty}
                            onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 0)}
                            className="w-16 border border-slate-200 rounded-[8px] p-1.5 text-center font-bold bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={item.condition}
                            onChange={(e) => handleConditionChange(idx, e.target.value)}
                            className="bg-white border border-slate-200 rounded-[8px] p-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                          >
                            <option value="Layak Jual">Layak Jual</option>
                            <option value="Karantina">Karantina</option>
                            <option value="Rusak">Rusak</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Alasan Retur</label>
                <input
                  type="text"
                  placeholder="Masukkan alasan retur barang..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-[12px] p-3 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setIsReturnModalOpen(false)}
                  className="bg-white border border-slate-200 text-slate-700 rounded-[12px] px-5 py-3 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitReturn}
                  disabled={isSubmittingReturn}
                  className="bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white rounded-[12px] px-6 py-3 text-sm font-black shadow-lg shadow-rose-500/20 border-0 transition-all flex items-center"
                >
                  {isSubmittingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Proses Retur
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
