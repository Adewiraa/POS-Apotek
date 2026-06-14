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

  useEffect(() => {
    // Periksa sesi
    const checkUser = async () => {
      const demoSession = localStorage.getItem('demo_session');
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();

      if (demoSession) {
        setSession(JSON.parse(demoSession));
      } else if (supabaseSession) {
        // Tarik profil dari Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseSession.user.id)
          .single();

        setSession({
          user: { id: supabaseSession.user.id, email: supabaseSession.user.email || '' },
          role: (profile?.role as any) || 'cashier',
          name: profile?.full_name || supabaseSession.user.email || 'Staf',
        });
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('demo_session');
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

  return (
    <div className={styles.container}>
      {/* Sidebar / Top Nav */}
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.brand}>
          <span className={styles.logo}>💊</span>
          <div>
            <h2>Apotek Modern</h2>
            <span className={styles.badge}>POS System</span>
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
              <h3>Rp 2.450.000</h3>
              <p className={styles.statSub}>+12% dibanding kemarin</p>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>📄</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Resep Diproses</span>
              <h3>18 Resep</h3>
              <p className={styles.statSub}>Semua resep valid</p>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>⚠️</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Stok Menipis</span>
              <h3>4 Item</h3>
              <p className={styles.statSub} style={{ color: '#f59e0b' }}>Segera buat PO supplier</p>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>⏳</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Hampir Kedaluwarsa</span>
              <h3>2 Batch</h3>
              <p className={styles.statSub} style={{ color: '#ef4444' }}>Batas waktu &lt; 3 bulan</p>
            </div>
          </div>
        </section>

        {/* Navigation Grid */}
        <section className={styles.navSection}>
          <h3>Akses Cepat Fitur</h3>
          <div className={styles.menuGrid}>
            <div onClick={() => router.push('/pos')} className={`${styles.menuCard} glass-panel`}>
              <span className={styles.menuIcon}>🛒</span>
              <h4>Layar Kasir (POS)</h4>
              <p>Mulai transaksi penjualan baru, multi-payment, dan input resep dokter.</p>
            </div>

            <div onClick={() => router.push('/inventory')} className={`${styles.menuCard} glass-panel`}>
              <span className={styles.menuIcon}>📦</span>
              <h4>Gudang &amp; Inventaris</h4>
              <p>Kelola master data obat, no. batch, restock FEFO, dan penyesuaian stok.</p>
            </div>

            <div onClick={() => router.push('/controlled-logs')} className={`${styles.menuCard} glass-panel`}>
              <span className={styles.menuIcon}>📝</span>
              <h4>Register Narkotika &amp; Psikotropika</h4>
              <p>Buku log pengeluaran obat psikotropika wajib BPOM &amp; Kemenkes RI.</p>
            </div>

            <div onClick={() => router.push('/reports')} className={`${styles.menuCard} glass-panel`}>
              <span className={styles.menuIcon}>📊</span>
              <h4>Laporan &amp; Analitik</h4>
              <p>Grafik penjualan harian, barang terlaris, laba-rugi, dan histori transaksi.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
