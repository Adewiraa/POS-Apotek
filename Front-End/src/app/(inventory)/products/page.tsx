"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MasterAPI } from "@/lib/api";

type Product = {
  id: number;
  code: string;
  name: string;
  category: { name: string } | null;
  stock: number;
  selling_price: number;
};

const CLASSIFICATIONS = ["Obat Bebas", "Obat Bebas Terbatas", "Obat Keras", "Narkotika", "Psikotropika", "Suplemen", "Alkes", "Lainnya"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    generic_name: "",
    barcode: "",
    classification: "Obat Bebas",
    selling_price: "",
    purchase_price: "",
    min_stock: "10",
  });

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.selling_price || !newProduct.purchase_price) {
      toast.error("Nama, Harga Beli, dan Harga Jual wajib diisi!");
      return;
    }

    setIsAdding(true);

    const productPayload = {
      name: newProduct.name,
      generic_name: newProduct.generic_name || null,
      barcode: newProduct.barcode || null,
      classification: newProduct.classification,
      selling_price: parseFloat(newProduct.selling_price),
      purchase_price: parseFloat(newProduct.purchase_price),
      min_stock: parseInt(newProduct.min_stock) || 10,
    };

    try {
      await MasterAPI.createProduct(productPayload as any);
      toast.success("Produk berhasil ditambahkan!");
      setIsOpen(false);
      setNewProduct({ name: "", generic_name: "", barcode: "", classification: "Obat Bebas", selling_price: "", purchase_price: "", min_stock: "10" });
      loadProducts();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message;
      toast.error("Gagal menambahkan produk", { description: serverMsg });
    } finally {
      setIsAdding(false);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await MasterAPI.getProducts();
      let productList = [];
      
      if (Array.isArray(response)) {
        productList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        productList = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        productList = response.data.data;
      } else if (response?.data && Array.isArray(response.data.data)) {
        productList = response.data.data;
      }
      
      setProducts(productList);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data produk dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Produk</h1>
          <p className="text-slate-500 mt-1">Kelola data obat, produk apotek, dan harga jual.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="bg-gradient-to-br from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 text-white rounded-[14px] px-5 py-4 font-black shadow-lg shadow-teal-500/20 border-0 transition-all cursor-pointer flex items-center">
              <Plus className="mr-2 h-5 w-5" /> Tambah Produk
          </DialogTrigger>
          <DialogContent className="rounded-[22px] border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900">Tambah Produk Baru</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Nama Produk */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nama Produk *</label>
                <Input className="rounded-[12px] border-slate-200 font-bold" placeholder="Contoh: Paracetamol 500mg" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              {/* Nama Generik */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nama Generik</label>
                <Input className="rounded-[12px] border-slate-200 font-bold" placeholder="Opsional" value={newProduct.generic_name} onChange={(e) => setNewProduct({...newProduct, generic_name: e.target.value})} />
              </div>
              {/* Barcode */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Barcode</label>
                <Input className="rounded-[12px] border-slate-200 font-bold font-mono" placeholder="Scan atau isi manual (opsional)" value={newProduct.barcode} onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})} />
              </div>
              {/* Klasifikasi */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Klasifikasi Obat *</label>
                <select
                  className="w-full h-10 px-3 rounded-[12px] border border-slate-200 font-bold text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  value={newProduct.classification}
                  onChange={(e) => setNewProduct({...newProduct, classification: e.target.value})}
                >
                  {CLASSIFICATIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Harga Beli & Harga Jual */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Harga Beli *</label>
                  <Input className="rounded-[12px] border-slate-200 font-bold" type="number" placeholder="0" value={newProduct.purchase_price} onChange={(e) => setNewProduct({...newProduct, purchase_price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Harga Jual *</label>
                  <Input className="rounded-[12px] border-slate-200 font-bold" type="number" placeholder="0" value={newProduct.selling_price} onChange={(e) => setNewProduct({...newProduct, selling_price: e.target.value})} />
                </div>
              </div>
              {/* Stok Minimum */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Stok Minimum (Alert)</label>
                <Input className="rounded-[12px] border-slate-200 font-bold" type="number" placeholder="10" value={newProduct.min_stock} onChange={(e) => setNewProduct({...newProduct, min_stock: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <button className="rounded-[12px] px-5 py-2.5 font-bold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setIsOpen(false)}>Batal</button>
              <button className="bg-gradient-to-br from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 text-white rounded-[12px] px-6 py-2.5 font-black text-sm shadow-lg shadow-teal-500/20 border-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleAddProduct} disabled={isAdding}>
                {isAdding ? "Menyimpan..." : "Simpan Produk"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input type="search" placeholder="Cari nama produk, SKU..." className="pl-11 py-5 rounded-[16px] border-slate-200 font-bold bg-slate-50 focus-visible:ring-teal-500" />
          </div>
          <Button variant="outline" className="rounded-[14px] px-5 py-5 font-bold border-slate-200 text-slate-600">
            Filter Kategori
          </Button>
          <Button variant="ghost" onClick={loadProducts} title="Refresh" className="rounded-[14px] h-[42px] w-[42px] p-0 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50">
            <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-6 bg-rose-50 text-rose-600 text-center rounded-[16px] border border-rose-200 font-bold text-sm">
            {error}
          </div>
        )}

        {/* Custom Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Kode</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Nama Produk</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Kategori</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right">Stok Total</th>
                <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 text-right">Harga Jual</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                    Memuat data dari server...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                    Data produk kosong.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                      {p.code || `PRD-${p.id}`}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-bold text-slate-700 border-b border-slate-100 group-last:border-0">
                      {p.name}
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        {p.category?.name || "Umum"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[13px] font-black text-slate-900 border-b border-slate-100 group-last:border-0 text-right">
                      {p.stock || 0}
                    </td>
                    <td className="py-4 px-4 text-[13px] font-black text-teal-600 border-b border-slate-100 group-last:border-0 text-right rounded-r-[14px]">
                      Rp {p.selling_price?.toLocaleString() || 0}
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
