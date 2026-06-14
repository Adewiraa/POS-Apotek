'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './pos.module.css';

interface DrugBatchJoin {
  id: string;
  drug_id: string;
  batch_number: string;
  expiry_date: string;
  selling_price: number;
  stock: number;
  name: string;
  category: string;
  unit: string;
}

interface CartItem {
  drug_id: string;
  batch_id: string;
  name: string;
  batch_number: string;
  quantity: number;
  price: number;
  unit: string;
  category: string;
}

interface PaymentEntry {
  payment_method: 'cash' | 'qris' | 'card' | 'insurance';
  amount: number;
  reference_number: string;
}

export default function POSPage() {
  const router = useRouter();
  
  // States
  const [batches, setBatches] = useState<DrugBatchJoin[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Prescription validation states
  const [usePrescription, setUsePrescription] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [doctorSip, setDoctorSip] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

  // Billing states
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  // Multi-Payment states
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentMethod, setCurrentMethod] = useState<'cash' | 'qris' | 'card' | 'insurance'>('cash');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currentRef, setCurrentRef] = useState('');

  // 1. Generate Invoice Number & Fetch Active Batches
  const generateInvoice = () => {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${dateStr}-${randomStr}`);
  };

  const fetchActiveBatches = async () => {
    setLoading(true);
    try {
      // Fetch drugs joined with batches having stock > 0
      const { data, error } = await supabase
        .from('drug_batches')
        .select(`
          id,
          drug_id,
          batch_number,
          expiry_date,
          selling_price,
          stock,
          drugs (
            name,
            category,
            unit
          )
        `)
        .gt('stock', 0)
        .order('expiry_date', { ascending: true }) as any;

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: DrugBatchJoin[] = data.map((item: any) => ({
          id: item.id,
          drug_id: item.drug_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          selling_price: Number(item.selling_price),
          stock: item.stock,
          name: item.drugs?.name || 'Obat Tanpa Nama',
          category: item.drugs?.category || 'Umum',
          unit: item.drugs?.unit || 'Pcs'
        }));
        setBatches(mapped);
      } else {
        setBatches([]);
      }
    } catch (err) {
      console.error('Error fetching active stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInvoice();
    fetchActiveBatches();
  }, []);

  // 2. Add to Cart
  const handleAddToCart = (batch: DrugBatchJoin) => {
    const existingIndex = cart.findIndex(item => item.batch_id === batch.id);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity >= batch.stock) {
        alert('Stok batch aktif sudah mencapai batas maksimal.');
        return;
      }
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        drug_id: batch.drug_id,
        batch_id: batch.id,
        name: batch.name,
        batch_number: batch.batch_number,
        quantity: 1,
        price: batch.selling_price,
        unit: batch.unit,
        category: batch.category
      }]);
    }
  };

  // Adjust cart quantities
  const updateQty = (index: number, delta: number) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const match = batches.find(b => b.id === item.batch_id);

    if (match) {
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        updatedCart.splice(index, 1);
      } else if (newQty > match.stock) {
        alert('Jumlah pembelian melebihi stok yang tersedia.');
        return;
      } else {
        item.quantity = newQty;
      }
      setCart(updatedCart);
    }
  };

  // 3. Billing Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = Math.max(0, subtotal - discount + tax);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = totalAmount - totalPaid;

  // 4. Manage Payments List
  const handleAddPayment = () => {
    const amount = Number(currentAmount);
    if (!amount || amount <= 0) {
      alert('Masukkan jumlah uang pembayaran yang valid.');
      return;
    }

    if (amount > balanceDue && currentMethod !== 'cash') {
      alert('Pembayaran non-tunai tidak boleh melebihi jumlah tagihan.');
      return;
    }

    const newPayment: PaymentEntry = {
      payment_method: currentMethod,
      amount: amount,
      reference_number: currentRef
    };

    setPayments([...payments, newPayment]);
    setCurrentAmount('');
    setCurrentRef('');
  };

  const handleRemovePayment = (index: number) => {
    const updated = [...payments];
    updated.splice(index, 1);
    setPayments(updated);
  };

  // 5. Checkout Transaction API Call
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja kosong.');
      return;
    }

    if (balanceDue > 0) {
      alert('Pembayaran belum mencukupi total tagihan.');
      return;
    }

    // Cek jika ada obat resep/psikotropika namun tidak menggunakan resep
    const hasRestrictedDrug = cart.some(item => 
      item.category === 'Obat Keras' || item.category === 'Psikotropika' || item.category === 'Narkotika'
    );

    if (hasRestrictedDrug && !usePrescription) {
      alert('Transaksi mengandung Obat Keras/Psikotropika. Harus melampirkan & memvalidasi Resep Dokter.');
      return;
    }

    setCheckoutLoading(true);
    try {
      let prescription_id = null;

      // Jika menggunakan resep dokter, daftarkan resep terlebih dahulu
      if (usePrescription) {
        let image_url = null;

        // Simulasi upload file resep jika dilampirkan
        if (prescriptionFile) {
          const fileExt = prescriptionFile.name.split('.').pop();
          const fileName = `${invoiceNumber}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('prescriptions')
            .upload(fileName, prescriptionFile);
          
          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('prescriptions')
              .getPublicUrl(fileName);
            image_url = publicUrlData?.publicUrl;
          }
        }

        // Dapatkan verified_by cashier id
        let verified_by = '00000000-0000-0000-0000-000000000000';
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          verified_by = user.id;
        } else {
          const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
          if (profile) verified_by = profile.id;
        }

        // Tulis resep ke database
        const { data: rx, error: rxError } = await supabase
          .from('prescriptions')
          .insert([{
            doctor_name: doctorName,
            doctor_sip: doctorSip || null,
            patient_name: patientName,
            patient_phone: patientPhone || null,
            recipe_date: new Date().toISOString().split('T')[0],
            image_url: image_url || 'https://mock-storage.com/prescription-demo.jpg',
            verified_by
          }])
          .select()
          .single();

        if (rxError) throw rxError;
        prescription_id = rx?.id;
      }

      // Kirim payload checkout ke API Route
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          prescription_id,
          discount,
          tax,
          items: cart,
          payments: payments
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Gagal memproses transaksi.');
      }

      alert('Transaksi berhasil diselesaikan!');
      
      // Auto open print receipt dialog
      window.print();

      // Reset Kasir
      setCart([]);
      setPayments([]);
      setUsePrescription(false);
      setDoctorName('');
      setDoctorSip('');
      setPatientName('');
      setPatientPhone('');
      setPrescriptionFile(null);
      setDiscount(0);
      setTax(0);
      generateInvoice();
      fetchActiveBatches();

    } catch (err: any) {
      alert(`Error Transaksi: ${err.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.batch_number.toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className={styles.posContainer}>
      {/* 1. Panel Kiri: Obat & Keranjang */}
      <div className={styles.leftPanel}>
        <div className={`${styles.panelHeader} glass-panel`}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Kembali
          </button>
          <h2>Workspace Kasir</h2>
          <span className={styles.invoiceNo}>{invoiceNumber}</span>
        </div>

        {/* Pencarian Stok Batch Aktif */}
        <div className={`${styles.searchBox} glass-panel`}>
          <input
            type="text"
            className="input-field"
            placeholder="Ketik nama obat atau nomor batch untuk mencari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <div className={styles.searchResults}>
              {filteredBatches.map(batch => (
                <div key={batch.id} onClick={() => { handleAddToCart(batch); setSearch(''); }} className={styles.resultItem}>
                  <div>
                    <strong>{batch.name}</strong>
                    <span className={styles.batchLabel}>Batch: {batch.batch_number}</span>
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.price}>{formatRupiah(batch.selling_price)}</span>
                    <span className={styles.stock}>Stok: {batch.stock}</span>
                  </div>
                </div>
              ))}
              {filteredBatches.length === 0 && (
                <div className={styles.noResult}>Obat/Batch tidak ditemukan atau kehabisan stok.</div>
              )}
            </div>
          )}
        </div>

        {/* Keranjang Belanja Struk */}
        <div className={`${styles.cartWrapper} glass-panel`}>
          <h3>Keranjang Belanja</h3>
          <div className={styles.cartList}>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>Keranjang kosong. Cari obat di atas untuk ditambahkan.</div>
            ) : (
              cart.map((item, idx) => (
                <div key={item.batch_id} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <h4>{item.name}</h4>
                    <span>Batch: {item.batch_number} | Satuan: {item.unit}</span>
                    <span className={`${styles.itemCategory} ${item.category === 'Obat Keras' || item.category === 'Psikotropika' ? styles.keras : ''}`}>
                      ({item.category})
                    </span>
                  </div>
                  <div className={styles.cartItemQty}>
                    <button onClick={() => updateQty(idx, -1)} className={styles.qtyBtn}>-</button>
                    <span className={styles.qtyVal}>{item.quantity}</span>
                    <button onClick={() => updateQty(idx, 1)} className={styles.qtyBtn}>+</button>
                  </div>
                  <div className={styles.cartItemPrice}>
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Panel Kanan: Tagihan, Resep, & Split Payment */}
      <div className={styles.rightPanel}>
        {/* Validasi Resep Dokter */}
        <div className={`${styles.rxCard} glass-panel`}>
          <div className={styles.rxToggleRow} style={{ justifyContent: 'space-between', width: '100%' }}>
            <span className={styles.checkboxTitle}>📋 Validasi Resep Dokter</span>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={usePrescription}
                onChange={(e) => setUsePrescription(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {usePrescription && (
            <div className={styles.rxForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nama Dokter</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: dr. Jaka"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>SIP Dokter</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: SIP/123/VIII/2026"
                    value={doctorSip}
                    onChange={(e) => setDoctorSip(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nama Pasien</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: Budi Prasetyo"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>No. HP Pasien</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: 08123456789"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Foto/Scan Dokumen Resep</label>
                <div className={styles.fileUploadArea}>
                  <input
                    id="rx-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setPrescriptionFile(e.target.files ? e.target.files[0] : null)}
                    className={styles.fileInputHidden}
                  />
                  <div className={styles.uploadLabel}>
                    <span>{prescriptionFile ? `📄 ${prescriptionFile.name}` : '📁 Klik untuk Unggah / Tarik File Resep'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ringkasan Biaya */}
        <div className={`${styles.billCard} glass-panel`}>
          <h3>Rincian Tagihan</h3>
          <div className={styles.billRow}>
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          <div className={styles.billFormRow}>
            <div className={styles.billInputGroup}>
              <label>Diskon (Rp)</label>
              <input
                type="number"
                className="input-field"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className={styles.billInputGroup}>
              <label>Pajak/Jasa (Rp)</label>
              <input
                type="number"
                className="input-field"
                value={tax}
                onChange={(e) => setTax(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className={`${styles.billRow} ${styles.totalRow}`}>
            <span>Total Tagihan</span>
            <span>{formatRupiah(totalAmount)}</span>
          </div>
        </div>

        {/* Kalkulator Multi-Payment (Split Payment) */}
        <div className={`${styles.paymentCard} glass-panel`}>
          <h3>Pembayaran Multi-Payment</h3>
          
          <div className={styles.paymentInputGrid}>
            <select
              className="input-field"
              value={currentMethod}
              onChange={(e) => setCurrentMethod(e.target.value as any)}
            >
              <option value="cash">💵 Tunai</option>
              <option value="qris">📱 QRIS</option>
              <option value="card">💳 Debit/Kredit</option>
              <option value="insurance">🛡️ Asuransi / BPJS</option>
            </select>

            <input
              type="number"
              className="input-field"
              placeholder="Jumlah Uang"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />

            <input
              type="text"
              className="input-field"
              placeholder="No. Referensi (Opsional)"
              value={currentRef}
              onChange={(e) => setCurrentRef(e.target.value)}
            />

            <button onClick={handleAddPayment} className="btn btn-secondary" style={{ gridColumn: 'span 3' }}>
              ➕ Tambah Metode Pembayaran
            </button>
          </div>

          {/* List Pembayaran yang Dimasukkan */}
          {payments.length > 0 && (
            <div className={styles.paymentList}>
              {payments.map((p, idx) => (
                <div key={idx} className={styles.paymentRow}>
                  <span className={styles.payMethod}>
                    {p.payment_method.toUpperCase()} 
                    {p.reference_number && <span className={styles.payRef}> ({p.reference_number})</span>}
                  </span>
                  <span className={styles.payAmount}>{formatRupiah(p.amount)}</span>
                  <button onClick={() => handleRemovePayment(idx)} className={styles.removePayBtn}>❌</button>
                </div>
              ))}
            </div>
          )}

          {/* Status Selisih Pembayaran */}
          <div className={styles.paymentStatusRow}>
            {balanceDue > 0 ? (
              <div className={styles.statusKurang}>
                Kurang: <strong>{formatRupiah(balanceDue)}</strong>
              </div>
            ) : (
              <div className={styles.statusKembalian}>
                Kembalian: <strong>{formatRupiah(Math.abs(balanceDue))}</strong>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold' }}
            disabled={checkoutLoading || balanceDue > 0 || cart.length === 0}
          >
            {checkoutLoading ? 'Memproses Transaksi...' : 'SELESAIKAN TRANSAKSI (PRINT STRUK) 🖨️'}
          </button>
        </div>
      </div>
    </div>
  );
}
