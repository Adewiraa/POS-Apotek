<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardDemoSeeder extends Seeder
{
    /**
     * Seed data demo untuk dashboard:
     * - Sales hari ini & kemarin (Completed)
     * - Sale items (OTC dan Resep)
     * - Product batches yang stok kritis
     * - Product batches yang mendekati ED
     */
    public function run(): void
    {
        $today     = Carbon::today();
        $yesterday = Carbon::yesterday();

        // =========================================================
        // SALES HARI INI (untuk Omzet & Transaksi card)
        // =========================================================
        $salesHariIni = [
            // OTC sales (tanpa prescription_id)
            ['transaction_no' => 'TRX-' . $today->format('Ymd') . '-001', 'status' => 'Completed', 'total' => 12000,  'payment_method' => 'Cash', 'payment_status' => 'Paid', 'subtotal' => 12000, 'discount' => 0, 'created_at' => $today->copy()->setTime(8, 30)],
            ['transaction_no' => 'TRX-' . $today->format('Ymd') . '-002', 'status' => 'Completed', 'total' => 35000,  'payment_method' => 'Cash', 'payment_status' => 'Paid', 'subtotal' => 35000, 'discount' => 0, 'created_at' => $today->copy()->setTime(9, 15)],
            ['transaction_no' => 'TRX-' . $today->format('Ymd') . '-003', 'status' => 'Completed', 'total' => 9000,   'payment_method' => 'QRIS', 'payment_status' => 'Paid', 'subtotal' => 9000,  'discount' => 0, 'created_at' => $today->copy()->setTime(10, 0)],
            ['transaction_no' => 'TRX-' . $today->format('Ymd') . '-004', 'status' => 'Completed', 'total' => 48000,  'payment_method' => 'Cash', 'payment_status' => 'Paid', 'subtotal' => 48000, 'discount' => 0, 'created_at' => $today->copy()->setTime(10, 45)],
            ['transaction_no' => 'TRX-' . $today->format('Ymd') . '-005', 'status' => 'Completed', 'total' => 75000,  'payment_method' => 'Debit', 'payment_status' => 'Paid', 'subtotal' => 75000, 'discount' => 0, 'created_at' => $today->copy()->setTime(11, 20)],
        ];

        foreach ($salesHariIni as $sale) {
            DB::table('sales')->insert(array_merge($sale, [
                'updated_at' => $sale['created_at'],
            ]));
        }

        // =========================================================
        // SALES KEMARIN (untuk perbandingan % omzet)
        // Sengaja lebih kecil supaya ada kenaikan persentase
        // =========================================================
        $salesKemarin = [
            ['transaction_no' => 'TRX-' . $yesterday->format('Ymd') . '-001', 'status' => 'Completed', 'total' => 9000,  'payment_method' => 'Cash', 'payment_status' => 'Paid', 'subtotal' => 9000,  'discount' => 0, 'created_at' => $yesterday->copy()->setTime(8, 0)],
            ['transaction_no' => 'TRX-' . $yesterday->format('Ymd') . '-002', 'status' => 'Completed', 'total' => 35000, 'payment_method' => 'Cash', 'payment_status' => 'Paid', 'subtotal' => 35000, 'discount' => 0, 'created_at' => $yesterday->copy()->setTime(9, 0)],
            ['transaction_no' => 'TRX-' . $yesterday->format('Ymd') . '-003', 'status' => 'Completed', 'total' => 12000, 'payment_method' => 'QRIS', 'payment_status' => 'Paid', 'subtotal' => 12000, 'discount' => 0, 'created_at' => $yesterday->copy()->setTime(10, 0)],
        ];

        foreach ($salesKemarin as $sale) {
            DB::table('sales')->insert(array_merge($sale, [
                'updated_at' => $sale['created_at'],
            ]));
        }

        // =========================================================
        // PRODUCT BATCHES STOK KRITIS (qty_available <= min_stock)
        // min_stock Panadol=10, Amoxsan=5, Promag=20
        // Seeder MasterDataSeeder sudah buat batch normal.
        // Kita tambah produk baru dengan stok kritis.
        // =========================================================
        // Tambah 3 produk baru dengan stok rendah
        $criticalProductIds = [];
        $criticalProducts = [
            ['barcode' => 'CRIT-001', 'name' => 'Cetirizine 10mg', 'generic_name' => 'Cetirizine', 'category_id' => 3, 'unit_id' => 3, 'classification' => 'Obat Keras', 'selling_price' => 8000, 'purchase_price' => 6000, 'min_stock' => 20, 'is_active' => true],
            ['barcode' => 'CRIT-002', 'name' => 'Antasida Doen', 'generic_name' => 'Antasida', 'category_id' => 1, 'unit_id' => 3, 'classification' => 'Obat Bebas', 'selling_price' => 5000, 'purchase_price' => 3000, 'min_stock' => 15, 'is_active' => true],
            ['barcode' => 'CRIT-003', 'name' => 'Vitamin C 1000mg', 'generic_name' => 'Ascorbic Acid', 'category_id' => 4, 'unit_id' => 3, 'classification' => 'Suplemen', 'selling_price' => 25000, 'purchase_price' => 20000, 'min_stock' => 10, 'is_active' => true],
        ];

        foreach ($criticalProducts as $prod) {
            $id = DB::table('products')->insertGetId(array_merge($prod, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
            $criticalProductIds[] = $id;
        }

        // Batch dengan stok di bawah min_stock
        foreach ($criticalProductIds as $i => $productId) {
            DB::table('product_batches')->insert([
                'product_id'    => $productId,
                'batch_no'      => 'CRIT-BCH-00' . ($i + 1),
                'expired_date'  => now()->addYear(),
                'supplier_id'   => 1,
                'qty_available' => $i === 0 ? 0 : 3, // Cetirizine stok habis (high priority), lainnya sisa sedikit
                'status'        => 'Active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        // =========================================================
        // PRODUCT BATCHES MENDEKATI ED (≤ 90 hari)
        // =========================================================
        $nearExpiryBatches = [
            ['product_id' => 1, 'batch_no' => 'ED-BCH-001', 'expired_date' => now()->addDays(20),  'supplier_id' => 1, 'qty_available' => 15, 'status' => 'Active'], // < 30 hari → butuh FEFO
            ['product_id' => 2, 'batch_no' => 'ED-BCH-002', 'expired_date' => now()->addDays(45),  'supplier_id' => 2, 'qty_available' => 10, 'status' => 'Active'], // 30–90 hari
            ['product_id' => 3, 'batch_no' => 'ED-BCH-003', 'expired_date' => now()->addDays(75),  'supplier_id' => 1, 'qty_available' => 25, 'status' => 'Active'], // 30–90 hari
            ['product_id' => 1, 'batch_no' => 'ED-BCH-004', 'expired_date' => now()->addDays(15),  'supplier_id' => 1, 'qty_available' => 5,  'status' => 'Active'], // < 30 hari → butuh FEFO
        ];

        foreach ($nearExpiryBatches as $batch) {
            DB::table('product_batches')->insert(array_merge($batch, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
