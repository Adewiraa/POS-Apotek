'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './inventory.module.css';

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* Subnav Header */}
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Manajemen Inventaris</h2>
        </div>
        <nav className={styles.navLinks}>
          <Link href="/inventory" className={`${styles.navLink} ${pathname === '/inventory' ? styles.active : ''}`}>
            💊 Master Obat
          </Link>
          <Link href="/inventory/batches" className={`${styles.navLink} ${pathname === '/inventory/batches' ? styles.active : ''}`}>
            📦 Batch &amp; Stok Masuk
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
