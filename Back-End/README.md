# ⚙️ POS Apotek Modern - REST API (Backend)

Selamat datang di mesin utama (*core engine*) dari POS Apotek Modern. Proyek Backend ini dibangun menggunakan **Laravel 13** dan berfokus pada penyediaan *RESTful API* yang cepat, aman, dan dapat diandalkan untuk digunakan oleh aplikasi *Frontend* (React/Vue/Mobile).

## 💡 Arsitektur & Teknologi
- **Framework:** Laravel 13 (PHP 8.3)
- **Database:** MySQL
- **Pola Desain:** *Service Repository Pattern* (Logika bisnis dipisahkan dari Controller ke dalam folder `app/Services/` untuk menjaga kode tetap bersih dan *scalable*).
- **Format Respons:** Standar JSON API.

---

## 🚀 Fitur Teknis Backend

Backend ini membagi layanannya ke dalam beberapa modul utama yang melayani *endpoint* spesifik:

### 1. Modul POS Kasir (Penjualan)
Modul ini menangani seluruh logika transaksi di meja depan.
- **`CheckoutService`:** Menghitung total harga, pajak, diskon, dan otomatis memotong stok barang dari rak dengan metode **FEFO** (Barang yang kedaluwarsanya paling dekat akan dipotong lebih dulu).
- **Hold Transaction:** Menyimpan data transaksi (*Draft*) ke dalam database jika pelanggan menunda pembayaran (kasir sibuk).
- **`VoidService` (Pembatalan Aman):** Menangani algoritma kompleks untuk mengembalikan (*rollback*) jumlah stok obat secara presisi ke tabel `product_batches` apabila terjadi pembatalan struk atau retur kasir.

### 2. Modul Pelayanan Kefarmasian
Modul ini menangani logika khusus Apotek yang tidak ada di aplikasi ritel biasa.
- **Racikan (Compound):** Endpoint khusus untuk meracik resep. *Backend* secara otomatis membagi 1 produk puyer menjadi pemotongan proporsional (desimal) ke banyak bahan baku sekaligus.
- **Validasi Resep:** Logika *State Machine* di mana resep masuk sebagai `Draft`, divalidasi oleh Apoteker menjadi `Approved`, dan baru bisa dieksekusi pembayarannya.
- **Konseling Pasien:** Tabel dan *endpoint* terdedikasi untuk mencatat log Komunikasi Informasi & Edukasi (KIE) antara apoteker dan pasien.

### 3. Modul Inventory & Kepatuhan
Mengelola pergerakan stok secara aman dan terkontrol.
- **Multi-Location:** Relasi database mendukung banyak cabang dan banyak rak (`branches` & `locations`).
- **Stock Opname (Penyesuaian Stok):** Fitur hitung fisik *inventory* yang menerapkan lapisan otorisasi. Data yang diinput hanya tersimpan sebagai *Draft*, lalu harus disetujui (Approve) melalui endpoint `/api/inventory/stock-opname/{id}/approve` sebelum stok aslinya berubah.
- **Label Keamanan:** Database `products` memiliki kolom `is_lasa` dan `is_high_alert` untuk *flagging* obat berisiko.

### 4. Modul Pengadaan (Procurement)
Menangani siklus rantai pasok ke Pedagang Besar Farmasi (PBF).
- **Alur Lengkap:** Mulai dari pembuatan *Purchase Request* (PR), Konversi ke *Purchase Order* (PO), hingga Penerimaan Barang (*Goods Receipt*).
- **Keamanan Penerimaan:** Logika *Backend* akan melempar *error* apabila staf mencoba menerima stok sediaan farmasi tanpa memasukkan *Batch Number* dan *Expired Date*.
- **Retur Supplier:** Mengurangi stok rak secara otomatis apabila ada barang rusak yang dikembalikan ke PBF.

### 5. Audit Trail & Log Mutasi
Sistem tidak pernah menghapus pergerakan barang secara gaib.
- Tabel `stock_mutations` akan mencatat setiap satuan barang yang masuk atau keluar dengan detail tipe mutasi (`in_purchase`, `out_sale`, `out_return`, dll).
- Tabel `audit_logs` bertindak sebagai kamera pengawas sistem yang merekam setiap *endpoint* kritis: kapan tereksekusi, *User ID* siapa, perubahan nilai datanya (*old_values* & *new_values*), serta *IP Address*.

---

## 🛠️ Instalasi & Dokumentasi API

Untuk menjalankan *server* lokal dan melihat daftar *endpoint* secara lengkap, silakan muat (*import*) file **Postman Collection** yang telah disediakan di root direktori proyek (`POS_Apotek_Postman_Collection.json`).

```bash
# 1. Install dependensi
composer install

# 2. Setup environment
cp .env.example .env
php artisan key:generate

# 3. Jalankan migrasi database
php artisan migrate:fresh --seed

# 4. Nyalakan server
php artisan serve
```
