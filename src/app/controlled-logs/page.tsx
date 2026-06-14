'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from '../inventory/inventory.module.css';

interface ControlledLog {
  id: string;
  drug_id: string;
  batch_id: string;
  user_id: string;
  type: 'in' | 'out';
  quantity: number;
  notes: string | null;
  created_at: string;
  drug?: {
    name: string;
    unit: string;
  };
  batch?: {
    batch_number: string;
  };
  profile?: {
    full_name: string;
  };
}

export default function ControlledLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ControlledLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('controlled_drug_logs')
        .select(`
          id,
          drug_id,
          batch_id,
          user_id,
          type,
          quantity,
          notes,
          created_at,
          drugs (name, unit),
          drug_batches (batch_number),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          drug_id: item.drug_id,
          batch_id: item.batch_id,
          user_id: item.user_id,
          type: item.type,
          quantity: item.quantity,
          notes: item.notes,
          created_at: item.created_at,
          drug: { name: item.drugs?.name || 'Obat Tidak Dikenal', unit: item.drugs?.unit || 'Pcs' },
          batch: { batch_number: item.drug_batches?.batch_number || 'N/A' },
          profile: { full_name: item.profiles?.full_name || 'Petugas Apotek' }
        }));
        setLogs(mapped);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching controlled logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Buku Register Narkotika &amp; Psikotropika</h2>
        </div>
        <div className={styles.badge} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          🔒 Wajib Audit BPOM
        </div>
      </header>

      <main className={styles.main}>
        <div className={`${styles.card} glass-panel`} style={{ gridColumn: 'span 2' }}>
          <h3>Catatan Riwayat Pengeluaran &amp; Penerimaan Obat Kategori Khusus</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-12px' }}>
            Laporan mutasi di bawah ini terisi otomatis setiap kali transaksi obat golongan Psikotropika/Narkotika diselesaikan di layar kasir menggunakan resep dokter yang tervalidasi.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Waktu &amp; Tanggal</th>
                    <th>Nama Obat</th>
                    <th>No. Batch</th>
                    <th>Operator (Apoteker)</th>
                    <th>Jenis Mutasi</th>
                    <th>Jumlah</th>
                    <th>Keterangan / Referensi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Belum ada riwayat mutasi obat khusus yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td><strong>{log.drug?.name}</strong></td>
                        <td><code>{log.batch?.batch_number}</code></td>
                        <td>{log.profile?.full_name}</td>
                        <td>
                          <span className={`${styles.badge} ${log.type === 'in' ? styles['badge-success'] : styles['badge-danger']}`}>
                            {log.type === 'in' ? '📥 Masuk' : '📤 Keluar'}
                          </span>
                        </td>
                        <td>{log.quantity} {log.drug?.unit}</td>
                        <td><span style={{ fontSize: '13px' }}>{log.notes || '-'}</span></td>
                      </tr>
                    ))
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
