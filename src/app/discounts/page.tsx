'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './discounts.module.css';
import Swal from 'sweetalert2';

interface DiscountRule {
  id: string;
  name: string;
  min_purchase: number;
  discount_percent: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at?: string;
}

export default function DiscountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [dbError, setDbError] = useState<boolean>(false);

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch all discounts
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('min_purchase', { ascending: true });

      if (error) throw error;

      setDiscounts(data || []);
      setDbError(false);
    } catch (err: any) {
      console.warn('Supabase error, loading from localStorage:', err.message);
      setDbError(true);
      
      // Load fallback local storage
      const local = localStorage.getItem('demo_discounts');
      if (local) {
        setDiscounts(JSON.parse(local));
      } else {
        const defaultMock: DiscountRule[] = [
          { id: '1', name: 'Diskon Grosir 5%', min_purchase: 75000, discount_percent: 5, start_date: '2026-01-01T00:00:00Z', end_date: '2030-12-31T23:59:59Z', is_active: true },
          { id: '2', name: 'Mega Promo 10%', min_purchase: 150000, discount_percent: 10, start_date: '2026-06-01T00:00:00Z', end_date: '2026-08-31T23:59:59Z', is_active: true },
          { id: '3', name: 'Event Spesial 15%', min_purchase: 250000, discount_percent: 15, start_date: '2026-06-15T00:00:00Z', end_date: '2026-07-15T23:59:59Z', is_active: true }
        ];
        localStorage.setItem('demo_discounts', JSON.stringify(defaultMock));
        setDiscounts(defaultMock);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const sessionStr = localStorage.getItem('demo_session');
        if (!sessionStr) {
          router.push('/login');
          return;
        }
        const session = JSON.parse(sessionStr);

        let isAllowed = false;
        try {
          const { data, error } = await supabase
            .from('role_permissions')
            .select('is_allowed')
            .eq('role', session.role)
            .eq('menu_key', 'discounts')
            .single();

          if (!error && data) {
            isAllowed = data.is_allowed;
          } else {
            throw new Error();
          }
        } catch (_) {
          // Fallback
          const local = localStorage.getItem('demo_role_permissions');
          if (local) {
            const perms = JSON.parse(local);
            const matched = perms.find((p: any) => p.role === session.role && p.menu_key === 'discounts');
            isAllowed = matched ? matched.is_allowed : (session.role === 'admin');
          } else {
            isAllowed = (session.role === 'admin');
          }
        }

        if (!isAllowed) {
          Swal.fire('Akses Ditolak', 'Anda tidak memiliki hak akses untuk membuka halaman ini.', 'error');
          router.push('/dashboard');
        }
      } catch (_) {
        router.push('/login');
      }
    };
    checkPermission();
  }, [router]);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Format Helper
  const formatInputRupiah = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(Number(clean));
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanMinPurchase = Number(minPurchase.replace(/\D/g, ''));
    const cleanPercent = Number(discountPercent);
    const cleanStartDate = startDate ? new Date(startDate).toISOString() : null;
    const cleanEndDate = endDate ? new Date(endDate).toISOString() : null;

    if (!name.trim()) {
      Swal.fire('Error', 'Nama event diskon harus diisi.', 'error');
      return;
    }
    if (isNaN(cleanMinPurchase) || cleanMinPurchase < 0) {
      Swal.fire('Error', 'Minimal pembelian tidak valid.', 'error');
      return;
    }
    if (isNaN(cleanPercent) || cleanPercent <= 0 || cleanPercent > 100) {
      Swal.fire('Error', 'Persentase diskon harus bernilai antara 1 s/d 100.', 'error');
      return;
    }
    if (cleanStartDate && cleanEndDate && new Date(cleanStartDate) >= new Date(cleanEndDate)) {
      Swal.fire('Error', 'Tanggal berakhir harus setelah tanggal mulai.', 'error');
      return;
    }

    setSubmitLoading(true);

    try {
      if (dbError) {
        // Fallback simulation using local storage
        let updatedList: DiscountRule[] = [];
        if (editId) {
          updatedList = discounts.map(d => 
            d.id === editId 
              ? { ...d, name, min_purchase: cleanMinPurchase, discount_percent: cleanPercent, start_date: cleanStartDate, end_date: cleanEndDate, is_active: isActive } 
              : d
          );
          Swal.fire('Simulasi Berhasil', 'Diskon berhasil diperbarui di penyimpanan lokal.', 'success');
        } else {
          const newDisc: DiscountRule = {
            id: Math.random().toString(36).substring(2, 9),
            name,
            min_purchase: cleanMinPurchase,
            discount_percent: cleanPercent,
            start_date: cleanStartDate,
            end_date: cleanEndDate,
            is_active: isActive
          };
          updatedList = [...discounts, newDisc];
          Swal.fire('Simulasi Berhasil', 'Diskon baru berhasil ditambahkan ke penyimpanan lokal.', 'success');
        }
        localStorage.setItem('demo_discounts', JSON.stringify(updatedList));
        setDiscounts(updatedList);
        resetForm();
      } else {
        // Real database write
        if (editId) {
          const { error } = await supabase
            .from('discounts')
            .update({
              name,
              min_purchase: cleanMinPurchase,
              discount_percent: cleanPercent,
              start_date: cleanStartDate,
              end_date: cleanEndDate,
              is_active: isActive
            })
            .eq('id', editId);

          if (error) throw error;
          Swal.fire('Berhasil', 'Event diskon berhasil diperbarui.', 'success');
        } else {
          const { error } = await supabase
            .from('discounts')
            .insert([{
              name,
              min_purchase: cleanMinPurchase,
              discount_percent: cleanPercent,
              start_date: cleanStartDate,
              end_date: cleanEndDate,
              is_active: isActive
            }]);

          if (error) throw error;
          Swal.fire('Berhasil', 'Event diskon baru berhasil ditambahkan.', 'success');
        }
        resetForm();
        fetchDiscounts();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal menyimpan diskon: ${err.message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      if (dbError) {
        const updatedList = discounts.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d);
        localStorage.setItem('demo_discounts', JSON.stringify(updatedList));
        setDiscounts(updatedList);
      } else {
        const { error } = await supabase
          .from('discounts')
          .update({ is_active: !currentStatus })
          .eq('id', id);

        if (error) throw error;
        fetchDiscounts();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal mengubah status: ${err.message}`, 'error');
    }
  };

  // Delete Discount
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Event diskon ini akan dihapus dari sistem.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
      if (dbError) {
        const updatedList = discounts.filter(d => d.id !== id);
        localStorage.setItem('demo_discounts', JSON.stringify(updatedList));
        setDiscounts(updatedList);
        Swal.fire('Terhapus', 'Diskon telah dihapus secara simulasi.', 'success');
      } else {
        const { error } = await supabase
          .from('discounts')
          .delete()
          .eq('id', id);

        if (error) throw error;
        Swal.fire('Terhapus', 'Event diskon berhasil dihapus.', 'success');
        fetchDiscounts();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal menghapus: ${err.message}`, 'error');
    }
  };

  const startEdit = (rule: DiscountRule) => {
    setEditId(rule.id);
    setName(rule.name);
    setMinPurchase(formatInputRupiah(String(rule.min_purchase)));
    setDiscountPercent(String(rule.discount_percent));
    setIsActive(rule.is_active);
    setStartDate(rule.start_date ? rule.start_date.substring(0, 16) : '');
    setEndDate(rule.end_date ? rule.end_date.substring(0, 16) : '');
  };

  const resetForm = () => {
    setEditId(null);
    setName('');
    setMinPurchase('');
    setDiscountPercent('');
    setIsActive(true);
    setStartDate('');
    setEndDate('');
  };

  const formatDateString = (isoString?: string | null) => {
    if (!isoString) return 'Selamanya (Selalu Aktif)';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Pengaturan Diskon Penjualan</h2>
        </div>
      </header>

      {/* Database Warning SQL Setup Banner */}
      {dbError && (
        <div className={styles.warningBanner}>
          <div>
            <strong>⚠️ Tabel Database Belum Siap:</strong> Fitur diskon saat ini berjalan dalam mode <strong>Simulasi Lokal (localStorage)</strong>.
            Untuk menyambungkannya ke database Supabase Anda, silakan salin dan jalankan query SQL berikut di <strong>SQL Editor Supabase</strong> Anda:
          </div>
          <code>{`CREATE TABLE public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    min_purchase NUMERIC NOT NULL DEFAULT 0,
    discount_percent NUMERIC NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.discounts FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users" ON public.discounts FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.discounts (name, min_purchase, discount_percent, start_date, end_date, is_active) VALUES
('Diskon Grosir 5%', 75000, 5, '2026-01-01T00:00:00Z', '2030-12-31T23:59:59Z', true),
('Mega Promo 10%', 150000, 10, '2026-06-01T00:00:00Z', '2026-08-31T23:59:59Z', true)
ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discounts TO anon, authenticated, service_role;`}</code>
          <div>
            Setelah Anda menjalankan SQL di atas, silakan <strong>muat ulang halaman ini</strong> untuk menghubungkannya secara langsung.
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column: Form Add/Edit */}
        <div className={`${styles.card} glass-panel`}>
          <h3>{editId ? '📝 Edit Event Diskon' : '➕ Tambah Event Diskon'}</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Nama Event Diskon</label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Diskon Kemerdekaan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Minimal Belanja (Subtotal)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>Rp</span>
                <input
                  type="text"
                  className={`input-field ${styles.prefixInput}`}
                  placeholder="Contoh: 100.000"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(formatInputRupiah(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Besar Potongan Harga (%)</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={`input-field ${styles.suffixInput}`}
                  placeholder="Contoh: 10"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  required
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Tanggal Mulai (Opsional)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tanggal Berakhir (Opsional)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Status Event Aktif</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitLoading}
              >
                {submitLoading ? 'Menyimpan...' : 'Simpan Aturan'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: List of Discounts */}
        <div className={`${styles.card} glass-panel`} style={{ overflow: 'hidden' }}>
          <h3>📋 Daftar Event Diskon Aktif</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>Memuat data diskon...</div>
          ) : discounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Belum ada event diskon yang terdaftar. Buat event diskon baru di panel sebelah kiri.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama Event</th>
                    <th>Min. Pembelian</th>
                    <th>Potongan (%)</th>
                    <th>Masa Berlaku</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((rule) => (
                    <tr key={rule.id}>
                      <td style={{ fontWeight: 600 }}>{rule.name}</td>
                      <td>{formatRupiah(rule.min_purchase)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{rule.discount_percent}%</td>
                      <td>
                        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                          <div>📅 <strong>Mulai:</strong> {formatDateString(rule.start_date)}</div>
                          <div>🏁 <strong>Selesai:</strong> {formatDateString(rule.end_date)}</div>
                        </div>
                      </td>
                      <td>
                        <span 
                          onClick={() => handleToggleActive(rule.id, rule.is_active)}
                          className={`${styles.badge} ${rule.is_active ? styles.badgeActive : styles.badgeInactive}`}
                          style={{ cursor: 'pointer' }}
                          title="Klik untuk mengubah status"
                        >
                          {rule.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button 
                            onClick={() => startEdit(rule)} 
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(rule.id)} 
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
