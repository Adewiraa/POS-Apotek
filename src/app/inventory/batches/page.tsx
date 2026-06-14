'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '../inventory.module.css';

interface Drug {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  drug_id: string;
  batch_number: string;
  expiry_date: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  drug?: {
    name: string;
  };
}

export default function BatchesPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedDrugId, setSelectedDrugId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch drugs for dropdown selection
      const { data: drugsData } = await supabase
        .from('drugs')
        .select('id, name')
        .order('name', { ascending: true });

      if (drugsData) setDrugs(drugsData);

      // Fetch batches sorted by Expiry Date (FEFO)
      const { data: batchesData, error: batchesError } = await supabase
        .from('drug_batches')
        .select(`
          id,
          drug_id,
          batch_number,
          expiry_date,
          purchase_price,
          selling_price,
          stock,
          drugs (name)
        `)
        .order('expiry_date', { ascending: true });

      if (batchesError) throw batchesError;

      if (batchesData && batchesData.length > 0) {
        // Map the relation field from drugs to drug key for UI compatibility
        const mapped = batchesData.map((b: any) => ({
          ...b,
          drug: { name: b.drugs?.name || 'Obat Tidak Dikenal' }
        }));
        setBatches(mapped);
      } else {
        // Fallback mock data jika database kosong
        setBatches([]);
      }
    } catch (err) {
      console.error('Error fetching batch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrugId) {
      alert('Pilih obat terlebih dahulu.');
      return;
    }
    setSubmitting(true);

    const newBatchData = {
      drug_id: selectedDrugId,
      batch_number: batchNumber,
      expiry_date: expiryDate,
      purchase_price: Number(purchasePrice),
      selling_price: Number(sellingPrice),
      stock: Number(stock),
    };

    try {
      // Simpan ke Supabase
      const { data, error } = await supabase
        .from('drug_batches')
        .insert([newBatchData])
        .select(`
          id,
          drug_id,
          batch_number,
          expiry_date,
          purchase_price,
          selling_price,
          stock,
          drugs (name)
        `) as any;

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = {
          ...data[0],
          drug: { name: data[0].drugs?.name || 'Obat Baru' }
        } as Batch;
        setBatches(prev => [...prev, mapped].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)));
      }

      // Reset Form
      setBatchNumber('');
      setExpiryDate('');
      setPurchasePrice('');
      setSellingPrice('');
      setStock('');
      alert('Batch obat baru berhasil dicatat!');
    } catch (err: any) {
      console.warn('Gagal menyimpan batch ke Supabase (simulasi lokal):', err.message);
      // Fallback lokal untuk demo
      const selectedDrug = drugs.find(d => d.id === selectedDrugId);
      const mockBatch: Batch = {
        id: `mock-batch-${Date.now()}`,
        ...newBatchData,
        drug: { name: selectedDrug?.name || 'Obat Demo' }
      };
      setBatches(prev => [...prev, mockBatch].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)));
      
      // Reset Form
      setBatchNumber('');
      setExpiryDate('');
      setPurchasePrice('');
      setSellingPrice('');
      setStock('');
    } finally {
      setSubmitting(false);
    }
  };

  // Kalkulasi Status Expiry (FEFO)
  const getExpiryStatus = (expiryDateStr: string, currentStock: number) => {
    if (currentStock <= 0) return { label: 'Stok Habis', class: styles['badge-danger'] };
    
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    if (expiry <= today) {
      return { label: 'Kedaluwarsa', class: styles['badge-danger'] };
    } else if (expiry <= threeMonthsFromNow) {
      return { label: 'Segera Expired', class: styles['badge-warning'] };
    }
    return { label: 'Aman', class: styles['badge-success'] };
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className={styles.grid}>
      {/* Kolom Kiri: Tabel Antrean Batch FEFO */}
      <div className={`${styles.card} glass-panel`}>
        <h3>Urutan Stok Keluar (FEFO Model)</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-12px' }}>
          *Obat diurutkan berdasarkan tanggal kedaluwarsa terdekat untuk diprioritaskan keluar terlebih dahulu.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Obat</th>
                  <th>Nomor Batch</th>
                  <th>Tanggal Expired</th>
                  <th>Stok Aktif</th>
                  <th>Harga Jual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Belum ada stok batch yang dicatat. Silakan masukkan batch baru di kolom kanan.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const status = getExpiryStatus(batch.expiry_date, batch.stock);
                    return (
                      <tr key={batch.id}>
                        <td><strong>{batch.drug?.name}</strong></td>
                        <td><code>{batch.batch_number}</code></td>
                        <td>{new Date(batch.expiry_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        <td>{batch.stock}</td>
                        <td>{formatRupiah(batch.selling_price)}</td>
                        <td>
                          <span className={`${styles.badge} ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kolom Kanan: Form Input Batch Masuk */}
      <div className={`${styles.card} glass-panel`}>
        <h3>Catat Batch / Stok Masuk</h3>
        <form onSubmit={handleAddBatch} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Pilih Obat</label>
            <select
              className="input-field"
              value={selectedDrugId}
              onChange={(e) => setSelectedDrugId(e.target.value)}
              required
            >
              <option value="">-- Pilih Obat dari Katalog --</option>
              {drugs.map(drug => (
                <option key={drug.id} value={drug.id}>{drug.name}</option>
              ))}
            </select>
            {drugs.length === 0 && (
              <span style={{ fontSize: '11px', color: 'var(--error)' }}>
                *Katalog obat kosong. Harap tambahkan obat terlebih dahulu di tab Master Obat.
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Nomor Batch</label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: BTC-2026-001"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tanggal Kedaluwarsa</label>
            <input
              type="date"
              className="input-field"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Harga Beli (Rp)</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Harga Jual (Rp)</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Jumlah Stok Masuk</label>
            <input
              type="number"
              className="input-field"
              placeholder="Contoh: 100"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min={1}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan Batch'}
          </button>
        </form>
      </div>
    </div>
  );
}
