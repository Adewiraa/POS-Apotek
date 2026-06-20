# 💊 Apotek ApoGo - Sistem Kasir & Inventaris Pintar

Apotek ApoGo adalah aplikasi Point of Sale (POS) dan manajemen apotek modern yang dirancang untuk membantu apoteker dan kasir mengelola penjualan obat, pencatatan resep dokter, pelacakan inventaris obat berbasis metode FEFO (First Expired First Out), laporan keuangan, serta manajemen staf menggunakan Role-Based Access Control (RBAC) secara efisien dan real-time.

---

## 🌟 Fitur Utama

### 1. 📊 Dasbor Utama & Real-Time Analytics
* **Live Stats**: Tampilan ringkas omset harian, jumlah resep dokter aktif, stok obat kritis (hampir habis), dan peringatan obat kedalawarsa.
* **Expired & Stock Alert**: Notifikasi otomatis untuk mencegah penjualan obat kedaluwarsa dan kehabisan stok.
* **Grafik Interaktif**: Analisis tren pendapatan bulanan untuk memudahkan pengambilan keputusan bisnis.

### 2. 🛒 Point of Sale (POS) / Kasir Pintar
* **Metode Transaksi**: Mendukung transaksi **Umum** dan transaksi **Resep Dokter** secara dinamis.
* **Pencarian Cepat**: Cari obat berdasarkan nama atau kode obat dengan kalkulasi subtotal instan.
* **Promo & Diskon Otomatis**: Integrasi otomatis dengan aturan diskon dinamis yang berlaku berdasarkan minimal belanja.
* **Struk Belanja Fisik**: Cetak struk pembelian dalam tata letak thermal 58mm untuk transaksi kasir fisik.

### 3. 📦 Manajemen Gudang & Inventaris (FEFO)
* **Pelacakan Expired Date**: Menyusun urutan penjualan obat berdasarkan tanggal kedaluwarsa terdekat menggunakan metode **FEFO** (*First Expired First Out*).
* **Klasifikasi Obat**: Pengelompokan obat berdasarkan Golongan Obat (Biasa, Prekursor, Narkotika, Psikotropika) dan Rak Penyimpanan.
* **Stok Minimum**: Batas stok yang dapat disesuaikan untuk memicu peringatan otomatis jika persediaan menipis.

### 4. 📝 Register Narkotika & Psikotropika (Controlled Drugs)
* **Pencatatan Terlacak**: Pengawasan khusus untuk keluar-masuk obat golongan narkotika dan psikotropika.
* **Resep Terverifikasi**: Validasi resep dokter sebelum obat golongan terlarang/terbatas dapat terjual.
* **Ekspor Pelaporan**: Ekspor log obat terkendali ke format CSV/Excel untuk mempermudah pelaporan regulasi ke Dinas Kesehatan / platform SatuSehat.

### 5. 🏷️ Pengaturan Diskon Dinamis (Discount Rules)
* **Event Diskon**: Pembuatan promo belanja dengan minimal pembelian dan persentase diskon kustom.
* **Masa Berlaku**: Pengaturan tanggal mulai dan berakhirnya promo.
* **Status Promo**: Aktifkan atau nonaktifkan aturan promo secara instan melalui switch toggle.

### 6. 👥 Manajemen Staf & Izin Akses (RBAC)
* **Sistem Login Username**: Autentikasi modern yang praktis tanpa perlu mengetikkan alamat email lengkap saat login.
* **Role-Based Access Control**: Pembatasan menu bawaan untuk 3 role utama:
  * **👑 Admin**: Akses penuh ke seluruh sistem termasuk hak akses dan manajemen staf.
  * **🔬 Apoteker**: Akses ke POS, Stok Obat, Registrasi Narkotika, Retur, Pengadaan, dan Alerts.
  * **💵 Kasir**: Akses terbatas ke POS dan Retur Obat.
* **Dinamis Izin Akses**: Admin dapat menyesuaikan hak akses menu masing-masing role secara real-time langsung melalui antarmuka visual (toggle UI).

---

## 🛠️ Stack Teknologi

Aplikasi ini dibangun menggunakan teknologi mutakhir untuk memastikan performa yang cepat, aman, dan responsif:

* **Frontend Framework**: [Next.js 15](https://nextjs.org/) (React 19 & TypeScript)
* **Styling**: Vanilla CSS (dilengkapi dengan panel transparan glassmorphism, adaptif tema terang, dan efek mikro-animasi premium)
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth)
* **Library Pendukung**:
  * [SweetAlert2](https://sweetalert2.github.io/) (Untuk modal dialog interaktif & notifikasi)
  * [Lucide React](https://lucide.dev/) (Koleksi ikon UI modern)

---

## 🚀 Panduan Memulai (Instalasi Lokal)

### 1. Prasyarat
Pastikan komputer Anda sudah terinstal:
* [Node.js](https://nodejs.org/) (Rekomendasi versi 18 atau lebih baru)
* Akun [Supabase](https://supabase.com/) untuk database cloud

### 2. Kloning Project & Install Dependensi
```bash
git clone https://github.com/Adewiraa/POS-Apotek.git
cd POS-Apotek
npm install
```

### 3. Konfigurasi Environment Variables
Buat file baru bernama `.env.local` di direktori utama (root) proyek dan isi kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Menjalankan Server Lokal
Jalankan development server:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat aplikasi berjalan.

---

## 💾 Setup Database Supabase

Untuk menjalankan aplikasi secara utuh dengan integrasi database, silakan salin dan eksekusi skrip SQL dari file berikut di menu **SQL Editor** pada dashboard Supabase Anda:

* **`database_setup.sql`**: Menginisialisasi seluruh tabel (`profiles`, `role_permissions`, `discounts`, `alert_settings`, `purchase_orders`, `purchase_order_items`, `drug_returns`), mengonfigurasi Row Level Security (RLS) beserta hak akses API, membuat trigger otomatis untuk sinkronisasi registrasi staf (`auth.users` ke `profiles`), serta menanam data izin akses role default.

---

## 👥 Akun Akses Default (Login)

Gunakan kredensial berikut untuk menguji sistem dengan berbagai tingkat hak akses:

| Peran (Role) | Username | Password | Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **👑 Administrator** | `admin` | `password123` | Hak penuh untuk merubah sistem & perizinan staf. |
| **🔬 Apoteker** | `apoteker` | `password123` | Mengelola resep obat, stok obat, & log narkotika. |
| **💵 Staf Kasir** | `kasir` | `password123` | Fokus pada transaksi belanja pelanggan & cetak struk. |

---
*Dikembangkan dengan penuh dedikasi untuk efisiensi operasional apotek modern.* 💊
