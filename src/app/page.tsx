'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function EntryPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Periksa sesi riil Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      // Periksa sesi demo lokal
      const demoSession = localStorage.getItem('demo_session');

      if (session || demoSession) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner}></div>
        <h1 className="animate-pulse-slow">Apotek Modern POS</h1>
        <p>Menyiapkan ruang kerja kasir & inventaris...</p>
      </div>
    </div>
  );
}
