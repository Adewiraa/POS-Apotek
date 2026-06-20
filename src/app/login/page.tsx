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
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        // Search profiles for email prefix
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .ilike('email', `${loginEmail}@%`)
            .limit(1)
            .maybeSingle();
          if (profile?.email) {
            loginEmail = profile.email;
          } else {
            loginEmail = `${loginEmail}@apotek.com`;
          }
        } catch (_) {
          loginEmail = `${loginEmail}@apotek.com`;
        }
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
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

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Silakan periksa kembali username & password Anda.');
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

      let userId = data?.user?.id;
      let userEmail = data?.user?.email;

      if (authError) {
        console.warn('Supabase Auth error during demo login, falling back to local simulation:', authError.message);
        userId = role === 'admin' ? '8f3699a5-8500-45b6-8c22-1037211f23e0' : 'e9add0ab-42ac-47c3-a554-97d3f80960d5';
        userEmail = email;
      }

      const userRole = role; 
      const userName = role === 'admin' ? 'Ade Wiramiharja (Admin)' : role === 'pharmacist' ? 'Apoteker Jaka' : 'Kasir Rina';

      localStorage.setItem('demo_session', JSON.stringify({
        user: { id: userId, email: userEmail },
        role: userRole,
        name: userName
      }));

      document.cookie = `demo_role=${userRole}; path=/; max-age=86400`;
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Total fallback active:', err);
      const userId = role === 'admin' ? '8f3699a5-8500-45b6-8c22-1037211f23e0' : 'e9add0ab-42ac-47c3-a554-97d3f80960d5';
      localStorage.setItem('demo_session', JSON.stringify({
        user: { id: userId, email: role === 'admin' ? 'admin@demo.com' : 'kasir@demo.com' },
        role: role,
        name: role === 'admin' ? 'Ade Wiramiharja (Admin)' : role === 'pharmacist' ? 'Apoteker Jaka' : 'Kasir Rina'
      }));
      document.cookie = `demo_role=${role}; path=/; max-age=86400`;
      window.location.href = '/dashboard';
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
          <h1>Apotek ApoGo</h1>
          <p>Kelola penjualan, resep, dan inventaris obat secara efisien</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Username</label>
            <input
              id="email"
              type="text"
              className="input-field"
              placeholder="Contoh: admin, kasir, apoteker"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`input-field ${styles.passwordInput}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}
