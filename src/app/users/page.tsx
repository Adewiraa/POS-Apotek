'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import styles from './users.module.css';
import Swal from 'sweetalert2';

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  updated_at: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [currentUserSession, setCurrentUserSession] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'pharmacist' | 'cashier'>('cashier');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load current user session
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('demo_session') || '{}');
      setCurrentUserSession(session);
      // Only allow admins
      if (session?.role !== 'admin') {
        Swal.fire('Akses Ditolak', 'Hanya administrator yang dapat mengakses halaman ini.', 'error');
        router.push('/dashboard');
      }
    } catch (_) {
      router.push('/login');
    }
  }, [router]);

  // Fetch all user profiles
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
      setDbError(false);
    } catch (err: any) {
      console.warn('Gagal memuat profil:', err.message);
      setDbError(true);
      // Fallback local storage demo users if DB is not ready
      const local = localStorage.getItem('demo_profiles');
      if (local) {
        setProfiles(JSON.parse(local));
      } else {
        const defaultProfiles: Profile[] = [
          { id: '8f3699a5-8500-45b6-8c22-1037211f23e0', full_name: 'Ade Wiramiharja (Admin)', email: 'admin@demo.com', role: 'admin', updated_at: new Date().toISOString() },
          { id: '9a9da876-0000-0000-0000-000000000000', full_name: 'Apoteker Jaka', email: 'apoteker@demo.com', role: 'pharmacist', updated_at: new Date().toISOString() },
          { id: 'e9add0ab-42ac-47c3-a554-97d3f80960d5', full_name: 'Kasir Rina', email: 'kasir@demo.com', role: 'cashier', updated_at: new Date().toISOString() }
        ];
        localStorage.setItem('demo_profiles', JSON.stringify(defaultProfiles));
        setProfiles(defaultProfiles);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Swal.fire('Error', 'Semua kolom input wajib diisi.', 'error');
      return;
    }
    if (password.length < 6) {
      Swal.fire('Error', 'Password minimal harus 6 karakter.', 'error');
      return;
    }

    setSubmitLoading(true);

    try {
      if (dbError) {
        // Fallback simulation using local storage
        const newProfile: Profile = {
          id: Math.random().toString(36).substring(2, 9),
          full_name: fullName,
          email,
          role,
          updated_at: new Date().toISOString()
        };
        const updated = [...profiles, newProfile];
        localStorage.setItem('demo_profiles', JSON.stringify(updated));
        setProfiles(updated);
        Swal.fire('Simulasi Berhasil', 'Pengguna baru berhasil dibuat di penyimpanan lokal.', 'success');
        resetForm();
      } else {
        // 1. Sign up user using temp supabase client (doesn't overwrite current admin session)
        const tempSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } }
        );

        const { data: signUpData, error: authError } = await tempSupabase.auth.signUp({
          email,
          password
        });

        if (authError) throw authError;
        if (!signUpData.user) throw new Error('Registrasi user gagal.');

        // 2. Insert record into public.profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: signUpData.user.id,
            full_name: fullName,
            email,
            role
          }]);

        if (profileError) throw profileError;

        Swal.fire('Berhasil', 'Pengguna baru berhasil didaftarkan.', 'success');
        resetForm();
        fetchProfiles();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal membuat pengguna: ${err.message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (id === currentUserSession?.user?.id) {
      Swal.fire('Gagal', 'Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Hapus Pengguna?',
      text: 'Staf bersangkutan tidak akan memiliki akses login lagi setelah profilnya dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444'
    });

    if (!confirm.isConfirmed) return;

    try {
      if (dbError) {
        const updated = profiles.filter(p => p.id !== id);
        localStorage.setItem('demo_profiles', JSON.stringify(updated));
        setProfiles(updated);
        Swal.fire('Simulasi Berhasil', 'Pengguna berhasil dihapus.', 'success');
      } else {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (error) throw error;
        Swal.fire('Berhasil', 'Pengguna berhasil dihapus.', 'success');
        fetchProfiles();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal menghapus pengguna: ${err.message}`, 'error');
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('cashier');
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'admin': return '👑 Admin';
      case 'pharmacist': return '🔬 Apoteker';
      case 'cashier': return '💵 Kasir';
      default: return r;
    }
  };

  const getRoleClass = (r: string) => {
    switch (r) {
      case 'admin': return styles.roleAdmin;
      case 'pharmacist': return styles.rolePharmacist;
      case 'cashier': return styles.roleCashier;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Manajemen Pengguna &amp; Hak Akses</h2>
        </div>
      </header>

      {/* Database Warning SQL Setup Banner */}
      {dbError && (
        <div className={styles.warningBanner}>
          <div>
            <strong>⚠️ Kolom 'email' Belum Siap / Akses Ditolak:</strong> Halaman manajemen user berjalan dalam mode <strong>Simulasi Lokal (localStorage)</strong>.
            Silakan jalankan query SQL berikut di <strong>SQL Editor Supabase</strong> Anda untuk memperbarui tabel profil:
          </div>
          <code>{`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow all access on profiles for authenticated users" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;`}</code>
          <div>
            Setelah Anda menjalankan SQL di atas, silakan <strong>muat ulang halaman ini</strong>.
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Left Column: Form Add User */}
        <div className={`${styles.card} glass-panel`}>
          <h3>➕ Registrasi Pengguna</h3>
          <form onSubmit={handleCreateUser} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Nama Lengkap</label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Apoteker Budi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Alamat Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="staf@apotek.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password (Min. 6 Karakter)</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Pilih Hak Akses (Role)</label>
              <select 
                className="input-field" 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="cashier">Kasir (💵 cashier)</option>
                <option value="pharmacist">Apoteker (🔬 pharmacist)</option>
                <option value="admin">Administrator (👑 admin)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={submitLoading}>
              {submitLoading ? 'Menyimpan...' : 'Daftarkan Pengguna'}
            </button>
          </form>
        </div>

        {/* Right Column: User List */}
        <div className={`${styles.card} glass-panel`}>
          <h3>👥 Daftar Staf &amp; Hak Akses Aktif</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama Pengguna</th>
                    <th>Email</th>
                    <th>Hak Akses</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td style={{ fontWeight: 600 }}>{profile.full_name}</td>
                      <td>{profile.email || '-'}</td>
                      <td>
                        <span className={`${styles.badgeRole} ${getRoleClass(profile.role)}`}>
                          {getRoleLabel(profile.role)}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteProfile(profile.id)} 
                          className="btn btn-danger" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          disabled={profile.id === currentUserSession?.user?.id}
                        >
                          🗑️ Hapus
                        </button>
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
