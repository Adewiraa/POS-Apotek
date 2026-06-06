"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Save, List, Loader2, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePosStore } from "@/stores/pos-store";
import { MasterAPI, PosAPI } from "@/lib/api";
import { toast } from "sonner";

export default function PosPage() {
  const { cart, draftCarts, addItem, updateQty, removeItem, clearCart, holdCart, restoreCart, removeDraft } = usePosStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // Load all products for local lookup
  useEffect(() => {
    MasterAPI.getProducts()
      .then((res) => {
        // API returns: { status, data: { data: [...], current_page, ... } }
        const list = res?.data?.data || res?.data || [];
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        toast.error("Gagal memuat produk dari server.");
      });
  }, []);

  // Search product by barcode, name, id, or PRD-{id} pattern → add to cart on Enter
  const handleSearchEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    const queryLower = query.toLowerCase();

    // Extract numeric id from patterns like "PRD-1", "prd-1", or plain "1"
    const idFromPattern = queryLower.startsWith("prd-")
      ? parseInt(queryLower.replace("prd-", ""))
      : parseInt(query);

    let found = products.find(
      (p) =>
        p.barcode?.toLowerCase() === queryLower ||
        p.barcode === query ||
        p.name?.toLowerCase().includes(queryLower) ||
        p.id === idFromPattern ||
        p.id?.toString() === query ||
        p.sku?.toLowerCase() === queryLower
    );

    // Fallback: call API search if local match fails or products not loaded
    if (!found) {
      try {
        const res = await MasterAPI.getProducts();
        const allProducts: any[] = res?.data?.data || res?.data || [];
        // Reload local cache
        if (allProducts.length > 0) setProducts(allProducts);

        found = allProducts.find(
          (p) =>
            p.barcode?.toLowerCase() === queryLower ||
            p.name?.toLowerCase().includes(queryLower) ||
            p.id === idFromPattern ||
            p.id?.toString() === query
        );
      } catch {
        // silent
      }
    }

    if (found) {
      addItem({
        id: found.id.toString(),
        name: found.name,
        price: parseFloat(found.selling_price) || 0,
        type: found.classification || found.category?.name || "Umum",
        qty: 1,
      });
      toast.success(`✓ ${found.name} ditambahkan ke keranjang`);
      setSearchQuery("");
    } else {
      toast.error("Produk tidak ditemukan", {
        description: `Coba ketik nama langsung, misal: "${products[0]?.name || 'obat 1'}"`,
      });
    }

    setIsSearching(false);
    searchInputRef.current?.focus();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) {
          holdCart(`Draft ${new Date().toLocaleTimeString()}`);
          toast.success("Keranjang disimpan ke Draft (Hold)");
        }
      }
      if (e.key === "F12") {
        e.preventDefault();
        if (cart.length > 0) handleCheckout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, holdCart]);

  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const tax = subtotal * 0.11; // 11% PPN
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const payload = {
        cashier_id: 1, // Harusnya dari useAuthStore
        payment_method: paymentMethod,
        total: total,
        amount_tendered: total, // Asumsi uang pas untuk MVP
        discount: 0,
        tax: tax,
        items: cart.map(item => ({
          product_id: parseInt(item.id.replace('PRD-', '')), 
          qty: item.qty,
          price: item.price,
          name: item.name // for receipt printing
        }))
      };
      
      // Save receipt data for printing
      setLastReceipt({
        ...payload,
        date: new Date().toLocaleString('id-ID'),
        receiptNo: `TRX-${Date.now().toString().slice(-6)}`
      });

      try {
        await PosAPI.checkout(payload);
        toast.success("Pembayaran Berhasil!", { description: "Transaksi tercatat di database." });
      } catch (apiError: any) {
        if (apiError.response) {
          const errMsg = apiError.response.data?.message || "Validasi gagal dari server";
          toast.error("Gagal menyimpan ke Database", { description: errMsg });
          setIsProcessing(false);
          return; // Stop execution so it doesn't clear cart and print
        } else {
          toast.success("Pembayaran Berhasil (Mode Offline)!", { description: "Disimpan secara lokal." });
        }
      }
      
      clearCart();
      
      // Auto trigger print
      setTimeout(() => {
        window.print();
      }, 500);

    } catch (error: any) {
      toast.error("Gagal memproses pembayaran", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4 md:gap-6 w-full max-w-7xl mx-auto items-start">
        {/* Left Area: Product Selection & Search */}
        <section className="bg-white rounded-[22px] border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1">
              {isSearching ? (
                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 animate-spin" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchEnter}
                placeholder="Ketik barcode / nama obat lalu tekan Enter (F2)..."
                className="w-full border border-slate-200 rounded-[16px] py-3 pr-4 pl-11 font-bold text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all"
              />
            </div>
            
            {/* Drafts Modal */}
            <Dialog>
              <DialogTrigger className="relative bg-white border border-slate-200 text-slate-700 rounded-[14px] px-5 py-3 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center whitespace-nowrap cursor-pointer">
                  <List className="h-4 w-4 mr-2 text-slate-500" />
                  Drafts
                  {draftCarts.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                      {draftCarts.length}
                    </span>
                  )}
              </DialogTrigger>
              <DialogContent className="rounded-[22px] border-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900">Daftar Struk Tersimpan (Hold Bills)</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto mt-4 pr-2">
                  {draftCarts.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 font-bold border border-dashed border-slate-200 rounded-[16px]">
                      Tidak ada struk tersimpan.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {draftCarts.map((draft) => (
                        <div key={draft.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-[16px] bg-slate-50">
                          <div>
                            <div className="font-bold text-slate-900">{draft.name}</div>
                            <div className="text-xs font-bold text-slate-500 mt-1">{draft.items.length} item(s)</div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              className="bg-white border border-slate-200 text-slate-700 rounded-[10px] px-4 py-2 text-xs font-bold hover:bg-slate-100 transition-colors"
                              onClick={() => { restoreCart(draft.id); toast.success("Draft dipulihkan"); }}
                            >
                              Buka
                            </button>
                            <button 
                              className="bg-rose-50 text-rose-600 rounded-[10px] px-4 py-2 text-xs font-bold hover:bg-rose-100 transition-colors"
                              onClick={() => removeDraft(draft.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Product Grid Area placeholder or Table depending on how we render cart items */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-spacing-0">
              <thead>
                <tr>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100">Item</th>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 w-[120px]">Harga</th>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 w-[150px] text-center">Qty</th>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 w-[120px] text-right">Subtotal</th>
                  <th className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-4 px-4 border-b border-slate-100 w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="inline-block border border-dashed border-slate-200 rounded-[16px] px-8 py-6 text-slate-400 font-bold text-sm bg-slate-50">
                        Keranjang kosong. Scan barcode atau cari obat untuk menambahkan.
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-l-[14px]">
                        <div className="font-bold text-slate-900 text-[13px]">{item.name}</div>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 mt-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[13px] font-bold text-slate-700 border-b border-slate-100 group-last:border-0">
                        Rp {item.price.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 border-b border-slate-100 group-last:border-0">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                            onClick={() => updateQty(item.id, item.qty - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-[13px] font-black">{item.qty}</span>
                          <button 
                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                            onClick={() => updateQty(item.id, item.qty + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[13px] font-black text-teal-600 border-b border-slate-100 group-last:border-0 text-right">
                        Rp {(item.price * item.qty).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 border-b border-slate-100 group-last:border-0 rounded-r-[14px] text-right">
                        <button 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Area: Payment Summary */}
        <aside className="bg-slate-900 rounded-[22px] border border-slate-800 shadow-[0_18px_50px_rgba(15,23,42,0.15)] flex flex-col overflow-hidden sticky top-6">
          <div className="p-6 pb-4">
            <h3 className="text-white font-bold text-lg m-0">Ringkasan Pembayaran</h3>
            <p className="text-slate-400 text-xs mt-1">TRX Draft • Kasir Aktif</p>
          </div>
          
          <div className="px-6 space-y-3 mb-6">
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-bold text-white">Rp {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-400">Diskon</span>
              <span className="font-bold text-emerald-400">- Rp 0</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-400">PPN (11%)</span>
              <span className="font-bold text-white">Rp {tax.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-slate-800/50 flex justify-between items-center mb-6">
            <span className="font-bold text-slate-300 text-sm">Total Bayar</span>
            <span className="font-black text-2xl text-teal-400">
              Rp {total.toLocaleString()}
            </span>
          </div>
          
          <div className="px-6 mb-6">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Metode Pembayaran</div>
            <div className="grid grid-cols-2 gap-2">
              {['Cash', 'Debit', 'QRIS', 'Transfer'].map((method) => (
                <button 
                  key={method}
                  className={`py-3 px-2 rounded-[12px] text-[13px] font-bold transition-all ${
                    paymentMethod === method 
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method === 'Cash' ? 'Tunai' : method === 'Debit' ? 'Debit / Credit' : method}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-slate-950 mt-auto flex flex-col gap-3">
            <button 
              className="w-full bg-gradient-to-br from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-white rounded-[14px] py-4 text-[15px] font-black shadow-lg shadow-teal-500/20 border-0 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-5 w-5" />
              )}
              {isProcessing ? "Memproses..." : "Bayar (F12)"}
            </button>
            <div className="flex gap-2 w-full">
              <button 
                className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-[12px] py-3 text-[13px] font-bold transition-all flex items-center justify-center disabled:opacity-50"
                disabled={cart.length === 0 || isProcessing}
                onClick={() => {
                  holdCart(`Draft ${new Date().toLocaleTimeString()}`);
                  toast.success("Tersimpan ke Draft");
                }}
              >
                <Save className="mr-2 h-4 w-4" /> Hold (F4)
              </button>
              <button 
                className="bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white rounded-[12px] py-3 px-5 text-[13px] font-bold transition-all disabled:opacity-50"
                disabled={cart.length === 0 || isProcessing}
                onClick={clearCart}
              >
                Clear
              </button>
            </div>
            {lastReceipt && (
              <button 
                className="w-full mt-2 bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-[12px] py-2 text-xs font-bold transition-all flex items-center justify-center"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" /> Cetak Ulang Struk
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Hidden Print Area */}
      {lastReceipt && (
        <div id="print-area" className="hidden print:block">
          <div className="text-center font-bold text-lg mb-2 border-b border-dashed pb-2 text-black">
            POS APOTEK MODERN<br/>
            <span className="text-sm font-normal">Jl. Sehat Selalu No 123</span>
          </div>
          <div className="text-sm flex justify-between mb-2 text-black">
            <span>{lastReceipt.date}</span>
            <span>{lastReceipt.receiptNo}</span>
          </div>
          <div className="text-sm mb-4 border-b border-dashed pb-2 text-black">
            Kasir: Admin
          </div>
          <table className="w-full text-sm mb-4 text-black">
            <tbody>
              {lastReceipt.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td colSpan={2} className="py-1">
                    <div>{item.name}</div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{item.qty} x {item.price.toLocaleString()}</span>
                      <span>{(item.qty * item.price).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-sm flex justify-between font-bold border-t border-dashed pt-2 text-black">
            <span>TOTAL</span>
            <span>Rp {lastReceipt.total?.toLocaleString() || '0'}</span>
          </div>
          <div className="text-center text-xs mt-6 text-black">
            Terima Kasih<br/>
            Semoga Lekas Sembuh
          </div>
        </div>
      )}
    </>
  );
}
