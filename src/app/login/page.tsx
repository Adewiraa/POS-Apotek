'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Tarik profile untuk mendapatkan role pengguna dari Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user?.id)
        .single();

      const role = profile?.role || 'cashier';
      document.cookie = `demo_role=${role}; path=/; max-age=86400`;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Silakan periksa kembali email & password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'pharmacist' | 'cashier') => {
    setLoading(true);
    setError(null);
    try {
      const email = role === 'admin' 
        ? 'admin@demo.com' 
        : 'kasir@demo.com';

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123',
      });

      if (authError) throw authError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user?.id)
        .single();

      const userRole = role; // Tetap gunakan role yang diminta untuk RBAC demo
      const userName = role === 'admin' ? 'Ade Wiramiharja (Admin)' : role === 'pharmacist' ? 'Apoteker Jaka' : 'Kasir Rina';

      localStorage.setItem('demo_session', JSON.stringify({
        user: { id: data.user?.id, email: data.user?.email },
        role: userRole,
        name: userName
      }));

      document.cookie = `demo_role=${userRole}; path=/; max-age=86400`;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan login demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.header}>
          <div className={styles.logoCircle}>
            <span className={styles.logoIcon}>💊</span>
          </div>
          <h1>Apotek Modern POS</h1>
          <p>Kelola penjualan, resep, dan inventaris obat secara efisien</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="nama@apotek.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>ATAU MASUK SEBAGAI DEMO</span>
        </div>

        <div className={styles.demoButtons}>
          <button onClick={() => handleDemoLogin('admin')} className="btn btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}>
            👑 Admin
          </button>
          <button onClick={() => handleDemoLogin('pharmacist')} className="btn btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}>
            🔬 Apoteker
          </button>
          <button onClick={() => handleDemoLogin('cashier')} className="btn btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}>
            💵 Kasir
          </button>
        </div>
      </div>
    </div>
  );
}
