'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from '../discounts/discounts.module.css';
import Swal from 'sweetalert2';

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

interface Drug {
  id: string;
  name: string;
  unit: string;
  category: string;
}

interface Batch {
  id: string;
  drug_id: string;
  batch_number: string;
  stock: number;
}

export default function ControlledLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ControlledLog[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [selectedDrugId, setSelectedDrugId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Fetch all options and logs
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch drugs (Psikotropika & Narkotika)
      const { data: drugData, error: drugError } = await supabase
        .from('drugs')
        .select('id, name, unit, category')
        .in('category', ['Psikotropika', 'Narkotika']);

      if (drugError) throw drugError;
      setDrugs(drugData || []);

      // 2. Fetch drug batches
      const { data: batchData, error: batchError } = await supabase
        .from('drug_batches')
        .select('id, drug_id, batch_number, stock');

      if (batchError) throw batchError;
      setBatches(batchData || []);

      // 3. Fetch controlled logs
      const { data: logsData, error: logsError } = await supabase
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

      if (logsError) throw logsError;

      const mapped = (logsData || []).map((item: any) => ({
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
      setDbError(false);
    } catch (err: any) {
      console.warn('Fallback simulation active:', err.message);
      setDbError(true);
      
      // Load fallback simulation data
      const fallbackDrugs: Drug[] = [
        { id: 'b19d5ba3-4841-47b3-9e91-143a433db703', name: 'Alprazolam 0.5mg', unit: 'Tablet', category: 'Psikotropika' },
        { id: 'narcotic-demo-01', name: 'Codeine 10mg', unit: 'Tablet', category: 'Narkotika' }
      ];
      setDrugs(fallbackDrugs);

      const fallbackBatches: Batch[] = [
        { id: 'batch-alp-01', drug_id: 'b19d5ba3-4841-47b3-9e91-143a433db703', batch_number: 'ALP9922', stock: 120 },
        { id: 'batch-cod-01', drug_id: 'narcotic-demo-01', batch_number: 'COD1188', stock: 45 }
      ];
      setBatches(fallbackBatches);

      const localLogs = localStorage.getItem('demo_controlled_logs');
      if (localLogs) {
        setLogs(JSON.parse(localLogs));
      } else {
        const defaultLogs: ControlledLog[] = [
          {
            id: 'log-demo-1',
            drug_id: 'b19d5ba3-4841-47b3-9e91-143a433db703',
            batch_id: 'batch-alp-01',
            user_id: 'demo-user',
            type: 'in',
            quantity: 100,
            notes: 'Penerimaan stok awal dari PBF Kimia Farma',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            drug: { name: 'Alprazolam 0.5mg', unit: 'Tablet' },
            batch: { batch_number: 'ALP9922' },
            profile: { full_name: 'Ade Wiramiharja (Admin)' }
          }
        ];
        localStorage.setItem('demo_controlled_logs', JSON.stringify(defaultLogs));
        setLogs(defaultLogs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter batches when drug selection changes
  useEffect(() => {
    if (selectedDrugId) {
      const filtered = batches.filter(b => b.drug_id === selectedDrugId);
      setFilteredBatches(filtered);
      if (filtered.length > 0) {
        setSelectedBatchId(filtered[0].id);
      } else {
        setSelectedBatchId('');
      }
    } else {
      setFilteredBatches([]);
      setSelectedBatchId('');
    }
  }, [selectedDrugId, batches]);

  // Handle manual mutation submission
  const handleSubmitMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrugId || !selectedBatchId) {
      Swal.fire('Input Belum Lengkap', 'Pilih obat dan nomor batch terlebih dahulu.', 'warning');
      return;
    }
    if (quantity <= 0) {
      Swal.fire('Input Tidak Valid', 'Jumlah mutasi harus lebih besar dari 0.', 'warning');
      return;
    }

    setSubmitLoading(true);

    try {
      let cashier_id = '00000000-0000-0000-0000-000000000000';
      let cashier_name = 'Ade Wiramiharja (Admin)';
      
      const sessionStr = localStorage.getItem('demo_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.user?.id) cashier_id = session.user.id;
        if (session?.name) cashier_name = session.name;
      }

      const selectedDrug = drugs.find(d => d.id === selectedDrugId)!;
      const selectedBatch = batches.find(b => b.id === selectedBatchId)!;

      if (dbError) {
        // Local simulation path
        const newLog: ControlledLog = {
          id: Math.random().toString(36).substring(2, 9),
          drug_id: selectedDrugId,
          batch_id: selectedBatchId,
          user_id: cashier_id,
          type,
          quantity,
          notes: notes || (type === 'in' ? 'Mutasi masuk manual' : 'Mutasi keluar manual'),
          created_at: new Date().toISOString(),
          drug: { name: selectedDrug.name, unit: selectedDrug.unit },
          batch: { batch_number: selectedBatch.batch_number },
          profile: { full_name: cashier_name }
        };

        const updatedLogs = [newLog, ...logs];
        localStorage.setItem('demo_controlled_logs', JSON.stringify(updatedLogs));
        setLogs(updatedLogs);

        // Update batch stock locally
        const updatedBatches = batches.map(b => {
          if (b.id === selectedBatchId) {
            return { ...b, stock: type === 'in' ? b.stock + quantity : Math.max(0, b.stock - quantity) };
          }
          return b;
        });
        setBatches(updatedBatches);

        Swal.fire('Simulasi Sukses', 'Mutasi manual berhasil disimpan di penyimpanan lokal.', 'success');
        resetForm();
      } else {
        // 1. Get current batch stock from database
        const { data: batch, error: getBatchError } = await supabase
          .from('drug_batches')
          .select('stock')
          .eq('id', selectedBatchId)
          .single();

        if (getBatchError) throw getBatchError;
        
        const currentStock = batch?.stock || 0;
        const newStock = type === 'in' ? currentStock + quantity : currentStock - quantity;

        if (newStock < 0) {
          Swal.fire('Stok Kurang', `Jumlah mutasi keluar melebihi stok yang ada (${currentStock}).`, 'error');
          setSubmitLoading(false);
          return;
        }

        // 2. Insert into controlled_drug_logs
        const { error: insertError } = await supabase
          .from('controlled_drug_logs')
          .insert([{
            drug_id: selectedDrugId,
            batch_id: selectedBatchId,
            user_id: cashier_id,
            type,
            quantity,
            notes: notes || (type === 'in' ? 'Mutasi masuk manual' : 'Mutasi keluar manual')
          }]);

        if (insertError) throw insertError;

        // 3. Update stock in drug_batches
        const { error: updateError } = await supabase
          .from('drug_batches')
          .update({ stock: newStock })
          .eq('id', selectedBatchId);

        if (updateError) throw updateError;

        Swal.fire('Berhasil', 'Mutasi obat khusus berhasil dicatat.', 'success');
        resetForm();
        fetchData();
      }
    } catch (err: any) {
      Swal.fire('Gagal Menyimpan', `Gagal mencatat mutasi: ${err.message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDrugId('');
    setSelectedBatchId('');
    setType('in');
    setQuantity(1);
    setNotes('');
  };

  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Buku Register Narkotika &amp; Psikotropika</h2>
        </div>
        <div className={styles.badge} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '12px' }}>
          🔒 Wajib Audit BPOM
        </div>
      </header>

      {/* RLS/SQL Setup Helper for controlled logs */}
      {dbError && (
        <div className={styles.warningBanner}>
          <div>
            <strong>⚠️ Tabel / Izin controlled_drug_logs Belum Dikonfigurasi:</strong> Fitur berjalan dalam mode <strong>Simulasi Lokal (localStorage)</strong>.
            Guna menyinkronkan dengan database Supabase Anda, silakan jalankan SQL berikut di <strong>SQL Editor Supabase</strong> Anda:
          </div>
          <code>{`CREATE TABLE IF NOT EXISTS public.controlled_drug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.drug_batches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.controlled_drug_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on logs" ON public.controlled_drug_logs FOR SELECT USING (true);
CREATE POLICY "Allow write access on logs" ON public.controlled_drug_logs FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.controlled_drug_logs TO anon, authenticated, service_role;`}</code>
          <div>
            Setelah selesai menjalankan query di atas pada database Supabase, silakan <strong>muat ulang halaman ini</strong>.
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Left Column: Mutation Entry Form */}
        <div className={`${styles.card} glass-panel`}>
          <h3>➕ Input Mutasi Manual</h3>
          <form onSubmit={handleSubmitMutation} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Pilih Obat Khusus (Narkotika/Psikotropika)</label>
              <select 
                className="input-field" 
                value={selectedDrugId} 
                onChange={(e) => setSelectedDrugId(e.target.value)}
                required
              >
                <option value="">-- Pilih Obat --</option>
                {drugs.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Pilih Nomor Batch</label>
              <select 
                className="input-field" 
                value={selectedBatchId} 
                onChange={(e) => setSelectedBatchId(e.target.value)}
                required
                disabled={!selectedDrugId}
              >
                <option value="">-- Pilih Batch --</option>
                {filteredBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.batch_number} (Stok: {b.stock})</option>
                ))}
              </select>
              {selectedDrugId && filteredBatches.length === 0 && (
                <span style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>
                  ⚠️ Belum ada batch aktif untuk obat ini di Gudang.
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Jenis Mutasi</label>
              <select 
                className="input-field" 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="in">📥 Mutasi Masuk (Restock/Penerimaan)</option>
                <option value="out">📤 Mutasi Keluar (Penyesuaian/Rusak)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Jumlah Mutasi</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Keterangan / Referensi</label>
              <textarea
                className="input-field"
                placeholder="Contoh: Penerimaan PBF Kimia Farma / Koreksi Stok Opname"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={submitLoading || (!!selectedDrugId && filteredBatches.length === 0)}>
              {submitLoading ? 'Menyimpan...' : 'Simpan Mutasi'}
            </button>
          </form>
        </div>

        {/* Right Column: Mutations Log Table */}
        <div className={`${styles.card} glass-panel`}>
          <h3> Catatan Riwayat Pengeluaran &amp; Penerimaan</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-12px' }}>
            Laporan mutasi di bawah ini terisi otomatis setiap kali transaksi obat golongan Psikotropika/Narkotika diselesaikan di layar kasir menggunakan resep dokter yang tervalidasi, atau ditambahkan secara manual di panel sebelah kiri.
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
                    <th>Operator</th>
                    <th>Jenis Mutasi</th>
                    <th>Jumlah</th>
                    <th>Keterangan / Referensi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
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
                          <span className={`badge ${log.type === 'in' ? styles.badgeActive : styles.badgeInactive}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
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
      </div>
    </div>
  );
}
