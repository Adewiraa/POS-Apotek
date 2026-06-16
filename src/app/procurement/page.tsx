'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './procurement.module.css';
import Swal from 'sweetalert2';

interface POItem {
  id?: string;
  drug_id: string;
  quantity: number;
  received_quantity?: number;
  drug_name?: string;
  unit?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  status: 'draft' | 'sent' | 'received';
  created_at: string;
  received_at: string | null;
  items?: POItem[];
}

interface Drug {
  id: string;
  name: string;
  unit: string;
  category: string;
}

export default function ProcurementPage() {
  const router = useRouter();
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states (PO creation)
  const [supplierName, setSupplierName] = useState('');
  const [addedItems, setAddedItems] = useState<POItem[]>([]);
  const [currentDrugId, setCurrentDrugId] = useState('');
  const [currentQty, setCurrentQty] = useState<number>(10);

  // Receiving PO Modal states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  // States for the batch entry of the active item in receiving modal
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [batchNum, setBatchNum] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  
  // Accumulator for received items to save all at once
  const [receivingBatches, setReceivingBatches] = useState<Array<{
    drug_id: string;
    drug_name: string;
    quantity: number;
    batch_number: string;
    expiry_date: string;
    selling_price: number;
  }>>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch drugs
      const { data: drugData, error: drugError } = await supabase
        .from('drugs')
        .select('id, name, unit, category');

      if (drugError) throw drugError;
      setDrugs(drugData || []);

      // 2. Fetch purchase orders
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (poError) throw poError;

      // 3. For each PO, fetch items
      const poList: PurchaseOrder[] = [];
      const pos = poData || [];
      for (const po of pos) {
        const { data: itemData } = await supabase
          .from('purchase_order_items')
          .select(`
            id,
            drug_id,
            quantity,
            received_quantity,
            drugs (name, unit)
          `)
          .eq('po_id', po.id) as any;

        poList.push({
          id: po.id,
          po_number: po.po_number,
          supplier_name: po.supplier_name,
          status: po.status,
          created_at: po.created_at,
          received_at: po.received_at,
          items: (itemData || []).map((i: any) => ({
            id: i.id,
            drug_id: i.drug_id,
            quantity: i.quantity,
            received_quantity: i.received_quantity,
            drug_name: i.drugs?.name || 'Obat',
            unit: i.drugs?.unit || 'Pcs'
          }))
        });
      }

      setPurchaseOrders(poList);
      setDbError(false);
    } catch (err: any) {
      console.warn('Gagal memuat PO dari database, beralih ke simulasi:', err.message);
      setDbError(true);

      // Load simulated data from localStorage
      const localPO = localStorage.getItem('demo_purchase_orders');
      if (localPO) {
        setPurchaseOrders(JSON.parse(localPO));
      } else {
        const defaultPO: PurchaseOrder[] = [
          {
            id: 'po-1',
            po_number: 'PO-20260616-0001',
            supplier_name: 'PBF Kimia Farma',
            status: 'sent',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            received_at: null,
            items: [
              { drug_id: '1', quantity: 100, received_quantity: 0, drug_name: 'Alprazolam 0.5mg', unit: 'Tablet' }
            ]
          }
        ];
        localStorage.setItem('demo_purchase_orders', JSON.stringify(defaultPO));
        setPurchaseOrders(defaultPO);
      }

      const localDrugs = localStorage.getItem('demo_drugs');
      if (localDrugs) setDrugs(JSON.parse(localDrugs));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (!currentDrugId) return;
    const drug = drugs.find(d => d.id === currentDrugId)!;
    
    // Check if already added
    if (addedItems.some(i => i.drug_id === currentDrugId)) {
      Swal.fire('Info', 'Obat sudah masuk dalam daftar PO.', 'info');
      return;
    }

    setAddedItems([
      ...addedItems,
      {
        drug_id: currentDrugId,
        quantity: currentQty,
        drug_name: drug.name,
        unit: drug.unit
      }
    ]);
    setCurrentDrugId('');
    setCurrentQty(10);
  };

  const handleRemoveItem = (index: number) => {
    setAddedItems(addedItems.filter((_, i) => i !== index));
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      Swal.fire('Warning', 'Silakan masukkan nama PBF/Supplier.', 'warning');
      return;
    }
    if (addedItems.length === 0) {
      Swal.fire('Warning', 'Daftar pemesanan obat masih kosong.', 'warning');
      return;
    }

    setSubmitLoading(true);

    const po_number = `PO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      if (dbError) {
        // Mock save
        const newPO: PurchaseOrder = {
          id: Math.random().toString(36).substring(2, 9),
          po_number,
          supplier_name: supplierName,
          status: 'sent',
          created_at: new Date().toISOString(),
          received_at: null,
          items: addedItems.map(i => ({ ...i, received_quantity: 0 }))
        };

        const updated = [newPO, ...purchaseOrders];
        localStorage.setItem('demo_purchase_orders', JSON.stringify(updated));
        setPurchaseOrders(updated);
        
        Swal.fire('Simulasi PO Terkirim', `Dokumen PO ${po_number} berhasil dicatat.`, 'success');
        setSupplierName('');
        setAddedItems([]);
      } else {
        // DB save
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .insert([{
            po_number,
            supplier_name: supplierName,
            status: 'sent'
          }])
          .select()
          .single();

        if (poError || !po) throw poError;

        for (const item of addedItems) {
          const { error: itemError } = await supabase
            .from('purchase_order_items')
            .insert([{
              po_id: po.id,
              drug_id: item.drug_id,
              quantity: item.quantity
            }]);

          if (itemError) throw itemError;
        }

        Swal.fire('Berhasil', `Dokumen PO ${po_number} berhasil dikirim ke PBF.`, 'success');
        setSupplierName('');
        setAddedItems([]);
        fetchData();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal membuat PO: ${err.message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Click handler to open PO receiving modal
  const openReceiveModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setReceivingBatches([]);
    setActiveItemIndex(0);
    
    // Seed initial values for first item
    const firstItem = po.items?.[0];
    if (firstItem) {
      setBatchNum('');
      setExpiryDate('');
      // Find current selling price of the drug as default suggestion if available
      setSellingPrice(10000);
      setReceivedQty(firstItem.quantity);
    }
    setShowReceiveModal(true);
  };

  // Handle validating one item in PO receipt flow
  const handleValidateItemReceipt = () => {
    if (!batchNum.trim()) {
      Swal.fire('Warning', 'Silakan isi nomor batch.', 'warning');
      return;
    }
    if (!expiryDate) {
      Swal.fire('Warning', 'Silakan isi tanggal kadaluarsa obat.', 'warning');
      return;
    }
    if (sellingPrice <= 0) {
      Swal.fire('Warning', 'Silakan isi harga jual obat.', 'warning');
      return;
    }
    if (receivedQty <= 0) {
      Swal.fire('Warning', 'Silakan isi jumlah barang yang diterima.', 'warning');
      return;
    }

    const currentItem = selectedPO!.items![activeItemIndex];

    const currentBatchRecord = {
      drug_id: currentItem.drug_id,
      drug_name: currentItem.drug_name || 'Obat',
      quantity: receivedQty,
      batch_number: batchNum.trim(),
      expiry_date: expiryDate,
      selling_price: sellingPrice
    };

    const nextBatches = [...receivingBatches, currentBatchRecord];
    setReceivingBatches(nextBatches);

    // Go to next item or submit final
    if (activeItemIndex + 1 < selectedPO!.items!.length) {
      const nextIndex = activeItemIndex + 1;
      setActiveItemIndex(nextIndex);
      const nextItem = selectedPO!.items![nextIndex];
      setBatchNum('');
      setExpiryDate('');
      setSellingPrice(10000);
      setReceivedQty(nextItem.quantity);
    } else {
      // Finalized all items, send to save!
      submitPOReceipt(nextBatches);
    }
  };

  // Submit received PO items to add to inventory & logs
  const submitPOReceipt = async (batchesToCreate: typeof receivingBatches) => {
    setSubmitLoading(true);
    try {
      if (dbError) {
        // Local simulation
        // 1. Update PO status & received quantites
        const localPO = localStorage.getItem('demo_purchase_orders');
        const pos: PurchaseOrder[] = localPO ? JSON.parse(localPO) : [];
        const updatedPOs = pos.map(p => {
          if (p.id === selectedPO!.id) {
            return {
              ...p,
              status: 'received' as const,
              received_at: new Date().toISOString(),
              items: p.items?.map(item => {
                const matched = batchesToCreate.find(b => b.drug_id === item.drug_id);
                return { ...item, received_quantity: matched ? matched.quantity : item.quantity };
              })
            };
          }
          return p;
        });
        localStorage.setItem('demo_purchase_orders', JSON.stringify(updatedPOs));
        setPurchaseOrders(updatedPOs);

        // 2. Add batches to inventory
        const localBatches = localStorage.getItem('demo_batches');
        const inventoryBatches = localBatches ? JSON.parse(localBatches) : [];
        
        const newInventoryBatches = [...inventoryBatches];
        for (const b of batchesToCreate) {
          newInventoryBatches.push({
            id: 'batch-' + Math.random().toString(36).substring(2, 9),
            drug_id: b.drug_id,
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            selling_price: b.selling_price,
            stock: b.quantity
          });

          // Check if controlled drug
          const selectedDrugObj = drugs.find(d => d.id === b.drug_id);
          if (selectedDrugObj && (selectedDrugObj.category === 'Psikotropika' || selectedDrugObj.category === 'Narkotika')) {
            const localCLogs = localStorage.getItem('demo_controlled_logs');
            const clogs = localCLogs ? JSON.parse(localCLogs) : [];
            const session = JSON.parse(localStorage.getItem('demo_session') || '{}');
            const newCLog = {
              id: 'clog-' + Math.random().toString(36).substring(2, 9),
              drug_id: b.drug_id,
              batch_id: b.batch_number, // simulated reference
              user_id: session?.user?.id || 'demo',
              type: 'in',
              quantity: b.quantity,
              notes: `Penerimaan PO ${selectedPO!.po_number} dari ${selectedPO!.supplier_name}`,
              created_at: new Date().toISOString(),
              drug: { name: b.drug_name, unit: 'Pcs' },
              batch: { batch_number: b.batch_number },
              profile: { full_name: session?.name || 'Apoteker' }
            };
            localStorage.setItem('demo_controlled_logs', JSON.stringify([newCLog, ...clogs]));
          }
        }
        localStorage.setItem('demo_batches', JSON.stringify(newInventoryBatches));

        Swal.fire('Simulasi Penerimaan Berhasil', 'Barang diterima, batch baru ditambahkan ke gudang.', 'success');
      } else {
        // DB Execution
        // 1. Update PO status
        const { error: poUpdateError } = await supabase
          .from('purchase_orders')
          .update({
            status: 'received',
            received_at: new Date().toISOString()
          })
          .eq('id', selectedPO!.id);

        if (poUpdateError) throw poUpdateError;

        // 2. Process each item
        for (const b of batchesToCreate) {
          // Update PO item received quantity
          const poItem = selectedPO!.items?.find(item => item.drug_id === b.drug_id);
          if (poItem && poItem.id) {
            await supabase
              .from('purchase_order_items')
              .update({ received_quantity: b.quantity })
              .eq('id', poItem.id);
          }

          // Insert new batch in drug_batches
          const { data: newBatch, error: batchInsertError } = await supabase
            .from('drug_batches')
            .insert([{
              drug_id: b.drug_id,
              batch_number: b.batch_number,
              expiry_date: b.expiry_date,
              selling_price: b.selling_price,
              stock: b.quantity
            }])
            .select()
            .single();

          if (batchInsertError) throw batchInsertError;

          // Check if drug category is controlled
          const { data: drugInfo } = await supabase
            .from('drugs')
            .select('category')
            .eq('id', b.drug_id)
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
                drug_id: b.drug_id,
                batch_id: newBatch.id,
                user_id,
                type: 'in',
                quantity: b.quantity,
                notes: `Penerimaan PO ${selectedPO!.po_number} dari ${selectedPO!.supplier_name}`
              }]);
          }
        }

        Swal.fire('Berhasil', 'Penerimaan PO berhasil diselesaikan. Stok obat baru telah terdaftar.', 'success');
        fetchData();
      }
      setShowReceiveModal(false);
    } catch (err: any) {
      Swal.fire('Error', `Gagal menyelesaikan penerimaan PO: ${err.message}`, 'error');
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
          <h2>Pengadaan Obat ke PBF (Purchase Order)</h2>
        </div>
      </header>

      {dbError && (
        <div className={styles.warningBanner}>
          <div>
            <strong>⚠️ Tabel PO Belum Dikonfigurasi di Database:</strong> Fitur berjalan dalam mode <strong>Simulasi Lokal (localStorage)</strong>.
            Guna menyinkronkan dengan database Supabase Anda, silakan jalankan SQL berikut di <strong>SQL Editor Supabase</strong> Anda:
          </div>
          <code>{`CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sent', 'received')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0)
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on PO" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow write on PO" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on PO items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Allow write on PO items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO anon, authenticated, service_role;`}</code>
          <div>
            Setelah selesai menjalankan query di atas pada database Supabase, silakan <strong>muat ulang halaman ini</strong>.
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Left Column: Create PO Form */}
        <div className={`${styles.card} glass-panel`}>
          <h3>🛒 Buat PO Pengadaan</h3>
          <form onSubmit={handleCreatePO} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Nama Distributor / PBF Supplier</label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: PBF Kimia Farma / Bina San Prima"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Pilih Obat &amp; Input Jumlah</label>
              <div className={styles.itemBuilderRow}>
                <select
                  className="input-field"
                  value={currentDrugId}
                  onChange={(e) => setCurrentDrugId(e.target.value)}
                >
                  <option value="">-- Pilih Obat --</option>
                  {drugs.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  placeholder="Qty"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn btn-secondary"
                  style={{ padding: '10px' }}
                >
                  ➕
                </button>
              </div>
            </div>

            {addedItems.length > 0 && (
              <div className={styles.formGroup}>
                <label>Daftar Obat dipesan:</label>
                <div className={styles.addedItemsList}>
                  {addedItems.map((item, idx) => (
                    <div key={idx} className={styles.addedItemRow}>
                      <div>
                        <span className={styles.addedItemName}>{item.drug_name}</span>
                        <span className={styles.addedItemQty}> ({item.quantity} {item.unit})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className={styles.removeBtn}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '10px' }}
              disabled={submitLoading || addedItems.length === 0}
            >
              {submitLoading ? 'Mengirim PO...' : 'Kirim PO ke PBF 🚀'}
            </button>
          </form>
        </div>

        {/* Right Column: PO List */}
        <div className={`${styles.card} glass-panel`}>
          <h3>📜 Riwayat Purchase Order ke PBF</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Waktu PO</th>
                    <th>Nomor PO</th>
                    <th>PBF / Supplier</th>
                    <th>Item Obat &amp; Jumlah</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        Belum ada dokumen PO yang diterbitkan.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id}>
                        <td>{new Date(po.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td><code>{po.po_number}</code></td>
                        <td><strong>{po.supplier_name}</strong></td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            {po.items?.map((item, index) => (
                              <div key={index}>
                                • {item.drug_name}: {item.quantity} {item.unit}
                                {po.status === 'received' && ` (Diterima: ${item.received_quantity})`}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${po.status === 'received' ? styles.badgeReceived : styles.badgeSent}`}>
                            {po.status === 'received' ? '📥 Diterima' : '📤 Dikirim'}
                          </span>
                        </td>
                        <td>
                          {po.status === 'sent' && (
                            <button
                              onClick={() => openReceiveModal(po)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              📥 Terima Barang
                            </button>
                          )}
                          {po.status === 'received' && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Selesai {po.received_at ? new Date(po.received_at).toLocaleDateString('id-ID') : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Terima Barang PO */}
      {showReceiveModal && selectedPO && selectedPO.items && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>
              📥 Validasi Batch &amp; Penerimaan Barang
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '4px' }}>
                Nomor PO: {selectedPO.po_number} | Supplier: {selectedPO.supplier_name}
              </div>
            </div>

            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              Validasi Item ({activeItemIndex + 1} dari {selectedPO.items.length}):<br/>
              <strong>{selectedPO.items[activeItemIndex].drug_name}</strong> (Pesan: {selectedPO.items[activeItemIndex].quantity} {selectedPO.items[activeItemIndex].unit})
            </div>

            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nomor Batch Baru</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: BATCH-ABC12"
                  value={batchNum}
                  onChange={(e) => setBatchNum(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tanggal Kadaluarsa (Expiry Date)</label>
                <input
                  type="date"
                  className="input-field"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Harga Jual (Rp / Satuan)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Harga jual ke pelanggan..."
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Jumlah Diterima ({selectedPO.items[activeItemIndex].unit})</label>
                <input
                  type="number"
                  className="input-field"
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="btn btn-secondary"
                disabled={submitLoading}
              >
                Batal
              </button>
              <button
                onClick={handleValidateItemReceipt}
                className="btn btn-primary"
                disabled={submitLoading}
              >
                {activeItemIndex + 1 < selectedPO.items.length ? 'Item Berikutnya ➡️' : 'Selesaikan & Verifikasi 📥'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
