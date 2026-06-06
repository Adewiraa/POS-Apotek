# Front-End POS Apotek

Proyek Front-End untuk Sistem Point of Sale (POS) Apotek Modern, dibangun menggunakan Next.js (App Router), React, Tailwind CSS, dan komponen antarmuka yang elegan. Sistem ini dirancang dengan tema "Premium Light" yang modern, responsif, dan memberikan pengalaman pengguna (*User Experience*) kelas atas.

## Fitur Utama
- **Dashboard & Analitik:** Ringkasan statistik performa apotek, total omzet, grafik penjualan, dan metrik operasional lainnya (didukung oleh Recharts).
- **Master Produk & Inventori:** Manajemen data obat dan alat kesehatan yang komprehensif, pencarian produk cepat, manajemen stok dan batch, serta alur barang masuk dan stock opname.
- **POS Kasir:** Antarmuka titik penjualan (Point of Sale) yang mulus dengan tema gelap khusus pada panel pembayaran untuk memberikan kontras yang mewah, mendukung berbagai metode pembayaran.
- **Manajemen Resep:** Modul untuk mengelola resep dokter, validasi oleh apoteker, serta pencetakan etiket / label obat secara otomatis.
- **Retur Barang:** Pengelolaan retur penjualan dari pelanggan dan retur pengadaan ke Supplier/PBF.
- **Integrasi SATUSEHAT:** Modul persiapan untuk mapping *KFA Code* dan pelaporan transaksi elektronik ke platform SATUSEHAT Kementerian Kesehatan.

## Teknologi Utama
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **State Management & Fetching:** Axios, Zustand (opsional jika digunakan nanti)

## Persyaratan Sistem
Pastikan perangkat Anda sudah terinstal:
- Node.js (v18 atau yang lebih baru direkomendasikan)
- `pnpm` (direkomendasikan) atau `npm` / `yarn`

## Cara Memulai (Development)

1. Clone repositori ini.
2. Masuk ke direktori `Front-End`:
   ```bash
   cd Front-End
   ```
3. Install semua dependencies:
   ```bash
   pnpm install
   ```
4. Jalankan server *development*:
   ```bash
   pnpm dev
   ```
5. Buka `http://localhost:3000` di peramban web Anda.

## Struktur Folder Utama
- `src/app/` - Semua rute aplikasi menggunakan App Router Next.js (mis. `(dashboard)`, `(inventory)`, `(pos)`, dll.)
- `src/components/` - Komponen React yang dapat digunakan kembali, termasuk komponen layout utama (`AppLayout`).
- `src/lib/` - Kumpulan utilitas pendukung dan integrasi API (`api.ts`).

## Tim & Kontributor
Dikembangkan sebagai bagian dari solusi Manajemen POS Apotek Modern Terintegrasi.
