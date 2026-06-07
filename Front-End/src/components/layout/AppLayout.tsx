"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Pill, LayoutDashboard, ShoppingCart,
  Package, Boxes, ArrowDownToLine, ClipboardList, Undo2,
  FileText, Receipt, Network, Building2, Search, LogOut, X, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchAPI } from "@/lib/api";
import type { SearchResultItem, SearchData } from "@/types/api";

const allNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "apoteker", "kasir"] },
  { name: "POS Kasir", href: "/pos", icon: ShoppingCart, roles: ["admin", "kasir"] },
  { name: "Master Produk", href: "/products", icon: Package, roles: ["admin", "apoteker"] },
  { name: "Stok & Batch", href: "/batches", icon: Boxes, roles: ["admin", "apoteker"] },
  { name: "Barang Masuk", href: "/receiving", icon: ArrowDownToLine, roles: ["admin", "apoteker"] },
  { name: "Stock Opname", href: "/stock-opname", icon: ClipboardList, roles: ["admin", "apoteker"] },
  { name: "Retur Barang", href: "/returns", icon: Undo2, roles: ["admin", "apoteker"] },
  { name: "Resep", href: "/prescriptions", icon: FileText, roles: ["admin", "apoteker", "kasir"] },
  { name: "Penjualan", href: "/sales", icon: Receipt, roles: ["admin"] },
  { name: "Dashboard HQ", href: "/hq", icon: Building2, roles: ["admin"] },
  { name: "SATUSEHAT", href: "/satusehat", icon: Network, roles: ["admin", "apoteker"] },
];

// ── Type Badge Color ───────────────────────────────────────────
const typeBadge: Record<string, { bg: string; text: string }> = {
  produk:  { bg: "bg-teal-50",  text: "text-teal-700"  },
  pasien:  { bg: "bg-sky-50",   text: "text-sky-700"   },
  resep:   { bg: "bg-violet-50", text: "text-violet-700" },
};

function TypePill({ type }: { type: string }) {
  const c = typeBadge[type] ?? { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`text-[10px] font-black uppercase rounded-full px-2 py-0.5 ${c.bg} ${c.text}`}>
      {type}
    </span>
  );
}

// ── Global Search Bar ─────────────────────────────────────────
function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const search = useCallback((q: string) => {
    if (q.trim().length < 1) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    SearchAPI.global(q, 5)
      .then((res) => {
        setResults(res.data);
      })
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allItems: SearchResultItem[] = results
    ? [
        ...(results.produk ?? []),
        ...(results.pasien ?? []),
        ...(results.resep ?? []),
      ]
    : [];

  function handleSelect(item: SearchResultItem) {
    setOpen(false);
    setQuery("");
    router.push(item.url);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        id="global-search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length > 0 && setOpen(true)}
        placeholder="Cari pasien, produk, resep..."
        autoComplete="off"
        className="w-[300px] lg:w-[400px] border border-slate-200 rounded-[16px] py-3 pr-10 pl-11 font-bold text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setResults(null); setOpen(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Hapus pencarian"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-full lg:w-[480px] bg-white rounded-[18px] border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.12)] z-50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-8 text-slate-400 text-sm font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              Mencari...
            </div>
          ) : allItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm font-bold">
              Tidak ada hasil untuk &quot;{query}&quot;
            </div>
          ) : (
            <ul className="max-h-[380px] overflow-y-auto py-2">
              {allItems.map((item, idx) => (
                <li key={`${item.type}-${item.id}-${idx}`}>
                  <button
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-slate-900 truncate">{item.label}</span>
                        <TypePill type={item.type} />
                      </div>
                      {item.sub_label && (
                        <p className="text-xs text-slate-500 truncate">{item.sub_label}</p>
                      )}
                    </div>
                    {item.meta && (
                      <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{item.meta}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          {results && (
            <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 text-[11px] text-slate-400 font-bold flex justify-between">
              <span>
                {results.produk.length} produk • {results.pasien.length} pasien • {results.resep.length} resep
              </span>
              <span>Tekan Enter atau klik item</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const currentRole = user?.role || "admin";
  const filteredNavItems = allNavItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="fixed inset-y-0 left-0 w-[280px] bg-white/90 border-r border-slate-200 p-[22px] flex flex-col gap-5 z-40 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3 pb-[18px] border-b border-slate-200">
        <div className="w-[46px] h-[46px] rounded-[16px] bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/20">
          <Pill className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-black text-slate-900 m-0 leading-tight">Pharmify</h1>
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-500 m-0 mt-1">Pharmacy Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 overflow-y-auto pr-2 pb-4 flex-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-[15px] font-extrabold text-[14px] transition-all
                ${isActive
                  ? "bg-gradient-to-br from-teal-600 to-sky-500 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <span className={`w-7 h-7 rounded-[10px] flex items-center justify-center
                ${isActive ? "bg-white/20 text-white" : "bg-teal-600/10 text-teal-600"}
              `}>
                <item.icon className="h-4 w-4" />
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="mt-auto bg-gradient-to-br from-slate-900 to-teal-800 text-white rounded-[20px] p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-sky-400 flex items-center justify-center font-bold shadow-inner">
            {user?.name?.substring(0, 2).toUpperCase() || "KA"}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{user?.name || "Kasir Aktif"}</p>
            <p className="text-[11px] text-slate-300 capitalize">{currentRole} • Shift Pagi</p>
          </div>
        </div>
        <button
          onClick={() => {
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
            router.push("/login");
          }}
          className="w-full bg-white/10 hover:bg-white/20 text-white border-0 rounded-[12px] p-2.5 text-xs font-black transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </aside>
  );
}

// ── App Layout ────────────────────────────────────────────────
export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSessionWarning(true);
    }, 1000 * 60 * 30);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#eef4f8] text-slate-900" style={{ backgroundImage: "radial-gradient(circle at top left, rgba(20, 184, 166, 0.12), transparent 34%)" }}>
      <AppSidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] p-6 lg:p-8 flex flex-col">
        {/* Topbar dengan Global Search */}
        <header className="flex items-center justify-end gap-4 mb-6">
          <GlobalSearchBar />
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>

      <Dialog open={showSessionWarning} onOpenChange={setShowSessionWarning}>
        <DialogContent className="rounded-[22px]">
          <DialogHeader>
            <DialogTitle className="font-bold">Sesi Hampir Berakhir</DialogTitle>
            <DialogDescription>
              Karena tidak ada aktivitas selama beberapa waktu, sesi Anda akan segera berakhir demi keamanan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => router.push("/login")} className="rounded-[12px] font-bold">
              Keluar Sekarang
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-[12px] font-bold" onClick={() => setShowSessionWarning(false)}>
              Perpanjang Sesi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
