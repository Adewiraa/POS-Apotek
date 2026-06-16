'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './dashboard.module.css';

interface UserSession {
  user: { id: string; email: string };
  role: 'admin' | 'pharmacist' | 'cashier';
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dynamic permissions state
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    pos: true,
    inventory: false,
    controlled_logs: false,
    reports: false,
    discounts: false,
    users: false,
    returns: false,
    procurement: false,
    alerts: false
  });

  // Live Stats
  const [todaySales, setTodaySales] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiryCount, setExpiryCount] = useState(0);

  // Fetch permissions for active role
  const fetchPermissions = async (role: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('menu_key, is_allowed')
        .eq('role', role);

      if (error) throw error;
      
      const permMap: Record<string, boolean> = {};
      data?.forEach((p: any) => {
        permMap[p.menu_key] = p.is_allowed;
      });
      setPermissions(prev => ({ ...prev, ...permMap }));
    } catch (_) {
      // Fallback to local storage or defaults if database table is not ready
      const local = localStorage.getItem('demo_role_permissions');
      let allPerms = [];
      if (local) {
        allPerms = JSON.parse(local);
      } else {
        allPerms = [
          { role: 'admin', menu_key: 'pos', is_allowed: true },
          { role: 'admin', menu_key: 'inventory', is_allowed: true },
          { role: 'admin', menu_key: 'controlled_logs', is_allowed: true },
          { role: 'admin', menu_key: 'reports', is_allowed: true },
          { role: 'admin', menu_key: 'discounts', is_allowed: true },
          { role: 'admin', menu_key: 'users', is_allowed: true },
          { role: 'admin', menu_key: 'returns', is_allowed: true },
          { role: 'admin', menu_key: 'procurement', is_allowed: true },
          { role: 'admin', menu_key: 'alerts', is_allowed: true },
          { role: 'pharmacist', menu_key: 'pos', is_allowed: true },
          { role: 'pharmacist', menu_key: 'inventory', is_allowed: true },
          { role: 'pharmacist', menu_key: 'controlled_logs', is_allowed: true },
          { role: 'pharmacist', menu_key: 'reports', is_allowed: false },
          { role: 'pharmacist', menu_key: 'discounts', is_allowed: false },
          { role: 'pharmacist', menu_key: 'users', is_allowed: false },
          { role: 'pharmacist', menu_key: 'returns', is_allowed: true },
          { role: 'pharmacist', menu_key: 'procurement', is_allowed: true },
          { role: 'pharmacist', menu_key: 'alerts', is_allowed: true },
          { role: 'cashier', menu_key: 'pos', is_allowed: true },
          { role: 'cashier', menu_key: 'inventory', is_allowed: false },
          { role: 'cashier', menu_key: 'controlled_logs', is_allowed: false },
          { role: 'cashier', menu_key: 'reports', is_allowed: false },
          { role: 'cashier', menu_key: 'discounts', is_allowed: false },
          { role: 'cashier', menu_key: 'users', is_allowed: false },
          { role: 'cashier', menu_key: 'returns', is_allowed: true },
          { role: 'cashier', menu_key: 'procurement', is_allowed: false },
          { role: 'cashier', menu_key: 'alerts', is_allowed: false }
        ];
      }
      const permMap: Record<string, boolean> = {};
      allPerms.filter((p: any) => p.role === role).forEach((p: any) => {
        permMap[p.menu_key] = p.is_allowed;
      });
      setPermissions(prev => ({ ...prev, ...permMap }));
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const demoSession = localStorage.getItem('demo_session');
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();

      let activeSession: UserSession | null = null;

      if (demoSession) {
        activeSession = JSON.parse(demoSession);
      } else if (supabaseSession) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseSession.user.id)
          .single();

        activeSession = {
          user: { id: supabaseSession.user.id, email: supabaseSession.user.email || '' },
          role: (profile?.role as any) || 'cashier',
          name: profile?.full_name || supabaseSession.user.email || 'Staf',
        };
      }

      if (activeSession) {
        setSession(activeSession);
        // Load role permissions
        await fetchPermissions(activeSession.role);
        // Tarik data statistik riil dari database
        fetchStats();
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const fetchStats = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartStr = todayStart.toISOString();

      // 1. Omset Hari Ini
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', todayStartStr);
      
      const salesSum = sales?.reduce((sum, item) => sum + Number(item.total_amount), 0) || 0;
      setTodaySales(salesSum);

      // 2. Jumlah Resep Hari Ini
      const { count: rxCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .not('prescription_id', 'is', null)
        .gte('created_at', todayStartStr);
      
      setPrescriptionCount(rxCount || 0);

      // 3. Stok Menipis (Batch dengan stok <= 10)
      const { count: lowCount } = await supabase
        .from('drug_batches')
        .select('*', { count: 'exact', head: true })
        .lte('stock', 10)
        .gt('stock', 0);
      
      setLowStockCount(lowCount || 0);

      // 4. Hampir Kedaluwarsa (< 3 Bulan)
      const threeMonthsOut = new Date();
      threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);
      const threeMonthsOutStr = threeMonthsOut.toISOString().split('T')[0];

      const { count: expCount } = await supabase
        .from('drug_batches')
        .select('*', { count: 'exact', head: true })
        .lte('expiry_date', threeMonthsOutStr)
        .gt('stock', 0);

      setExpiryCount(expCount || 0);

    } catch (err) {
      console.error('Error fetching live stats:', err);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('demo_session');
    document.cookie = "demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner"></div>
      </div>
    );
  }

  const roleLabels = {
    admin: 'Administrator',
    pharmacist: 'Apoteker',
    cashier: 'Kasir',
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className={styles.container}>
      {/* Sidebar / Top Nav */}
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.brand}>
          <span className={styles.logo}>💊</span>
          <div>
            <h2>ApoGo</h2>
            <span className={styles.badge}>Sistem POS Apotek</span>
          </div>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{session?.name}</span>
            <span className={styles.userRole}>{roleLabels[session?.role || 'cashier']}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
            Keluar 🚪
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Stat Cards */}
        <section className={styles.statsGrid}>
          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>💵</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Omset Hari Ini</span>
              <h3>{formatRupiah(todaySales)}</h3>
              <p className={styles.statSub}>Berdasarkan transaksi kasir</p>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>📄</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Resep Diproses</span>
              <h3>{prescriptionCount} Resep</h3>
              <p className={styles.statSub}>Faktur resep hari ini</p>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>⚠️</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Stok Menipis</span>
              <h3>{lowStockCount} Item</h3>
              <p className={styles.statSub} style={{ color: '#f59e0b' }}>Batch dengan stok &le; 10</p>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>⏳</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Hampir Kedaluwarsa</span>
              <h3>{expiryCount} Batch</h3>
              <p className={styles.statSub} style={{ color: '#ef4444' }}>Batas waktu &lt; 3 bulan</p>
            </div>
          </div>
        </section>

        {/* Navigation Grid */}
        <section className={styles.navSection}>
          <h3>Akses Cepat Fitur</h3>
          <div className={styles.menuGrid}>
            {/* Layar Kasir */}
            {permissions.pos && (
              <div onClick={() => router.push('/pos')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>🛒</span>
                <h4>Layar Kasir (POS)</h4>
                <p>Mulai transaksi penjualan baru, multi-payment, dan input resep dokter.</p>
              </div>
            )}

            {/* Gudang & Inventaris */}
            {permissions.inventory && (
              <div onClick={() => router.push('/inventory')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>📦</span>
                <h4>Gudang &amp; Inventaris</h4>
                <p>Kelola master data obat, no. batch, restock FEFO, dan penyesuaian stok.</p>
              </div>
            )}

            {/* Register Narkotika & Psikotropika */}
            {permissions.controlled_logs && (
              <div onClick={() => router.push('/controlled-logs')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>📝</span>
                <h4>Register Narkotika &amp; Psikotropika</h4>
                <p>Buku log pengeluaran obat psikotropika wajib BPOM &amp; Kemenkes RI.</p>
              </div>
            )}

            {/* Retur Penjualan & Pembelian */}
            {permissions.returns && (
              <div onClick={() => router.push('/returns')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>🔄</span>
                <h4>Retur Penjualan &amp; Pembelian</h4>
                <p>Kelola retur obat dari pelanggan atau pengembalian obat kadaluarsa/rusak ke PBF.</p>
              </div>
            )}

            {/* Pengadaan / PO ke PBF */}
            {permissions.procurement && (
              <div onClick={() => router.push('/procurement')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>🛒</span>
                <h4>Pengadaan / PO ke PBF</h4>
                <p>Terbitkan dokumen PO baru ke PBF distributor dan terima pengiriman stok masuk.</p>
              </div>
            )}

            {/* Pengaturan Alert & Notifikasi */}
            {permissions.alerts && (
              <div onClick={() => router.push('/alerts')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>📧</span>
                <h4>Alert Stok &amp; Expired Date</h4>
                <p>Konfigurasi notifikasi email &amp; WhatsApp untuk stok obat habis dan kadaluarsa.</p>
              </div>
            )}

            {/* Laporan & Analitik */}
            {permissions.reports && (
              <div onClick={() => router.push('/reports')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>📊</span>
                <h4>Laporan &amp; Analitik</h4>
                <p>Grafik penjualan harian, barang terlaris, laba-rugi, dan histori transaksi.</p>
              </div>
            )}

            {/* Pengaturan Diskon */}
            {permissions.discounts && (
              <div onClick={() => router.push('/discounts')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>🏷️</span>
                <h4>Pengaturan Diskon</h4>
                <p>Kelola event diskon otomatis berdasarkan minimal jumlah belanja (Subtotal).</p>
              </div>
            )}

            {/* Manajemen Pengguna */}
            {permissions.users && (
              <div onClick={() => router.push('/users')} className={`${styles.menuCard} glass-panel`}>
                <span className={styles.menuIcon}>👥</span>
                <h4>Manajemen Pengguna</h4>
                <p>Kelola data staf apotek, registrasi akun baru, dan atur hak akses/role.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
