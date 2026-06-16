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

interface RolePermission {
  id?: string;
  role: string;
  menu_key: string;
  is_allowed: boolean;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [currentUserSession, setCurrentUserSession] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'pharmacist' | 'cashier'>('cashier');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Check current session & dynamic permission on mount
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const sessionStr = localStorage.getItem('demo_session');
        if (!sessionStr) {
          router.push('/login');
          return;
        }

        const session = JSON.parse(sessionStr);
        setCurrentUserSession(session);

        // Fetch permission for this page
        let isAllowed = false;
        try {
          const { data, error } = await supabase
            .from('role_permissions')
            .select('is_allowed')
            .eq('role', session.role)
            .eq('menu_key', 'users')
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
            const matched = perms.find((p: any) => p.role === session.role && p.menu_key === 'users');
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

    verifyAccess();
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

  // Fetch all role permissions
  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) throw error;
      setRolePermissions(data || []);
    } catch (_) {
      // Fallback local storage
      const local = localStorage.getItem('demo_role_permissions');
      if (local) {
        setRolePermissions(JSON.parse(local));
      } else {
        const defaultPerms = [
          { role: 'admin', menu_key: 'pos', is_allowed: true },
          { role: 'admin', menu_key: 'inventory', is_allowed: true },
          { role: 'admin', menu_key: 'controlled_logs', is_allowed: true },
          { role: 'admin', menu_key: 'reports', is_allowed: true },
          { role: 'admin', menu_key: 'discounts', is_allowed: true },
          { role: 'admin', menu_key: 'users', is_allowed: true },
          { role: 'pharmacist', menu_key: 'pos', is_allowed: true },
          { role: 'pharmacist', menu_key: 'inventory', is_allowed: true },
          { role: 'pharmacist', menu_key: 'controlled_logs', is_allowed: true },
          { role: 'pharmacist', menu_key: 'reports', is_allowed: false },
          { role: 'pharmacist', menu_key: 'discounts', is_allowed: false },
          { role: 'pharmacist', menu_key: 'users', is_allowed: false },
          { role: 'cashier', menu_key: 'pos', is_allowed: true },
          { role: 'cashier', menu_key: 'inventory', is_allowed: false },
          { role: 'cashier', menu_key: 'controlled_logs', is_allowed: false },
          { role: 'cashier', menu_key: 'reports', is_allowed: false },
          { role: 'cashier', menu_key: 'discounts', is_allowed: false },
          { role: 'cashier', menu_key: 'users', is_allowed: false }
        ];
        localStorage.setItem('demo_role_permissions', JSON.stringify(defaultPerms));
        setRolePermissions(defaultPerms);
      }
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchPermissions();
  }, []);

  const handleStartEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setFullName(profile.full_name);
    setEmail(profile.email || '');
    setRole(profile.role as any);
    setPassword('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      Swal.fire('Error', 'Nama lengkap dan email wajib diisi.', 'error');
      return;
    }

    if (!editingId && !password.trim()) {
      Swal.fire('Error', 'Password wajib diisi untuk pengguna baru.', 'error');
      return;
    }
    if (!editingId && password.length < 6) {
      Swal.fire('Error', 'Password minimal harus 6 karakter.', 'error');
      return;
    }

    setSubmitLoading(true);

    try {
      if (editingId) {
        // Edit Mode
        if (dbError) {
          const updated = profiles.map(p => {
            if (p.id === editingId) {
              return { ...p, full_name: fullName, email, role };
            }
            return p;
          });
          localStorage.setItem('demo_profiles', JSON.stringify(updated));
          setProfiles(updated);
          
          // If editing logged-in user, update their session
          if (editingId === currentUserSession?.user?.id) {
            const updatedSession = { ...currentUserSession, role, name: fullName };
            localStorage.setItem('demo_session', JSON.stringify(updatedSession));
            document.cookie = `demo_role=${role}; path=/; max-age=86400`;
            setCurrentUserSession(updatedSession);
          }

          Swal.fire('Simulasi Berhasil', 'Data pengguna berhasil diperbarui.', 'success');
          setEditingId(null);
          resetForm();
        } else {
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              email,
              role
            })
            .eq('id', editingId);

          if (error) throw error;

          // If editing logged-in user, update session
          if (editingId === currentUserSession?.user?.id) {
            const updatedSession = { ...currentUserSession, role, name: fullName };
            localStorage.setItem('demo_session', JSON.stringify(updatedSession));
            document.cookie = `demo_role=${role}; path=/; max-age=86400`;
            setCurrentUserSession(updatedSession);
          }

          Swal.fire('Berhasil', 'Data pengguna berhasil diperbarui.', 'success');
          setEditingId(null);
          resetForm();
          fetchProfiles();
        }
      } else {
        // Create Mode
        if (dbError) {
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
          // 1. Sign up user using temp supabase client
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
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal menyimpan pengguna: ${err.message}`, 'error');
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

  const handleTogglePermission = async (roleKey: string, menuKey: string, currentAllowed: boolean) => {
    const newAllowed = !currentAllowed;

    // Build next state locally
    const updated = rolePermissions.map(p => {
      if (p.role === roleKey && p.menu_key === menuKey) {
        return { ...p, is_allowed: newAllowed };
      }
      return p;
    });

    const exists = rolePermissions.some(p => p.role === roleKey && p.menu_key === menuKey);
    const nextPerms = exists 
      ? updated 
      : [...rolePermissions, { role: roleKey, menu_key: menuKey, is_allowed: newAllowed }];

    setRolePermissions(nextPerms);

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });

    try {
      if (dbError) {
        localStorage.setItem('demo_role_permissions', JSON.stringify(nextPerms));
        Toast.fire({
          icon: 'success',
          title: `Akses '${menuKey}' untuk '${roleKey}' diperbarui`
        });
      } else {
        // Insert/Update database
        const { error } = await supabase
          .from('role_permissions')
          .upsert([{
            role: roleKey,
            menu_key: menuKey,
            is_allowed: newAllowed
          }], { onConflict: 'role,menu_key' });

        if (error) throw error;
        
        Toast.fire({
          icon: 'success',
          title: `Akses '${menuKey}' untuk '${roleKey}' diperbarui`
        });
        fetchPermissions();
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal mengubah izin akses: ${err.message}`, 'error');
      fetchPermissions();
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
            Silakan jalankan query SQL berikut di <strong>SQL Editor Supabase</strong> Anda untuk memperbarui tabel profil &amp; izin role:
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
        {/* Left Column: Form Add / Edit User */}
        <div className={`${styles.card} glass-panel`}>
          <h3>{editingId ? '✏️ Edit Pengguna' : '➕ Registrasi Pengguna'}</h3>
          <form onSubmit={handleSubmitUser} className={styles.form}>
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

            {!editingId && (
              <div className={styles.formGroup}>
                <label>Password (Min. 6 Karakter)</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingId}
                />
              </div>
            )}

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
              {submitLoading ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Daftarkan Pengguna')}
            </button>

            {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '4px' }}
              >
                Batal Edit
              </button>
            )}
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
                        <div className={styles.actionCell}>
                          <button 
                            onClick={() => handleStartEdit(profile)} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProfile(profile.id)} 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            disabled={profile.id === currentUserSession?.user?.id}
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

      {/* Role Permissions Section */}
      <div className={`${styles.card} glass-panel`} style={{ marginTop: '24px' }}>
        <h3>⚙️ Atur Izin Akses Menu per Role</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-12px' }}>
          Gunakan tombol toggle di bawah ini untuk mengatur hak akses menu. Perubahan langsung disimpan dan memengaruhi tampilan dashboard staf.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '16px' }}>
          {['admin', 'pharmacist', 'cashier'].map(r => (
            <div key={r} className={styles.roleCard}>
              <div className={styles.roleCardHeader}>
                <span className={styles.roleCardTitle}>
                  {r === 'admin' ? '👑 Admin' : r === 'pharmacist' ? '🔬 Apoteker' : '💵 Kasir'}
                </span>
                <span className={styles.badge} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                  {r}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'pos', label: 'Layar Kasir (POS)', icon: '🛒' },
                  { key: 'inventory', label: 'Gudang & Inventaris', icon: '📦' },
                  { key: 'controlled_logs', label: 'Register Narkotika', icon: '📝' },
                  { key: 'reports', label: 'Laporan & Analitik', icon: '📊' },
                  { key: 'discounts', label: 'Pengaturan Diskon', icon: '🏷️' },
                  { key: 'users', label: 'Manajemen Pengguna', icon: '👥' }
                ].map(m => {
                  const matched = rolePermissions.find(p => p.role === r && p.menu_key === m.key);
                  const isAllowed = matched ? matched.is_allowed : (r === 'admin');
                  const isDisabled = r === 'admin' && (m.key === 'users' || m.key === 'pos');
                  
                  return (
                    <div 
                      key={m.key} 
                      className={`${styles.permRow} ${isDisabled ? styles.permRowDisabled : ''}`}
                    >
                      <div className={styles.permMeta}>
                        <span className={styles.permIcon}>{m.icon}</span>
                        <span className={styles.permLabel}>{m.label}</span>
                      </div>
                      
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={isAllowed}
                          disabled={isDisabled}
                          onChange={() => handleTogglePermission(r, m.key, isAllowed)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
