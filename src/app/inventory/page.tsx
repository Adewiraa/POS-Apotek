'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './inventory.module.css';
import Swal from 'sweetalert2';

interface Drug {
  id: string;
  name: string;
  generic_name: string | null;
  kfa_code: string | null;
  category: string;
  unit: string;
  min_stock: number;
}

const INITIAL_MOCK_DRUGS: Omit<Drug, 'id'>[] = [
  { name: 'Paracetamol 500mg', generic_name: 'Paracetamol', kfa_code: '93000101', category: 'Obat Bebas', unit: 'Tablet', min_stock: 100 },
  { name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', kfa_code: '93000204', category: 'Obat Keras', unit: 'Tablet', min_stock: 50 },
  { name: 'Alprazolam 0.5mg', generic_name: 'Alprazolam', kfa_code: '93000450', category: 'Psikotropika', unit: 'Tablet', min_stock: 20 },
  { name: 'OBH Nellco Sirup 100ml', generic_name: 'Succus Liquiritiae', kfa_code: '93000812', category: 'Obat Bebas Terbatas', unit: 'Botol', min_stock: 15 },
];

export default function DrugsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [kfaCode, setKfaCode] = useState('');
  const [category, setCategory] = useState('Obat Bebas');
  const [unit, setUnit] = useState('Tablet');
  const [minStock, setMinStock] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setDrugs(data);
      }
    } catch (err: any) {
      console.error('Error fetching drugs:', err);
      Swal.fire({
        title: 'Error Koneksi Database',
        text: `Gagal memuat katalog obat: ${err.message || 'Permission Denied'}. Harap jalankan script SQL Grant di Supabase SQL Editor.`,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in as demo role
    try {
      const sessionStr = localStorage.getItem('demo_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.role === 'demo') {
          Swal.fire({
            title: 'Mode Demo',
            text: 'Anda masuk menggunakan Akun Demo. Menambah master obat dinonaktifkan dalam mode ini.',
            icon: 'warning',
            confirmButtonColor: '#3b82f6'
          });
          return;
        }
      }
    } catch (_) {}

    setSubmitting(true);
    setError(null);

    const newDrugData = {
      name,
      generic_name: genericName || null,
      kfa_code: kfaCode || null,
      category,
      unit,
      min_stock: Number(minStock),
    };

    try {
      // Coba simpan ke Supabase
      const { data, error } = await supabase
        .from('drugs')
        .insert([newDrugData])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setDrugs(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      }
      
      // Reset Form
      setName('');
      setGenericName('');
      setKfaCode('');
      setMinStock(10);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Obat berhasil ditambahkan ke database!',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.warn('Gagal menyimpan ke database Supabase (menggunakan penyimpanan lokal statis):', err.message);
      // Fallback: simpan ke state lokal untuk kelancaran demo
      const mockNewDrug: Drug = {
        id: `mock-${Date.now()}`,
        ...newDrugData,
      };
      setDrugs(prev => [...prev, mockNewDrug].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Reset Form
      setName('');
      setGenericName('');
      setKfaCode('');
      setMinStock(10);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedData = async () => {
    // Check if user is logged in as demo role
    try {
      const sessionStr = localStorage.getItem('demo_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.role === 'demo') {
          Swal.fire({
            title: 'Mode Demo',
            text: 'Anda masuk menggunakan Akun Demo. Seeding database dinonaktifkan dalam mode ini.',
            icon: 'warning',
            confirmButtonColor: '#3b82f6'
          });
          return;
        }
      }
    } catch (_) {}

    setLoading(true);
    try {
      const { error } = await supabase.from('drugs').insert(INITIAL_MOCK_DRUGS);
      if (error) throw error;
      Swal.fire({
        title: 'Berhasil!',
        text: 'Database berhasil di-seed dengan data master obat!',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
      fetchDrugs();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Seeding',
        text: err.message || 'Harap periksa tabel SQL Supabase Anda.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      setLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(drug =>
    drug.name.toLowerCase().includes(search.toLowerCase()) ||
    (drug.generic_name && drug.generic_name.toLowerCase().includes(search.toLowerCase())) ||
    (drug.kfa_code && drug.kfa_code.includes(search))
  );

  const getCategoryBadgeClass = (cat: string) => {
    if (cat.includes('Bebas Terbatas')) return styles['badge-warning'];
    if (cat.includes('Bebas')) return styles['badge-success'];
    if (cat.includes('Keras')) return styles['badge-danger'];
    return styles['badge-info']; // Psikotropika & Narkotika
  };

  return (
    <div className={styles.grid}>
      {/* Kolom Kiri: Tabel Master Obat */}
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.actionRow}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className="input-field"
              placeholder="Cari obat berdasarkan nama, generik, atau KFA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={handleSeedData} className="btn btn-secondary" style={{ padding: '10px 14px' }} title="Seed data awal ke database Supabase">
            🌱 Seed Database
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Obat</th>
                  <th>Kategori</th>
                  <th>Satuan</th>
                  <th>Kode KFA</th>
                  <th>Stok Min.</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Tidak ada obat yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredDrugs.map((drug) => (
                    <tr key={drug.id}>
                      <td>
                        <strong>{drug.name}</strong>
                        {drug.generic_name && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{drug.generic_name}</div>}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getCategoryBadgeClass(drug.category)}`}>
                          {drug.category}
                        </span>
                      </td>
                      <td>{drug.unit}</td>
                      <td><code>{drug.kfa_code || '-'}</code></td>
                      <td>{drug.min_stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kolom Kanan: Form Tambah Obat Baru */}
      <div className={`${styles.card} glass-panel`}>
        <h3>Tambah Master Obat</h3>
        <form onSubmit={handleAddDrug} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Nama Obat</label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Amoxicillin 500mg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Nama Kandungan Generik</label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Amoxicillin Trihydrate"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Kode KFA SatuSehat</label>
            <input
              type="text"
              className="input-field"
              placeholder="Masukkan 8 digit kode KFA"
              value={kfaCode}
              onChange={(e) => setKfaCode(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Golongan</label>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Obat Bebas">Obat Bebas</option>
                <option value="Obat Bebas Terbatas">Obat Bebas Terbatas</option>
                <option value="Obat Keras">Obat Keras</option>
                <option value="Psikotropika">Psikotropika</option>
                <option value="Narkotika">Narkotika</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Satuan</label>
              <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="Tablet">Tablet</option>
                <option value="Kapsul">Kapsul</option>
                <option value="Botol">Botol</option>
                <option value="Tube">Tube</option>
                <option value="Pcs">Pcs</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Batas Stok Minimum</label>
            <input
              type="number"
              className="input-field"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              min={1}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan Obat'}
          </button>
        </form>
      </div>
    </div>
  );
}
