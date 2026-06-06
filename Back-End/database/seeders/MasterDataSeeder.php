<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Kategori Obat
        $categories = [
            ['name' => 'Obat Bebas', 'description' => 'Obat yang dapat dibeli bebas tanpa resep', 'is_active' => true],
            ['name' => 'Obat Bebas Terbatas', 'description' => 'Obat bebas dengan batasan aturan pakai', 'is_active' => true],
            ['name' => 'Obat Keras', 'description' => 'Obat yang memerlukan resep dokter', 'is_active' => true],
            ['name' => 'Vitamin & Suplemen', 'description' => 'Nutrisi tambahan', 'is_active' => true],
            ['name' => 'Alat Kesehatan', 'description' => 'Peralatan medis', 'is_active' => true],
        ];

        foreach ($categories as $cat) {
            \App\Models\Master\Category::create($cat);
        }

        // 2. Satuan
        $units = [
            ['name' => 'Tablet', 'short_name' => 'Tab'],
            ['name' => 'Kapsul', 'short_name' => 'Kap'],
            ['name' => 'Strip', 'short_name' => 'Str'],
            ['name' => 'Box', 'short_name' => 'Box'],
            ['name' => 'Botol', 'short_name' => 'Btl'],
            ['name' => 'Sachet', 'short_name' => 'Sct'],
        ];

        foreach ($units as $unit) {
            \App\Models\Master\Unit::create($unit);
        }

        // 3. Supplier / PBF
        $suppliers = [
            ['name' => 'PBF Enseval', 'type' => 'PBF Utama', 'contact' => '081234567890', 'address' => 'Jl. Kebon Jeruk No. 12', 'is_active' => true],
            ['name' => 'APL (Anugerah Pharmindo Lestari)', 'type' => 'PBF Utama', 'contact' => '081987654321', 'address' => 'Jl. Sudirman No. 99', 'is_active' => true],
            ['name' => 'Distributor Alkes Mandiri', 'type' => 'Distributor Alkes', 'contact' => '08111222333', 'address' => 'Kawasan Industri Cikarang', 'is_active' => true],
        ];

        foreach ($suppliers as $supplier) {
            \App\Models\Master\Supplier::create($supplier);
        }

        // 4. Products
        $products = [
            [
                'barcode' => '899990123456',
                'name' => 'Panadol Biru',
                'generic_name' => 'Paracetamol 500mg',
                'category_id' => 1, // Obat Bebas
                'unit_id' => 3, // Strip
                'classification' => 'Obat Bebas',
                'selling_price' => 12000,
                'purchase_price' => 10000,
                'min_stock' => 10,
                'is_active' => true
            ],
            [
                'barcode' => '899990654321',
                'name' => 'Amoxsan 500mg',
                'generic_name' => 'Amoxicillin 500mg',
                'category_id' => 3, // Obat Keras
                'unit_id' => 3, // Strip
                'classification' => 'Obat Keras',
                'selling_price' => 35000,
                'purchase_price' => 28000,
                'min_stock' => 5,
                'is_active' => true
            ],
            [
                'barcode' => '899123456789',
                'name' => 'Promag',
                'generic_name' => 'Hydrotalcite, Magnesuim Hydroxide, Simethicone',
                'category_id' => 1, // Obat Bebas
                'unit_id' => 3, // Strip
                'classification' => 'Obat Bebas',
                'selling_price' => 9000,
                'purchase_price' => 7500,
                'min_stock' => 20,
                'is_active' => true
            ]
        ];

        foreach ($products as $prod) {
            \App\Models\Master\Product::create($prod);
        }

        // 5. Product Batches (Initial Stock)
        $batches = [
            [
                'product_id' => 1, // Panadol
                'batch_no' => 'BCH-PND-001',
                'expired_date' => now()->addYears(2),
                'supplier_id' => 1,
                'qty_available' => 50,
                'status' => 'Active'
            ],
            [
                'product_id' => 2, // Amoxsan
                'batch_no' => 'BCH-AMX-001',
                'expired_date' => now()->addMonths(18),
                'supplier_id' => 2,
                'qty_available' => 30,
                'status' => 'Active'
            ],
            [
                'product_id' => 3, // Promag
                'batch_no' => 'BCH-PRM-001',
                'expired_date' => now()->addYears(3),
                'supplier_id' => 1,
                'qty_available' => 100,
                'status' => 'Active'
            ]
        ];

        foreach ($batches as $batch) {
            \App\Models\Inventory\ProductBatch::create($batch);
        }
    }
}
