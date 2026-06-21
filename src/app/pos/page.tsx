'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './pos.module.css';
import Swal from 'sweetalert2';

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

interface DiscountRule {
  id: string;
  name: string;
  min_purchase: number;
  discount_percent: number;
  is_active: boolean;
}

export default function POSPage() {
  const router = useRouter();
  
  // States
  const [batches, setBatches] = useState<DrugBatchJoin[]>([]);
  const [activeDiscounts, setActiveDiscounts] = useState<DiscountRule[]>([]);
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

  // Helper memformat input rupiah (pemisah ribuan titik)
  const formatInputRupiah = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(Number(clean));
  };

  const formatRupiahFull = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // --- Print Receipt: buka popup window dengan HTML struk thermal lengkap ---
  const printReceipt = (
    invNum: string,
    cartItems: CartItem[],
    disc: number,
    txAmount: number,
    txTax: number,
    paidPayments: PaymentEntry[],
    drName: string,
    ptName: string,
    cashierName: string
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const subtotalAmt = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const itemRows = cartItems.map(item => `
      <tr>
        <td colspan="2" style="padding:4px 0 2px">
          <strong>${item.name}</strong><br/>
          <span style="font-size:10px;color:#555">Batch: ${item.batch_number} | ${item.unit}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 6px">${item.quantity} x ${formatRupiahFull(item.price)}</td>
        <td style="text-align:right;padding:0 0 6px">${formatRupiahFull(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const paymentMethodLabel = (m: string) => {
      if (m === 'cash') return 'Tunai';
      if (m === 'qris') return 'QRIS';
      if (m === 'card') return 'Kartu';
      if (m === 'insurance') return 'Asuransi';
      return m;
    };

    const payRows = paidPayments.map(p => `
      <tr>
        <td>${paymentMethodLabel(p.payment_method)}${p.reference_number ? ` <small>(${p.reference_number})</small>` : ''}</td>
        <td style="text-align:right">${formatRupiahFull(p.amount)}</td>
      </tr>
    `).join('');

    const cashPaid = paidPayments.filter(p => p.payment_method === 'cash').reduce((s, p) => s + p.amount, 0);
    const changeAmt = Math.max(0, cashPaid - txAmount);

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Struk - ${invNum}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 12px; color: #000; background: #fff; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; font-size: 12px; }
    .header-logo { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
    .footer { margin-top: 12px; font-size: 11px; }
    .total-row td { font-weight: bold; font-size: 13px; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="header-logo">💊 Apotek ApoGo</div>
    <div style="font-size:10px">Jl. Contoh No. 1, Jakarta</div>
    <div style="font-size:10px">Telp: (021) 000-0000</div>
  </div>
  <div class="divider-solid"></div>
  <table>
    <tr><td>Invoice</td><td style="text-align:right">${invNum}</td></tr>
    <tr><td>Tanggal</td><td style="text-align:right">${dateStr}, ${timeStr}</td></tr>
    <tr><td>Kasir</td><td style="text-align:right">${cashierName}</td></tr>
    ${drName ? `<tr><td>Dokter</td><td style="text-align:right">${drName}</td></tr>` : ''}
    ${ptName ? `<tr><td>Pasien</td><td style="text-align:right">${ptName}</td></tr>` : ''}
  </table>
  <div class="divider"></div>
  <table>${itemRows}</table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${formatRupiahFull(subtotalAmt)}</td></tr>
    ${disc > 0 ? `<tr><td>Diskon</td><td style="text-align:right">- ${formatRupiahFull(disc)}</td></tr>` : ''}
    <tr><td>PPN 11%</td><td style="text-align:right">${formatRupiahFull(txTax)}</td></tr>
  </table>
  <div class="divider-solid"></div>
  <table><tr class="total-row"><td>TOTAL</td><td style="text-align:right">${formatRupiahFull(txAmount)}</td></tr></table>
  <div class="divider"></div>
  <div style="font-size:11px;margin-bottom:4px"><strong>Metode Pembayaran:</strong></div>
  <table>${payRows}</table>
  ${changeAmt > 0 ? `<table><tr><td>Kembalian</td><td style="text-align:right">${formatRupiahFull(changeAmt)}</td></tr></table>` : ''}
  <div class="divider-solid"></div>
  <div class="center footer">
    <div>Terima kasih atas kunjungan Anda!</div>
    <div style="margin-top:4px">Simpan struk ini sebagai bukti pembelian.</div>
    <div style="margin-top:8px;font-size:10px">★ ApoGo POS ★</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=360,height=700,scrollbars=yes');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    }
  };

  const printInvoiceNota = (
    invNum: string,
    cartItems: CartItem[],
    disc: number,
    txAmount: number,
    txTax: number,
    paidPayments: PaymentEntry[],
    drName: string,
    ptName: string,
    cashierName: string
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const subtotalAmt = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const itemRows = cartItems.map((item, idx) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px;">${item.name} (${item.batch_number})</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.unit}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatRupiahFull(item.price)}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatRupiahFull(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const paymentsLabel = paidPayments.map(p => `${p.payment_method.toUpperCase()} (${formatRupiahFull(p.amount)})`).join(', ');

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Nota Penjualan - ${invNum}</title>
  <style>
    body { font-family: 'Arial', sans-serif; font-size: 13px; color: #000; padding: 20px; line-height: 1.4; }
    .header-table { width: 100%; margin-bottom: 20px; }
    .header-logo { font-size: 20px; font-weight: bold; }
    .title { font-size: 18px; font-weight: bold; text-align: center; text-decoration: underline; margin-bottom: 20px; }
    .info-table { width: 100%; margin-bottom: 15px; }
    .info-table td { padding: 3px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .items-table th { border: 1px solid #000; background: #f2f2f2; padding: 8px; font-weight: bold; text-align: center; }
    .summary-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .summary-table td { padding: 4px; }
    .signatures { width: 100%; margin-top: 40px; display: flex; justify-content: space-between; }
    .sig-box { width: 200px; text-align: center; }
    .sig-space { height: 60px; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="header-logo">💊 Apotek ApoGo</div>
        <div style="font-size: 11px;">Jl. Contoh No. 1, Jakarta | Telp: (021) 000-0000</div>
        <div style="font-size: 11px;">SIA: 123/SIA/2026 | Apoteker: Ade Wiramiharja, S.Farm., Apt.</div>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <div style="font-size: 12px; font-weight: bold;">NOTA PENJUALAN OBAT</div>
        <div>No: ${invNum}</div>
        <div>Tanggal: ${dateStr} ${timeStr}</div>
      </td>
    </tr>
  </table>

  <div class="divider" style="border-top: 2px solid #000; margin-bottom: 15px;"></div>

  <table class="info-table">
    <tr>
      <td style="width: 15%;"><strong>Pasien:</strong></td>
      <td style="width: 35%;">${ptName || 'Umum'}</td>
      <td style="width: 15%;"><strong>Dokter:</strong></td>
      <td style="width: 35%;">${drName || '-'}</td>
    </tr>
    <tr>
      <td><strong>Kasir:</strong></td>
      <td>${cashierName}</td>
      <td><strong>Metode:</strong></td>
      <td>${paymentsLabel || 'Tunai'}</td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th>Nama Item (Batch)</th>
        <th style="width: 10%;">Qty</th>
        <th style="width: 10%;">Satuan</th>
        <th style="width: 15%;">Harga</th>
        <th style="width: 20%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr>
        <td colspan="4" style="border: none;"></td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: right;">Subtotal:</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${formatRupiahFull(subtotalAmt)}</td>
      </tr>
      ${disc > 0 ? `
      <tr>
        <td colspan="4" style="border: none;"></td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: right; color: red;">Diskon:</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; color: red;">-${formatRupiahFull(disc)}</td>
      </tr>` : ''}
      <tr>
        <td colspan="4" style="border: none;"></td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: right;">PPN 11%:</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${formatRupiahFull(txTax)}</td>
      </tr>
      <tr>
        <td colspan="4" style="border: none;"></td>
        <td style="border: 1px solid #000; padding: 6px; background: #eee; font-weight: bold; text-align: right;">TOTAL:</td>
        <td style="border: 1px solid #000; padding: 6px; background: #eee; text-align: right; font-weight: bold;">${formatRupiahFull(txAmount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div>Penerima / Pasien</div>
      <div class="sig-space"></div>
      <div>( _____________________ )</div>
    </div>
    <div class="sig-box">
      <div>Hormat Kami,</div>
      <div class="sig-space"></div>
      <div>( ${cashierName} )</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // Multi-Payment states (Split Payment)
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentMethod, setCurrentMethod] = useState<'cash' | 'qris' | 'card' | 'insurance'>('cash');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currentRef, setCurrentRef] = useState('');

  // Single-Payment states (Premium Direct Flow)
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'card' | 'insurance'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [cardBankName, setCardBankName] = useState('');
  const [cardTxRef, setCardTxRef] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNum, setInsurancePolicyNum] = useState('');

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
    } catch (err: any) {
      console.error('Error fetching active stock:', err);
      Swal.fire({
        title: 'Error Koneksi Database',
        text: `Gagal mengambil stok obat: ${err.message || 'Permission Denied'}. Harap jalankan script SQL Grant di Supabase SQL Editor.`,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true)
        .order('min_purchase', { ascending: false });

      if (error) throw error;
      
      const now = new Date();
      const validDiscounts = (data || []).filter((d: any) => {
        const start = d.start_date ? new Date(d.start_date) : null;
        const end = d.end_date ? new Date(d.end_date) : null;
        return (!start || now >= start) && (!end || now <= end);
      });
      setActiveDiscounts(validDiscounts);
    } catch (err: any) {
      console.warn('Gagal memuat diskon dari database, menggunakan fallback:', err.message);
      const local = localStorage.getItem('demo_discounts');
      if (local) {
        const now = new Date();
        const parsed = JSON.parse(local).filter((d: any) => {
          if (!d.is_active) return false;
          const start = d.start_date ? new Date(d.start_date) : null;
          const end = d.end_date ? new Date(d.end_date) : null;
          return (!start || now >= start) && (!end || now <= end);
        });
        parsed.sort((a: any, b: any) => b.min_purchase - a.min_purchase);
        setActiveDiscounts(parsed);
      } else {
        const defaultMock = [
          { id: '3', name: 'Event Spesial 15%', min_purchase: 250000, discount_percent: 15, is_active: true, start_date: '2026-06-15T00:00:00Z', end_date: '2026-07-15T23:59:59Z' },
          { id: '2', name: 'Mega Promo 10%', min_purchase: 150000, discount_percent: 10, is_active: true, start_date: '2026-06-01T00:00:00Z', end_date: '2026-08-31T23:59:59Z' },
          { id: '1', name: 'Diskon Grosir 5%', min_purchase: 75000, discount_percent: 5, is_active: true, start_date: '2026-01-01T00:00:00Z', end_date: '2030-12-31T23:59:59Z' }
        ];
        const now = new Date();
        const filteredMock = defaultMock.filter(d => {
          const start = d.start_date ? new Date(d.start_date) : null;
          const end = d.end_date ? new Date(d.end_date) : null;
          return (!start || now >= start) && (!end || now <= end);
        });
        setActiveDiscounts(filteredMock);
      }
    }
  };

  useEffect(() => {
    generateInvoice();
    fetchActiveBatches();
    fetchActiveDiscounts();
  }, []);

  const hasRestrictedDrug = cart.some(item =>
    item.category === 'Obat Keras' || item.category === 'Psikotropika' || item.category === 'Narkotika'
  );

  // Auto-enable prescription form if cart has restricted drugs (Obat Keras / Psikotropika / Narkotika)
  useEffect(() => {
    if (hasRestrictedDrug) {
      setUsePrescription(true);
    }
  }, [hasRestrictedDrug]);

  // 2. Add to Cart
  const handleAddToCart = (batch: DrugBatchJoin) => {
    const existingIndex = cart.findIndex(item => item.batch_id === batch.id);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity >= batch.stock) {
        Swal.fire({
          title: 'Stok Terbatas',
          text: 'Stok batch aktif sudah mencapai batas maksimal.',
          icon: 'warning',
          confirmButtonColor: '#10b981'
        });
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
        Swal.fire({
          title: 'Stok Tidak Cukup',
          text: 'Jumlah pembelian melebihi stok yang tersedia.',
          icon: 'warning',
          confirmButtonColor: '#10b981'
        });
        return;
      } else {
        item.quantity = newQty;
      }
      setCart(updatedCart);
    }
  };

  // 3. Billing Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Kalkulasi diskon & PPN otomatis berdasarkan kebijakan
  const { discount, tax, reason: discountReason } = (() => {
    let autoDiscount = 0;
    let discountReason = '';

    // Aturan 1: Diskon Dinamis dari Database / Pengaturan
    const appliedDiscount = activeDiscounts.find(d => subtotal >= d.min_purchase);
    if (appliedDiscount) {
      autoDiscount = Math.round(subtotal * (appliedDiscount.discount_percent / 100));
      discountReason = `${appliedDiscount.name} ${appliedDiscount.discount_percent}% (Subtotal >= ${formatRupiah(appliedDiscount.min_purchase)})`;
    }

    // Aturan 2: Pajak PPN 11% sesuai Kebijakan Pemerintah RI
    // PPN dikenakan dari Nilai DPP (Subtotal setelah dikurangi diskon)
    const dpp = Math.max(0, subtotal - autoDiscount);
    const autoTax = Math.round(dpp * 0.11);

    return {
      discount: autoDiscount,
      tax: autoTax,
      reason: discountReason || 'Tidak ada diskon aktif'
    };
  })();

  const totalAmount = Math.max(0, subtotal - discount + tax);

  const totalPaid = isSplitPayment
    ? payments.reduce((sum, p) => sum + p.amount, 0)
    : (paymentMethod === 'cash' ? Math.min(totalAmount, Number(cashReceived.replace(/\D/g, ''))) : totalAmount);

  const balanceDue = Math.max(0, totalAmount - totalPaid);

  const cashChange = !isSplitPayment && paymentMethod === 'cash'
    ? Math.max(0, Number(cashReceived.replace(/\D/g, '')) - totalAmount)
    : (isSplitPayment ? (payments.some(p => p.payment_method === 'cash') && totalPaid > totalAmount ? totalPaid - totalAmount : 0) : 0);

  // 4. Manage Payments List
  const handleAddPayment = () => {
    const rawVal = currentAmount.replace(/\D/g, '');
    const amount = Number(rawVal);
    if (!amount || amount <= 0) {
      Swal.fire({
        title: 'Input Tidak Valid',
        text: 'Masukkan jumlah uang pembayaran yang valid.',
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (amount > balanceDue && currentMethod !== 'cash') {
      Swal.fire({
        title: 'Kelebihan Bayar',
        text: 'Pembayaran non-tunai tidak boleh melebihi jumlah tagihan.',
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
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
    // Check if user is logged in as demo role
    try {
      const sessionStr = localStorage.getItem('demo_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.role === 'demo') {
          Swal.fire({
            title: 'Mode Demo',
            text: 'Anda masuk menggunakan Akun Demo. Pembayaran/Transaksi dinonaktifkan dalam mode ini.',
            icon: 'warning',
            confirmButtonColor: '#3b82f6'
          });
          return;
        }
      }
    } catch (_) {}

    if (cart.length === 0) {
      Swal.fire({
        title: 'Keranjang Kosong',
        text: 'Keranjang belanja kosong.',
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (balanceDue > 0) {
      Swal.fire({
        title: 'Pembayaran Kurang',
        text: 'Pembayaran belum mencukupi total tagihan.',
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    // Validasi kelengkapan data resep jika menggunakan resep atau mengandung obat keras
    if (usePrescription || hasRestrictedDrug) {
      if (!doctorName.trim() || !patientName.trim()) {
        Swal.fire({
          title: 'Data Resep Belum Lengkap',
          text: 'Harap isi Nama Dokter dan Nama Pasien pada form resep di sebelah kanan.',
          icon: 'warning',
          confirmButtonColor: '#10b981'
        });
        return;
      }
    }

    setCheckoutLoading(true);
    try {
      let prescription_id = null;

      // Dapatkan active user id untuk pencatatan cashier_id
      let cashier_id = null;
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        cashier_id = currentUser.id;
      } else {
        const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
        if (profile) cashier_id = profile.id;
      }

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

      // Siapkan data pembayaran berdasarkan mode
      let checkoutPayments: PaymentEntry[] = [];
      if (isSplitPayment) {
        checkoutPayments = payments;
      } else {
        if (paymentMethod === 'cash') {
          checkoutPayments = [{
            payment_method: 'cash',
            amount: totalAmount,
            reference_number: 'Tunai'
          }];
        } else if (paymentMethod === 'qris') {
          checkoutPayments = [{
            payment_method: 'qris',
            amount: totalAmount,
            reference_number: `QRIS-${invoiceNumber}`
          }];
        } else if (paymentMethod === 'card') {
          checkoutPayments = [{
            payment_method: 'card',
            amount: totalAmount,
            reference_number: `${cardBankName || 'Debit/Kredit'}${cardTxRef ? ` - Ref: ${cardTxRef}` : ''}`
          }];
        } else if (paymentMethod === 'insurance') {
          checkoutPayments = [{
            payment_method: 'insurance',
            amount: totalAmount,
            reference_number: `${insuranceProvider || 'Asuransi'}${insurancePolicyNum ? ` - Polis: ${insurancePolicyNum}` : ''}`
          }];
        }
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
          payments: checkoutPayments,
          cashier_id
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Gagal memproses transaksi.');
      }

      // Ambil nama kasir dari session
      let cashierName = 'Kasir';
      try {
        const session = JSON.parse(localStorage.getItem('demo_session') || '{}');
        cashierName = session?.name || 'Kasir';
      } catch (_) {}

      await Swal.fire({
        title: '✅ Transaksi Berhasil!',
        html: `Faktur <strong>${invoiceNumber}</strong> telah terekam. Silakan pilih format cetak dokumen di bawah ini:`,
        icon: 'success',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '🖨️ Cetak Struk (58/80mm)',
        denyButtonText: '📄 Cetak Nota (A5)',
        cancelButtonText: '❌ Lewati',
        confirmButtonColor: '#10b981',
        denyButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280'
      }).then((result) => {
        if (result.isConfirmed) {
          printReceipt(
            invoiceNumber,
            [...cart],
            discount,
            totalAmount,
            tax,
            checkoutPayments,
            doctorName,
            patientName,
            cashierName
          );
        } else if (result.isDenied) {
          printInvoiceNota(
            invoiceNumber,
            [...cart],
            discount,
            totalAmount,
            tax,
            checkoutPayments,
            doctorName,
            patientName,
            cashierName
          );
        }
      });

      // Reset Kasir
      setCart([]);
      setPayments([]);
      setUsePrescription(false);
      setDoctorName('');
      setDoctorSip('');
      setPatientName('');
      setPatientPhone('');
      setPrescriptionFile(null);
      setCashReceived('');
      setCardBankName('');
      setCardTxRef('');
      setInsuranceProvider('');
      setInsurancePolicyNum('');
      generateInvoice();
      fetchActiveBatches();

    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Checkout',
        text: `Error Transaksi: ${err.message}`,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.batch_number.toLowerCase().includes(search.toLowerCase())
  );

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
          <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)' }}>💡 Saran Pencarian:</span>
            {['Paracetamol', 'Amoxicillin', 'Alprazolam', 'Nellco'].map(term => (
              <button
                key={term}
                type="button"
                onClick={() => setSearch(term)}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
              >
                {term}
              </button>
            ))}
          </div>
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
                onChange={(e) => {
                  if (hasRestrictedDrug) {
                    Swal.fire({
                      title: 'Validasi Resep Wajib',
                      text: 'Transaksi mengandung Obat Keras/Psikotropika. Resep dokter wajib divalidasi.',
                      icon: 'warning',
                      confirmButtonColor: '#10b981'
                    });
                    return;
                  }
                  setUsePrescription(e.target.checked);
                }}
                disabled={hasRestrictedDrug}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          {hasRestrictedDrug && (
            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginTop: '6px' }}>
              ⚠️ Mengandung Obat Keras / Psikotropika / Narkotika. Resep Dokter Wajib Dilampirkan & Divalidasi!
            </div>
          )}

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
              <label>Diskon Otomatis (Rp)</label>
              <input
                type="text"
                className="input-field"
                style={{ backgroundColor: 'var(--bg-app)', cursor: 'not-allowed', fontWeight: 600 }}
                value={formatRupiah(discount)}
                disabled
              />
              <small style={{ fontSize: '10px', color: 'var(--primary)', display: 'block', marginTop: '2px' }}>
                {discountReason}
              </small>
            </div>
            <div className={styles.billInputGroup}>
              <label>PPN 11% (Rp)</label>
              <input
                type="text"
                className="input-field"
                style={{ backgroundColor: 'var(--bg-app)', cursor: 'not-allowed', fontWeight: 600 }}
                value={formatRupiah(tax)}
                disabled
              />
              <small style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                UU HPP Pemerintah
              </small>
            </div>
          </div>

          <div className={`${styles.billRow} ${styles.totalRow}`}>
            <span>Total Tagihan</span>
            <span>{formatRupiah(totalAmount)}</span>
          </div>
        </div>

        {/* Kalkulator Pembayaran Premium */}
        <div className={`${styles.paymentCard} glass-panel`}>
          <h3>Metode Pembayaran</h3>

          {!isSplitPayment ? (
            /* Mode Single-Payment (Cepat & Premium) */
            <div>
              <div className={styles.paymentMethodsRow}>
                <button
                  type="button"
                  className={`${styles.methodBtn} ${paymentMethod === 'cash' ? styles.activeMethod : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <span className={styles.methodIcon}>💵</span>
                  <span className={styles.methodLabel}>Tunai</span>
                </button>
                <button
                  type="button"
                  className={`${styles.methodBtn} ${paymentMethod === 'qris' ? styles.activeMethod : ''}`}
                  onClick={() => setPaymentMethod('qris')}
                >
                  <span className={styles.methodIcon}>📱</span>
                  <span className={styles.methodLabel}>QRIS</span>
                </button>
                <button
                  type="button"
                  className={`${styles.methodBtn} ${paymentMethod === 'card' ? styles.activeMethod : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <span className={styles.methodIcon}>💳</span>
                  <span className={styles.methodLabel}>Kartu</span>
                </button>
                <button
                  type="button"
                  className={`${styles.methodBtn} ${paymentMethod === 'insurance' ? styles.activeMethod : ''}`}
                  onClick={() => setPaymentMethod('insurance')}
                >
                  <span className={styles.methodIcon}>🛡️</span>
                  <span className={styles.methodLabel}>Asuransi</span>
                </button>
              </div>

              {/* Rincian Input Form Berdasarkan Metode */}
              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Masukkan jumlah uang..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(formatInputRupiah(e.target.value))}
                  />
                  <div className={styles.quickCashGrid}>
                    <button
                      type="button"
                      className={styles.quickCashBtn}
                      onClick={() => setCashReceived(formatInputRupiah(String(totalAmount)))}
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      className={styles.quickCashBtn}
                      onClick={() => setCashReceived(formatInputRupiah(String(Math.ceil(totalAmount / 10000) * 10000)))}
                    >
                      Pecahan Terdekat
                    </button>
                    <button
                      type="button"
                      className={styles.quickCashBtn}
                      onClick={() => setCashReceived(formatInputRupiah(String(50000)))}
                    >
                      50.000
                    </button>
                    <button
                      type="button"
                      className={styles.quickCashBtn}
                      onClick={() => setCashReceived(formatInputRupiah(String(100000)))}
                    >
                      100.000
                    </button>
                  </div>

                  <div className={styles.paymentStatusRow} style={{ marginTop: '16px' }}>
                    <div className={styles.statusKembalian}>
                      Kembalian: <strong>{formatRupiah(cashChange)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'qris' && (
                <div className={styles.qrisBox} style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>QRIS DINAMIS APOGO</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=ApoGo-INV-${invoiceNumber}`}
                    alt="QRIS Barcode"
                    className={styles.qrisQr}
                    width={160}
                    height={160}
                  />
                  <div className={styles.qrisStatus}>
                    <div className={styles.pulsingDot}></div>
                    <span>Menunggu scan pembayaran dari pelanggan...</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className={styles.premiumForm} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Nama Bank</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="BCA, Mandiri, dll."
                      value={cardBankName}
                      onChange={(e) => setCardBankName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>No. Ref / Kartu</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="4 Digit Terakhir / Ref"
                      value={cardTxRef}
                      onChange={(e) => setCardTxRef(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'insurance' && (
                <div className={styles.premiumForm} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Provider Asuransi</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="BPJS, Inhealth, Prudential"
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>No. Polis / Kartu</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Nomor kartu asuransi..."
                      value={insurancePolicyNum}
                      onChange={(e) => setInsurancePolicyNum(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode Multi-Payment / Split (Untuk kebutuhan khusus) */
            <div>
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
                  type="text"
                  className="input-field"
                  placeholder="Jumlah Uang"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(formatInputRupiah(e.target.value))}
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
                <div className={styles.paymentList} style={{ marginTop: '12px' }}>
                  {payments.map((p, idx) => (
                    <div key={idx} className={styles.paymentRow}>
                      <span className={styles.payMethod}>
                        {p.payment_method.toUpperCase()}
                        {p.reference_number && <span className={styles.payRef}> ({p.reference_number})</span>}
                      </span>
                      <span className={styles.payAmount}>{formatRupiah(p.amount)}</span>
                      <button type="button" onClick={() => handleRemovePayment(idx)} className={styles.removePayBtn}>❌</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Status Selisih Pembayaran */}
              <div className={styles.paymentStatusRow} style={{ marginTop: '12px' }}>
                {balanceDue > 0 ? (
                  <div className={styles.statusKurang}>
                    Kurang: <strong>{formatRupiah(balanceDue)}</strong>
                  </div>
                ) : (
                  <div className={styles.statusKembalian}>
                    Kembalian: <strong>{formatRupiah(cashChange)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toggle Split Payment Mode */}
          <div className={styles.splitPaymentToggleRow}>
            <span>Bagi Pembayaran (Split Payment)</span>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={isSplitPayment}
                onChange={(e) => setIsSplitPayment(e.target.checked)}
              />
              <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
          </div>

          <button
            onClick={handleCheckout}
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}
            disabled={
              checkoutLoading || 
              cart.length === 0 || 
              (isSplitPayment && balanceDue > 0) ||
              (!isSplitPayment && paymentMethod === 'cash' && (!cashReceived || Number(cashReceived.replace(/\D/g, '')) < totalAmount))
            }
          >
            {checkoutLoading ? 'Memproses Transaksi...' : 'SELESAIKAN TRANSAKSI (PRINT STRUK) 🖨️'}
          </button>
        </div>
      </div>
    </div>
  );
}
