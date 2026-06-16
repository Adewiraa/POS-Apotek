'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './alerts.module.css';
import Swal from 'sweetalert2';

interface AlertSettings {
  id?: string;
  email_enabled: boolean;
  email_recipient: string;
  whatsapp_enabled: boolean;
  whatsapp_recipient: string;
  low_stock_threshold: number;
  expiry_months_threshold: number;
}

interface WarningItem {
  id: string;
  type: 'out_of_stock' | 'low_stock' | 'expiring' | 'expired';
  name: string;
  detail: string;
  badgeText: string;
  isCritical: boolean;
}

export default function AlertsPage() {
  const router = useRouter();
  
  const [settings, setSettings] = useState<AlertSettings>({
    email_enabled: false,
    email_recipient: '',
    whatsapp_enabled: false,
    whatsapp_recipient: '',
    low_stock_threshold: 10,
    expiry_months_threshold: 3
  });

  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch alert settings and scan stock/expiry warnings
  const fetchData = async (currentSettings?: AlertSettings) => {
    setLoading(true);
    try {
      // 1. Fetch settings from DB
      let activeSettings = currentSettings;
      if (!activeSettings) {
        const { data, error } = await supabase
          .from('alert_settings')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          // If no row is present but connection is OK, we will create/seed it later
          throw error;
        }

        activeSettings = {
          id: data.id,
          email_enabled: data.email_enabled,
          email_recipient: data.email_recipient || '',
          whatsapp_enabled: data.whatsapp_enabled,
          whatsapp_recipient: data.whatsapp_recipient || '',
          low_stock_threshold: data.low_stock_threshold || 10,
          expiry_months_threshold: data.expiry_months_threshold || 3
        };
        setSettings(activeSettings);
      }

      // 2. Fetch drug batches with drugs join to analyze warnings
      const { data: batches, error: batchError } = await supabase
        .from('drug_batches')
        .select(`
          id,
          batch_number,
          expiry_date,
          stock,
          drugs (
            name,
            unit
          )
        `) as any;

      if (batchError) throw batchError;

      generateWarnings(batches || [], activeSettings);
      setDbError(false);
    } catch (err: any) {
      console.warn('Gagal memuat setting dari DB, beralih ke simulasi:', err.message);
      setDbError(true);

      // Load simulated settings
      let localSettings: AlertSettings = {
        email_enabled: true,
        email_recipient: 'apoteker.adewira@example.com',
        whatsapp_enabled: true,
        whatsapp_recipient: '081234567890',
        low_stock_threshold: 10,
        expiry_months_threshold: 3
      };

      const localStr = localStorage.getItem('demo_alert_settings');
      if (localStr) {
        localSettings = JSON.parse(localStr);
      } else {
        localStorage.setItem('demo_alert_settings', JSON.stringify(localSettings));
      }
      setSettings(localSettings);

      // Fetch simulated batches
      const localBatches = localStorage.getItem('demo_batches');
      const batchesList = localBatches ? JSON.parse(localBatches) : [
        { id: 'b1', batch_number: 'ALP9922', expiry_date: '2026-08-15', stock: 4, drug_id: '1' }
      ];
      const localDrugs = localStorage.getItem('demo_drugs');
      const drugsList = localDrugs ? JSON.parse(localDrugs) : [
        { id: '1', name: 'Alprazolam 0.5mg', unit: 'Tablet' }
      ];

      // Join local data
      const joined = batchesList.map((b: any) => {
        const d = drugsList.find((dr: any) => dr.id === b.drug_id);
        return {
          id: b.id,
          batch_number: b.batch_number,
          expiry_date: b.expiry_date,
          stock: b.stock,
          drugs: d ? { name: d.name, unit: d.unit } : { name: 'Obat', unit: 'Pcs' }
        };
      });

      generateWarnings(joined, localSettings);
    } finally {
      setLoading(false);
    }
  };

  const generateWarnings = (batchesList: any[], activeSettings: AlertSettings) => {
    const list: WarningItem[] = [];
    const now = new Date();
    
    // Threshold date logic
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() + activeSettings.expiry_months_threshold);

    batchesList.forEach((b: any) => {
      const drugName = b.drugs?.name || 'Obat';
      const unit = b.drugs?.unit || 'Pcs';
      const stock = b.stock;
      const expiry = new Date(b.expiry_date);

      // Check stock
      if (stock === 0) {
        list.push({
          id: `stk-out-${b.id}`,
          type: 'out_of_stock',
          name: drugName,
          detail: `Stok obat habis total. Silakan hubungi distributor.`,
          badgeText: '🚫 HABIS',
          isCritical: true
        });
      } else if (stock <= activeSettings.low_stock_threshold) {
        list.push({
          id: `stk-low-${b.id}`,
          type: 'low_stock',
          name: drugName,
          detail: `Stok menipis: sisa ${stock} ${unit} (Batch: ${b.batch_number}).`,
          badgeText: `⚠️ SISA ${stock}`,
          isCritical: false
        });
      }

      // Check expiry
      if (expiry <= now) {
        list.push({
          id: `exp-over-${b.id}`,
          type: 'expired',
          name: `${drugName} (Batch: ${b.batch_number})`,
          detail: `TELAH KADALUARSA sejak tanggal ${b.expiry_date}! Pindahkan dari rak!`,
          badgeText: '💀 EXPIRED',
          isCritical: true
        });
      } else if (expiry <= limitDate) {
        const monthsRemaining = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
        list.push({
          id: `exp-near-${b.id}`,
          type: 'expiring',
          name: `${drugName} (Batch: ${b.batch_number})`,
          detail: `Kadaluarsa pada ${b.expiry_date} (~${monthsRemaining.toFixed(1)} bulan lagi).`,
          badgeText: `⌛ ${monthsRemaining.toFixed(1)} BLN`,
          isCritical: monthsRemaining <= 1
        });
      }
    });

    setWarnings(list);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (dbError) {
        localStorage.setItem('demo_alert_settings', JSON.stringify(settings));
        Swal.fire('Simulasi Disimpan', 'Pengaturan alert berhasil diperbarui di penyimpanan lokal.', 'success');
        fetchData(settings);
      } else {
        // Find existing settings row or create one
        const { data: checkRow } = await supabase
          .from('alert_settings')
          .select('id')
          .limit(1);

        if (checkRow && checkRow.length > 0) {
          const { error } = await supabase
            .from('alert_settings')
            .update({
              email_enabled: settings.email_enabled,
              email_recipient: settings.email_recipient,
              whatsapp_enabled: settings.whatsapp_enabled,
              whatsapp_recipient: settings.whatsapp_recipient,
              low_stock_threshold: settings.low_stock_threshold,
              expiry_months_threshold: settings.expiry_months_threshold,
              updated_at: new Date().toISOString()
            })
            .eq('id', checkRow[0].id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('alert_settings')
            .insert([settings]);

          if (error) throw error;
        }

        Swal.fire('Berhasil', 'Pengaturan alert email & WhatsApp berhasil diperbarui.', 'success');
        fetchData(settings);
      }
    } catch (err: any) {
      Swal.fire('Error', `Gagal menyimpan pengaturan: ${err.message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Trigger manual simulation of warnings sent via Email and WhatsApp
  const handleTriggerManualAlert = () => {
    if (warnings.length === 0) {
      Swal.fire('Kondisi Aman', 'Tidak ada obat yang menipis atau mendekati tanggal kadaluarsa saat ini.', 'success');
      return;
    }

    if (!settings.email_enabled && !settings.whatsapp_enabled) {
      Swal.fire('Peringatan Konfigurasi', 'Kedua jalur notifikasi (Email & WhatsApp) dalam keadaan nonaktif. Silakan aktifkan salah satu jalur terlebih dahulu.', 'warning');
      return;
    }

    // Build the payload preview
    const criticalList = warnings.filter(w => w.isCritical);
    const mediumList = warnings.filter(w => !w.isCritical);

    let contentHtml = `<div style="text-align: left; font-size: 13px; max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px;">`;
    
    if (settings.email_enabled) {
      contentHtml += `<strong>📧 Draft Payload Email (Dikirim ke: ${settings.email_recipient}):</strong><br/>`;
      contentHtml += `<span style="color: #6366f1;">Subject: 🚨 LAPORAN PERINGATAN OBAT APOTEK APOGO</span><br/>`;
      contentHtml += `------------------------------------------------------<br/>`;
      if (criticalList.length > 0) {
        contentHtml += `<strong style="color: #ef4444;">🔴 KRITIKAL (Habis / Expired):</strong><br/>`;
        criticalList.forEach(w => {
          contentHtml += `• ${w.name}: ${w.detail}<br/>`;
        });
      }
      if (mediumList.length > 0) {
        contentHtml += `<strong style="color: #f59e0b; display: block; margin-top: 8px;">🟡 PERINGATAN (Stok Tipis / Kadaluarsa Dekat):</strong>`;
        mediumList.forEach(w => {
          contentHtml += `• ${w.name}: ${w.detail}<br/>`;
        });
      }
      contentHtml += `<br/>`;
    }

    if (settings.whatsapp_enabled) {
      contentHtml += `<strong>📱 Draft Payload WhatsApp (Tujuan: ${settings.whatsapp_recipient}):</strong><br/>`;
      contentHtml += `------------------------------------------------------<br/>`;
      contentHtml += `*🚨 PERINGATAN APOTEK APOGO*\n`;
      if (criticalList.length > 0) {
        contentHtml += `*KRITIKAL:*\n`;
        criticalList.forEach(w => {
          contentHtml += `- ${w.name}: ${w.detail}\n`;
        });
      }
      if (mediumList.length > 0) {
        contentHtml += `\n*PERINGATAN:*\n`;
        mediumList.forEach(w => {
          contentHtml += `- ${w.name}: ${w.detail}\n`;
        });
      }
    }
    contentHtml += `</div>`;

    Swal.fire({
      title: '🚀 Simulasi Alert Terkirim!',
      html: `
        <div style="margin-bottom: 12px;">Sistem mensimulasikan cronjob harian dengan detail payload notifikasi di bawah ini:</div>
        ${contentHtml}
      `,
      icon: 'success',
      confirmButtonText: 'Selesai',
      confirmButtonColor: '#10b981'
    });
  };

  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.navLeft}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            ⬅️ Dashboard
          </button>
          <h2>Konfigurasi Notifikasi &amp; Alert Stok</h2>
        </div>
        <button onClick={handleTriggerManualAlert} className="btn btn-primary" style={{ padding: '8px 16px' }} disabled={warnings.length === 0}>
          🚀 Trigger Alert Harian (Simulasi)
        </button>
      </header>

      {dbError && (
        <div className={styles.warningBanner}>
          <div>
            <strong>⚠️ Tabel 'alert_settings' Belum Dikonfigurasi:</strong> Fitur berjalan dalam mode <strong>Simulasi Lokal (localStorage)</strong>.
            Guna menyinkronkan dengan database Supabase Anda, silakan jalankan SQL berikut di <strong>SQL Editor Supabase</strong> Anda:
          </div>
          <code>{`CREATE TABLE IF NOT EXISTS public.alert_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_enabled BOOLEAN DEFAULT false,
    email_recipient VARCHAR(255),
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_recipient VARCHAR(50),
    low_stock_threshold INTEGER DEFAULT 10,
    expiry_months_threshold INTEGER DEFAULT 3,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on alert settings" ON public.alert_settings FOR SELECT USING (true);
CREATE POLICY "Allow write on alert settings" ON public.alert_settings FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_settings TO anon, authenticated, service_role;

INSERT INTO public.alert_settings (email_enabled, email_recipient, whatsapp_enabled, whatsapp_recipient, low_stock_threshold, expiry_months_threshold)
VALUES (false, 'apoteker@example.com', false, '081234567890', 10, 3);`}</code>
          <div>
            Setelah selesai menjalankan query di atas pada database Supabase, silakan <strong>muat ulang halaman ini</strong>.
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Left Column: settings Form */}
        <div className={`${styles.card} glass-panel`}>
          <h3>⚙️ Integrasi Alert Settings</h3>
          <form onSubmit={handleSaveSettings} className={styles.form}>
            
            {/* Email Setting */}
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <span className={styles.toggleTitle}>📧 Notifikasi Email</span>
                <span className={styles.toggleDesc}>Kirim rekap stok menipis harian via SMTP.</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.email_enabled}
                  onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {settings.email_enabled && (
              <div className={styles.formGroup}>
                <label>Alamat Email Penerima</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="Contoh: apoteker@gmail.com"
                  value={settings.email_recipient}
                  onChange={(e) => setSettings({ ...settings, email_recipient: e.target.value })}
                  required
                />
              </div>
            )}

            {/* WhatsApp Setting */}
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <span className={styles.toggleTitle}>📱 Notifikasi WhatsApp</span>
                <span className={styles.toggleDesc}>Kirim pesan alert instan via WA Gateway.</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.whatsapp_enabled}
                  onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {settings.whatsapp_enabled && (
              <div className={styles.formGroup}>
                <label>Nomor WhatsApp Penerima (Format Internasional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={settings.whatsapp_recipient}
                  onChange={(e) => setSettings({ ...settings, whatsapp_recipient: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Threshold Settings */}
            <div className={styles.formGroup}>
              <label>Batas Stok Menipis (Threshold)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={settings.low_stock_threshold}
                onChange={(e) => setSettings({ ...settings, low_stock_threshold: Number(e.target.value) })}
                required
              />
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                Kirim alert jika stok batch obat berada di bawah nilai ini.
              </small>
            </div>

            <div className={styles.formGroup}>
              <label>Batas Tanggal Kadaluarsa (Bulan)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={settings.expiry_months_threshold}
                onChange={(e) => setSettings({ ...settings, expiry_months_threshold: Number(e.target.value) })}
                required
              />
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                Kirim alert jika tanggal kadaluarsa berjarak kurang dari X bulan.
              </small>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={submitLoading}>
              {submitLoading ? 'Menyimpan...' : 'Simpan Pengaturan Alert 💾'}
            </button>
          </form>
        </div>

        {/* Right Column: Scan Warnings list */}
        <div className={`${styles.card} glass-panel`}>
          <h3>🚨 Audit Peringatan Stok &amp; Expired Date Aktif ({warnings.length})</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-12px' }}>
            Daftar di bawah ini memuat obat-obatan yang butuh perhatian khusus (habis, stok kritis, atau mendekati tanggal kadaluarsa). Gunakan tombol Trigger di atas untuk mensimulasikan pengiriman notifikasi.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
          ) : (
            <div className={styles.warningSection}>
              {warnings.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                  🎉 Kondisi inventaris apotek dalam keadaan aman dan terkontrol.
                </div>
              ) : (
                warnings.map((w) => (
                  <div key={w.id} className={`${styles.warningCard} ${w.isCritical ? styles.warningCritical : styles.warningMedium}`}>
                    <div className={styles.warningInfo}>
                      <span className={styles.warningTitle}>{w.name}</span>
                      <span className={styles.warningMeta}>{w.detail}</span>
                    </div>
                    <span className={`${styles.warningBadge} ${w.isCritical ? styles.badgeRed : styles.badgeOrange}`}>
                      {w.badgeText}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
