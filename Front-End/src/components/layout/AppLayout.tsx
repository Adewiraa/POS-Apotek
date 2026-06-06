"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Pill, LayoutDashboard, ShoppingCart, 
  Package, Boxes, ArrowDownToLine, ClipboardList, Undo2,
  FileText, Receipt, Network, Building2, Search, LogOut
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
        <div className="w-[46px] h-[46px] rounded-[16px] bg-gradient-to-br from-teal-600 to-green-500 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/20">
          <Pill className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-black text-slate-900 m-0 leading-tight">POS Apotek</h1>
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-500 m-0 mt-1">Modern</p>
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
                  ? 'bg-gradient-to-br from-teal-600 to-sky-500 text-white shadow-md shadow-teal-500/20' 
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <span className={`w-7 h-7 rounded-[10px] flex items-center justify-center
                ${isActive ? 'bg-white/20 text-white' : 'bg-teal-600/10 text-teal-600'}
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
    <div className="flex min-h-screen bg-[#eef4f8] text-slate-900" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(20, 184, 166, 0.12), transparent 34%)' }}>
      <AppSidebar />
      
      <main className="ml-[280px] w-[calc(100%-280px)] p-6 lg:p-8 flex flex-col">
        {/* Topbar Replaced directly in pages usually, but we can put a global one or let pages handle it */}
        <header className="flex items-center justify-end gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari pasien, produk, resep..." 
              className="w-[300px] lg:w-[400px] border border-slate-200 rounded-[16px] py-3 pr-4 pl-11 font-bold text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all"
            />
          </div>
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
