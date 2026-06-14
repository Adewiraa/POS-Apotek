'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './reports.module.css';

interface Sale {
  id: string;
  invoice_number: string;
  total_amount: number;
  discount: number;
  tax: number;
  created_at: string;
  profile?: {
    full_name: string;
  };
  payments?: {
    payment_method: string;
    amount: number;
  }[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Summary statistics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      // Fetch sales with cashier profiles and payments
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          total_amount,
          discount,
          tax,
          created_at,
          profiles (full_name),
          sale_payments (payment_method, amount)
        `)
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Sale[] = data.map((item: any) => ({
          id: item.id,
          invoice_number: item.invoice_number,
          total_amount: Number(item.total_amount),
          discount: Number(item.discount),
          tax: Number(item.tax),
          created_at: item.created_at,
          profile: { full_name: item.profiles?.full_name || 'Kasir Apotek' },
          payments: (item.sale_payments || []).map((p: any) => ({
            payment_method: p.payment_method,
            amount: Number(p.amount)
          }))
        }));

        setSales(mapped);

        // Calculate summaries
        const rev = mapped.reduce((sum, s) => sum + s.total_amount, 0);
        const disc = mapped.reduce((sum, s) => sum + s.discount, 0);
        const tx = mapped.reduce((sum, s) => sum + s.tax, 0);
        
        setTotalRevenue(rev);
        setTotalDiscount(disc);
        setTotalTax(tx);
        setInvoiceCount(mapped.length);

      } else {
        // Fallback mock data jika database kosong
        const mockSales: Sale[] = [
          {
            id: 's1',
            invoice_number: 'INV-20260614-9920',
            total_amount: 57500,
            discount: 10000,
            tax: 2500,
            created_at: new Date().toISOString(),
            profile: { full_name: 'Kasir Rina' },
            payments: [
              { payment_method: 'insurance', amount: 40000 },
              { payment_method: 'qris', amount: 17500 }
            ]
          },
          {
            id: 's2',
            invoice_number: 'INV-20260614-7261',
            total_amount: 15000,
            discount: 0,
            tax: 0,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            profile: { full_name: 'Kasir Rina' },
            payments: [
              { payment_method: 'cash', amount: 15000 }
            ]
          }
        ];
        setSales(mockSales);
        setTotalRevenue(72500);
        setTotalDiscount(10000);
        setTotalTax(2500);
        setInvoiceCount(2);
      }
    } catch (err) {
      console.error('Error fetching sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const getMethodEmoji = (method: string) => {
    switch (method) {
      case 'cash': return '💵 Tunai';
      case 'qris': return '📱 QRIS';
      case 'card': return '💳 Kartu';
      case 'insurance': return '🛡️ Asuransi';
      default: return method;
    }
  };

  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Laporan Penjualan &amp; Finansial</h2>
        </div>
        <button onClick={fetchSalesReport} className="btn btn-primary" style={{ padding: '8px 16px' }}>
          🔄 Refresh Data
        </button>
      </header>

      {/* Summary Cards */}
      <section className={styles.statsGrid}>
        <div className={`${styles.statCard} glass-panel`}>
          <span className={styles.statLabel}>Total Omset</span>
          <h3>{formatRupiah(totalRevenue)}</h3>
          <p className={styles.statSub}>Pendapatan bersih apotek</p>
        </div>

        <div className={`${styles.statCard} glass-panel`}>
          <span className={styles.statLabel}>Total Diskon Diberikan</span>
          <h3>{formatRupiah(totalDiscount)}</h3>
          <p className={styles.statSub}>Promosi &amp; subsidi harga</p>
        </div>

        <div className={`${styles.statCard} glass-panel`}>
          <span className={styles.statLabel}>Pajak &amp; Jasa Terkumpul</span>
          <h3>{formatRupiah(totalTax)}</h3>
          <p className={styles.statSub}>Jasa peracikan &amp; PPN</p>
        </div>

        <div className={`${styles.statCard} glass-panel`}>
          <span className={styles.statLabel}>Jumlah Transaksi</span>
          <h3>{invoiceCount} Invoice</h3>
          <p className={styles.statSub}>Faktur terbit bulan ini</p>
        </div>
      </section>

      {/* Detail Riwayat Transaksi */}
      <main className={styles.main}>
        <div className={`${styles.card} glass-panel`}>
          <h3>Log Histori Faktur Invoice (Multi-Payment Breakdown)</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Waktu Pembuatan</th>
                    <th>No. Invoice</th>
                    <th>Kasir</th>
                    <th>Subtotal Biaya</th>
                    <th>Potongan Diskon</th>
                    <th>Pajak / Jasa</th>
                    <th>Metode Pembayaran (Split)</th>
                    <th>Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{new Date(sale.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td><code>{sale.invoice_number}</code></td>
                      <td>{sale.profile?.full_name}</td>
                      <td>{formatRupiah(sale.total_amount + sale.discount - sale.tax)}</td>
                      <td style={{ color: 'var(--error)' }}>-{formatRupiah(sale.discount)}</td>
                      <td style={{ color: 'var(--primary)' }}>+{formatRupiah(sale.tax)}</td>
                      <td>
                        <div className={styles.paymentMethodsCol}>
                          {sale.payments?.map((pay, i) => (
                            <span key={i} className={styles.payBadge}>
                              {getMethodEmoji(pay.payment_method)}: {formatRupiah(pay.amount)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><strong>{formatRupiah(sale.total_amount)}</strong></td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Belum ada data penjualan tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
