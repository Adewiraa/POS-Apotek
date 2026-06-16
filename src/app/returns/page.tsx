'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './returns.module.css';
import Swal from 'sweetalert2';

interface ReturnLog {
  id: string;
  type: 'customer' | 'supplier';
  invoice_number: string | null;
  drug_id: string;
  batch_id: string;
  quantity: number;
  reason: string;
  created_at: string;
  drug?: {
    name: string;
    unit: string;
  };
  batch?: {
    batch_number: string;
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

interface InvoiceItem {
  drug_id: string;
  batch_id: string;
  name: string;
  batch_number: string;
  quantity: number;
  price: number;
  unit: string;
}

export default function ReturnsPage() {
  const router = useRouter();
  const [returnLogs, setReturnLogs] = useState<ReturnLog[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [returnType, setReturnType] = useState<'customer' | 'supplier'>('customer');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [searchingInvoiceLoading, setSearchingInvoiceLoading] = useState(false);
  const [selectedInvoiceItem, setSelectedInvoiceItem] = useState<InvoiceItem | null>(null);

  // Supplier return states
  const [selectedDrugId, setSelectedDrugId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  // Common form inputs
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch drugs
      const { data: drugData, error: drugError } = await supabase
        .from('drugs')
        .select('id, name, unit, category');

      if (drugError) throw drugError;
      setDrugs(drugData || []);

      // 2. Fetch drug batches
      const { data: batchData, error: batchError } = await supabase
        .from('drug_batches')
        .select('id, drug_id, batch_number, stock');

      if (batchError) throw batchError;
      setBatches(batchData || []);

      // 3. Fetch return logs
      const { data: returnData, error: returnError } = await supabase
        .from('drug_returns')
        .select(`
          id,
          type,
          invoice_number,
          drug_id,
          batch_id,
          quantity,
          reason,
          created_at,
          drugs (name, unit),
          drug_batches (batch_number)
        `)
        .order('created_at', { ascending: false }) as any;

      if (returnError) throw returnError;

      const mapped: ReturnLog[] = (returnData || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        invoice_number: item.invoice_number,
        drug_id: item.drug_id,
        batch_id: item.batch_id,
        quantity: item.quantity,
        reason: item.reason,
        created_at: item.created_at,
        drug: { name: item.drugs?.name || 'Obat', unit: item.drugs?.unit || 'Pcs' },
        batch: { batch_number: item.drug_batches?.batch_number || 'Batch' }
      }));

      setReturnLogs(mapped);
      setDbError(false);
    } catch (err: any) {
      console.warn('Gagal memuat dari database, masuk mode simulasi:', err.message);
      setDbError(true);
      
      // Load fallback simulation data
      const localLogs = localStorage.getItem('demo_returns');
      if (localLogs) {
        setReturnLogs(JSON.parse(localLogs));
      } else {
        const defaultLogs: ReturnLog[] = [
          {
            id: 'ret-1',
            type: 'customer',
            invoice_number: 'INV-20260616-9233',
            drug_id: '1',
            batch_id: 'b1',
            quantity: 1,
            reason: 'Kemasan penyok / rusak',
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            drug: { name: 'Alprazolam 0.5mg', unit: 'Tablet' },
            batch: { batch_number: 'ALP9922' }
          }
        ];
        localStorage.setItem('demo_returns', JSON.stringify(defaultLogs));
        setReturnLogs(defaultLogs);
      }

      // Local mock options
      const localDrugs = localStorage.getItem('demo_drugs');
      if (localDrugs) setDrugs(JSON.parse(localDrugs));

      const localBatches = localStorage.getItem('demo_batches');
      if (localBatches) setBatches(JSON.parse(localBatches));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter batches when drug is selected
  useEffect(() => {
    if (selectedDrugId) {
      setFilteredBatches(batches.filter(b => b.drug_id === selectedDrugId));
    } else {
      setFilteredBatches([]);
    }
    setSelectedBatchId('');
  }, [selectedDrugId, batches]);

  // Search invoice items
  const handleSearchInvoice = async () => {
    if (!searchInvoice.trim()) return;
    setSearchingInvoiceLoading(true);
    setSelectedInvoiceItem(null);
    setInvoiceItems([]);

    try {
      if (dbError) {
        // Mock lookup in localStorage sales
        const localSales = localStorage.getItem('demo_sales');
        const salesList = localSales ? JSON.parse(localSales) : [];
        const foundSale = salesList.find((s: any) => s.invoice_number === searchInvoice.trim());
        
        if (!foundSale) {
          Swal.fire('Tidak Ditemukan', 'Faktur invoice tidak ditemukan dalam simulasi.', 'warning');
          setSearchingInvoiceLoading(false);
          return;
        }

        // Map items from invoice
        const localProfiles = localStorage.getItem('demo_drugs');
        const mockDrugList = localProfiles ? JSON.parse(localProfiles) : [];

        // Try mapping
        // In POS checkout we save sale objects containing items inside demo_sales
        const items = foundSale.items || [
          { drug_id: '1', batch_id: 'b1', name: 'Alprazolam 0.5mg', batch_number: 'ALP9922', quantity: 2, price: 15000, unit: 'Tablet' }
        ];

        setInvoiceItems(items);
      } else {
        // Query database
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .select('id')
          .eq('invoice_number', searchInvoice.trim())
          .single();

        if (saleError || !sale) {
          Swal.fire('Tidak Ditemukan', 'Nomor invoice tidak ditemukan di database.', 'warning');
          setSearchingInvoiceLoading(false);
          return;
        }

        const { data: items, error: itemsError } = await supabase
          .from('sale_items')
          .select(`
            drug_id,
            batch_id,
            quantity,
            price,
            drugs (name, unit),
            drug_batches (batch_number)
          `)
          .eq('sale_id', sale.id) as any;

        if (itemsError) throw itemsError;

        const mapped: InvoiceItem[] = (items || []).map((i: any) => ({
          drug_id: i.drug_id,
          batch_id: i.batch_id,
          name: i.drugs?.name || 'Obat',
          batch_number: i.drug_batches?.batch_number || 'Batch',
          quantity: i.quantity,
          price: Number(i.price),
          unit: i.drugs?.unit || 'Pcs'
        }));

        setInvoiceItems(mapped);
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal mencari invoice: ${err.message}`, 'error');
    } finally {
      setSearchingInvoiceLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedInvoiceItem(null);
    setInvoiceItems([]);
    setSearchInvoice('');
    setSelectedDrugId('');
    setSelectedBatchId('');
    setQuantity(1);
    setReason('');
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      Swal.fire('Warning', 'Alasan retur harus diisi.', 'warning');
      return;
    }

    let drugId = '';
    let batchId = '';
    let drugName = '';
    let batchNum = '';
    let drugUnit = '';

    if (returnType === 'customer') {
      if (!selectedInvoiceItem) {
        Swal.fire('Warning', 'Silakan cari invoice dan pilih obat yang ingin diretur.', 'warning');
        return;
      }
      if (quantity > selectedInvoiceItem.quantity) {
        Swal.fire('Warning', `Jumlah retur melebihi jumlah pembelian (${selectedInvoiceItem.quantity}).`, 'warning');
        return;
      }
      drugId = selectedInvoiceItem.drug_id;
      batchId = selectedInvoiceItem.batch_id;
      drugName = selectedInvoiceItem.name;
      batchNum = selectedInvoiceItem.batch_number;
      drugUnit = selectedInvoiceItem.unit;
    } else {
      if (!selectedDrugId || !selectedBatchId) {
        Swal.fire('Warning', 'Silakan pilih obat dan nomor batch.', 'warning');
        return;
      }
      const selectedBatch = batches.find(b => b.id === selectedBatchId)!;
      if (quantity > selectedBatch.stock) {
        Swal.fire('Warning', `Jumlah retur melebihi stok yang tersedia (${selectedBatch.stock}).`, 'warning');
        return;
      }
      const selectedDrug = drugs.find(d => d.id === selectedDrugId)!;
      drugId = selectedDrugId;
      batchId = selectedBatchId;
      drugName = selectedDrug.name;
      batchNum = selectedBatch.batch_number;
      drugUnit = selectedDrug.unit;
    }

    setSubmitLoading(true);

    try {
      if (dbError) {
        // Mock local save
        const newLog: ReturnLog = {
          id: Math.random().toString(36).substring(2, 9),
          type: returnType,
          invoice_number: returnType === 'customer' ? searchInvoice : null,
          drug_id: drugId,
          batch_id: batchId,
          quantity,
          reason,
          created_at: new Date().toISOString(),
          drug: { name: drugName, unit: drugUnit },
          batch: { batch_number: batchNum }
        };

        const updatedLogs = [newLog, ...returnLogs];
        localStorage.setItem('demo_returns', JSON.stringify(updatedLogs));
        setReturnLogs(updatedLogs);

        // Update batch stock locally
        const updatedBatches = batches.map(b => {
          if (b.id === batchId) {
            // Customer return adds stock back, supplier return subtracts stock
            const diff = returnType === 'customer' ? quantity : -quantity;
            return { ...b, stock: Math.max(0, b.stock + diff) };
          }
          return b;
        });
        localStorage.setItem('demo_batches', JSON.stringify(updatedBatches));
        setBatches(updatedBatches);

        // Mock Controlled drug logs if restricted drug
        const selectedDrugObj = drugs.find(d => d.id === drugId);
        if (selectedDrugObj && (selectedDrugObj.category === 'Psikotropika' || selectedDrugObj.category === 'Narkotika')) {
          const localCLogs = localStorage.getItem('demo_controlled_logs');
          const clogs = localCLogs ? JSON.parse(localCLogs) : [];
          const session = JSON.parse(localStorage.getItem('demo_session') || '{}');
          const newCLog = {
            id: Math.random().toString(36).substring(2, 9),
            drug_id: drugId,
            batch_id: batchId,
            user_id: session?.user?.id || 'demo',
            type: returnType === 'customer' ? 'in' : 'out',
            quantity,
            notes: returnType === 'customer' ? `Retur penjualan customer (INV: ${searchInvoice})` : `Retur pembelian ke supplier PBF`,
            created_at: new Date().toISOString(),
            drug: { name: drugName, unit: drugUnit },
            batch: { batch_number: batchNum },
            profile: { full_name: session?.name || 'Apoteker' }
          };
          localStorage.setItem('demo_controlled_logs', JSON.stringify([newCLog, ...clogs]));
        }

        Swal.fire('Simulasi Berhasil', 'Data retur obat disimulasikan di penyimpanan lokal.', 'success');
        resetForm();
      } else {
        // Save to DB
        const { error: insertError } = await supabase
          .from('drug_returns')
          .insert([{
            type: returnType,
            invoice_number: returnType === 'customer' ? searchInvoice : null,
            drug_id: drugId,
            batch_id: batchId,
            quantity,
            reason
          }]);

        if (insertError) throw insertError;

        // Update batch stock in database
        const { data: batch, error: getBatchError } = await supabase
          .from('drug_batches')
          .select('stock')
          .eq('id', batchId)
          .single();

        if (getBatchError) throw getBatchError;

        const diff = returnType === 'customer' ? quantity : -quantity;
        const newStock = Math.max(0, (batch?.stock || 0) + diff);

        const { error: updateBatchError } = await supabase
          .from('drug_batches')
          .update({ stock: newStock })
          .eq('id', batchId);

        if (updateBatchError) throw updateBatchError;

        // Auto log to controlled register if category is restricted
        const { data: drugInfo } = await supabase
          .from('drugs')
          .select('category')
          .eq('id', drugId)
          .single();

        if (drugInfo && (drugInfo.category === 'Psikotropika' || drugInfo.category === 'Narkotika')) {
          let user_id = null;
          try {
            const session = JSON.parse(localStorage.getItem('demo_session') || '{}');
            user_id = session?.user?.id || null;
          } catch (_) {}

          await supabase
            .from('controlled_drug_logs')
            .insert([{
              drug_id: drugId,
              batch_id: batchId,
              user_id,
              type: returnType === 'customer' ? 'in' : 'out',
              quantity,
              notes: returnType === 'customer' ? `Retur penjualan customer (INV: ${searchInvoice})` : `Retur pembelian ke supplier PBF`
            }]);
        }

        Swal.fire('Berhasil', 'Retur obat berhasil disimpan dan stok diperbarui.', 'success');
        resetForm();
        fetchData();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal memproses retur: ${err.message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Manajemen Retur Obat</h2>
        </div>
      </header>

      {/* Database warning banner */}
      {dbError && (
        <div className={styles.warningBanner}>
          <div>
            <strong>⚠️ Tabel 'drug_returns' Belum Siap / Akses Ditolak:</strong> Halaman berjalan dalam mode <strong>Simulasi Lokal (localStorage)</strong>.
            Silakan jalankan query SQL berikut di <strong>SQL Editor Supabase</strong> Anda untuk sinkronisasi database:
          </div>
          <code>{`CREATE TABLE IF NOT EXISTS public.drug_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier')),
    invoice_number VARCHAR(100),
    drug_id UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.drug_batches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.drug_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on returns" ON public.drug_returns FOR SELECT USING (true);
CREATE POLICY "Allow all access on returns for authenticated users" ON public.drug_returns FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drug_returns TO anon, authenticated, service_role;`}</code>
          <div>
            Setelah selesai menjalankan query di atas pada database Supabase, silakan <strong>muat ulang halaman ini</strong>.
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Left Column: Form Retur */}
        <div className={`${styles.card} glass-panel`}>
          <h3>➕ Catat Retur Baru</h3>
          
          <div className={styles.typeSelector}>
            <button 
              type="button" 
              className={`${styles.typeBtn} ${returnType === 'customer' ? styles.typeBtnActive : ''}`}
              onClick={() => { setReturnType('customer'); resetForm(); }}
            >
              🛒 Retur Penjualan (Customer)
            </button>
            <button 
              type="button" 
              className={`${styles.typeBtn} ${returnType === 'supplier' ? styles.typeBtnActive : ''}`}
              onClick={() => { setReturnType('supplier'); resetForm(); }}
            >
              🏢 Retur Pembelian (PBF)
            </button>
          </div>

          <form onSubmit={handleSubmitReturn} className={styles.form}>
            {returnType === 'customer' ? (
              /* customer return form inputs */
              <>
                <div className={styles.formGroup}>
                  <label>Masukkan Nomor Invoice Penjualan</label>
                  <div className={styles.searchRow}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Contoh: INV-20260616-XXXX" 
                      value={searchInvoice}
                      onChange={(e) => setSearchInvoice(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={handleSearchInvoice} 
                      className="btn btn-secondary" 
                      disabled={searchingInvoiceLoading}
                    >
                      {searchingInvoiceLoading ? 'Mencari...' : 'Cari'}
                    </button>
                  </div>
                </div>

                {invoiceItems.length > 0 && (
                  <div className={styles.formGroup}>
                    <label>Pilih Obat yang Diretur</label>
                    <div className={styles.invoiceItemsList}>
                      {invoiceItems.map((item) => (
                        <div 
                          key={item.batch_id} 
                          className={`${styles.invoiceItemOption} ${selectedInvoiceItem?.batch_id === item.batch_id ? styles.invoiceItemOptionActive : ''}`}
                          onClick={() => { setSelectedInvoiceItem(item); setQuantity(1); }}
                        >
                          <div className={styles.optionText}>
                            <span className={styles.optionTitle}>{item.name}</span>
                            <span className={styles.optionMeta}>Batch: {item.batch_number} | Beli: {item.quantity} {item.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* supplier return form inputs */
              <>
                <div className={styles.formGroup}>
                  <label>Pilih Obat</label>
                  <select 
                    className="input-field" 
                    value={selectedDrugId} 
                    onChange={(e) => setSelectedDrugId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Obat --</option>
                    {drugs.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
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
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label>Jumlah Item Diretur</label>
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
              <label>Alasan Retur / Kerusakan</label>
              <textarea 
                className="input-field" 
                placeholder="Contoh: Obat kadaluarsa sebelum waktu / segel terbuka" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ minHeight: '80px', resize: 'vertical' }}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '10px' }} 
              disabled={submitLoading}
            >
              {submitLoading ? 'Menyimpan...' : 'Simpan Retur'}
            </button>
          </form>
        </div>

        {/* Right Column: Return History list */}
        <div className={`${styles.card} glass-panel`}>
          <h3>📜 Histori Log Retur</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Waktu Catat</th>
                    <th>Tipe Retur</th>
                    <th>Referensi Inv</th>
                    <th>Nama Obat</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Alasan / Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {returnLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        Belum ada riwayat retur obat tercatat.
                      </td>
                    </tr>
                  ) : (
                    returnLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td>
                          <span className={`${styles.badge} ${log.type === 'customer' ? styles.badgeCustomer : styles.badgeSupplier}`}>
                            {log.type === 'customer' ? '🛒 Customer' : '🏢 Supplier'}
                          </span>
                        </td>
                        <td>{log.invoice_number ? <code>{log.invoice_number}</code> : '-'}</td>
                        <td><strong>{log.drug?.name}</strong></td>
                        <td><code>{log.batch?.batch_number}</code></td>
                        <td>{log.quantity} {log.drug?.unit}</td>
                        <td style={{ fontSize: '13px' }}>{log.reason}</td>
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
