<div align="center">
  <h1>💊 POS Apotek Modern (Enterprise Edition)</h1>
  <p>Sistem Point of Sales, Inventory, dan Manajemen Pelayanan Kefarmasian Berbasis Monolith Modular.</p>

  ![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
  ![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
</div>

---

## 📌 Tentang Proyek
POS Apotek Modern adalah sebuah arsitektur piranti lunak (*software*) kelas *Enterprise* yang dirancang khusus untuk memenuhi standar pelayanan kefarmasian di Indonesia. Tidak hanya sekadar aplikasi kasir (POS) ritel biasa, sistem ini dilengkapi dengan kepatuhan audit farmasi, validasi apoteker (APJ), manajemen obat berisiko tinggi (LASA/High Alert), hingga siklus pengadaan (Procurement) skala besar.

Proyek ini dibangun dengan struktur **Monorepo** yang memisahkan antara `Back-End` (REST API) dan `Front-End` (UI/UX).

---

## 🚀 Fitur Utama & Modul (Sesuai PRD)

### 🛒 1. Modul POS Kasir (Penjualan)
- **Mesin Checkout FEFO:** Algoritma pemotongan stok otomatis berdasarkan *First Expired First Out*.
- **Hold & Recall Bill (Draft):** Fitur menyimpan struk sementara untuk pasien yang lupa membawa uang atau kembali mencari barang, tanpa mengganggu antrean kasir lain.
- **Kalkulasi Finansial Lanjut:** Mendukung perhitungan Pajak (PPN), Diskon Bertingkat, dan *Service Fee* resep secara otomatis.
- **Atomic Void (Batal Struk):** Sistem pembatalan/retur kasir aman yang otomatis mengembalikan stok ke rak (*Batch Rollback*) dan mencatat log pembatalan.

### 🩺 2. Modul Pelayanan Kefarmasian (Sangat Krusial)
- **Manajemen Racikan (Compound):** Fitur khusus untuk Apoteker meracik obat (puyer/kapsul/salep) dengan memotong stok fisik dari beberapa bahan baku (desimal) sekaligus.
- **Sistem Approval Resep (APJ):** Transaksi obat keras wajib melewati layer persetujuan (Approval) dari Apoteker Penanggung Jawab di sistem sebelum bisa dibayar di kasir.
- **Log Konseling Pasien (KIE):** Fitur pencatatan Komunikasi, Informasi, dan Edukasi untuk memenuhi standar akreditasi fasilitas kesehatan.

### 📦 3. Modul Inventory & Kepatuhan Farmasi
- **Manajemen Multi-Cabang & Rak:** Lacak persis di cabang mana dan di rak nomor berapa sebuah obat (*Batch*) diletakkan.
- **Flagging Obat Berisiko:** Indikator visual bawaan untuk peringatan obat LASA (*Look Alike Sound Alike*) dan *High Alert*.
- **Stock Opname Berjenjang:** Hitung fisik gudang tidak bisa diubah sepihak. Harus melewati status `Pending Approval` untuk disetujui Manajer/Owner agar mencegah manipulasi stok.

### 🚚 4. Modul Pengadaan Lengkap (Procurement)
- **Purchase Request (PR):** Usulan pembelian stok obat ke manajemen.
- **Purchase Order (PO):** Konversi usulan menjadi pesanan resmi ke *Supplier*/PBF dengan kalkulasi total tagihan.
- **Goods Receipt (Penerimaan Cerdas):** Penerimaan barang otomatis wajib mencatat nomor *Batch* dan *Expired Date* untuk menolak obat ilegal/kedaluwarsa.
- **Retur Pembelian:** Mengurangi stok dari rak secara otomatis jika ada pengembalian ke *Supplier*.

### 🔒 5. Keamanan & Audit Trail
- **Spatie Roles & Permissions:** Kontrol akses berjenjang (Kasir, Apoteker, Gudang, Owner).
- **Log Mutasi Stok:** Pencatatan setiap pergerakan sebutir obat (Masuk Pembelian, Keluar Kasir, Void, Retur, Racikan).
- **Audit Logs:** Perekaman otomatis ke *database* mengenai setiap perubahan konfigurasi, kapan, oleh siapa, dan dari IP mana.

---

## 📂 Struktur Repositori (Monorepo)

```text
POS-Apotek/
├── Back-End/         # Mesin Utama (Laravel 11+ / PHP 8.3) - REST API
├── Front-End/        # User Interface Modern (Next.js/React + TailwindCSS)
└── README.md         # Dokumentasi Repositori Utama
```

## 🛠️ Cara Menjalankan Backend (Developer)
1. Buka folder `Back-End/` di Terminal.
2. Jalankan `composer install`
3. Salin `.env.example` ke `.env` dan konfigurasikan *database* (MySQL).
4. Jalankan migrasi dan seeder awal:
   ```bash
   php artisan migrate:fresh --seed
   ```
5. Nyalakan server lokal:
   ```bash
   php artisan serve
   ```
6. **Bonus:** Anda bisa meng- *import* file `POS_Apotek_Postman_Collection.json` ke Postman Anda untuk melihat daftar API dan payload-nya secara langsung!

---
*Dibuat untuk merevolusi manajemen tata kelola fasilitas apotek modern secara digital.* 🚀
