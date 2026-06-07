<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\POS\Sale;
use App\Models\Master\Product;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/metrics
     * Mengembalikan data untuk 4 card dashboard:
     *   1. Omzet Hari Ini (+ perbandingan vs kemarin)
     *   2. Transaksi Hari Ini (+ breakdown OTC vs Resep)
     *   3. Stok Kritis (+ jumlah high priority / stok = 0)
     *   4. ED ≤ 90 Hari (+ jumlah yang butuh FEFO review)
     */
    public function getMetrics()
    {
        $today     = Carbon::today();
        $yesterday = Carbon::yesterday();

        // =========================================================
        // CARD 1: OMZET HARI INI
        // =========================================================
        $omsetHariIni = Sale::whereDate('created_at', $today)
            ->where('status', 'Completed')
            ->sum('total');

        $omsetKemarin = Sale::whereDate('created_at', $yesterday)
            ->where('status', 'Completed')
            ->sum('total');

        $omsetPersentase = $omsetKemarin > 0
            ? round((($omsetHariIni - $omsetKemarin) / $omsetKemarin) * 100, 1)
            : ($omsetHariIni > 0 ? 100.0 : 0.0);

        $omsetTrend = $omsetPersentase >= 0 ? 'up' : 'down';

        // =========================================================
        // CARD 2: TRANSAKSI HARI INI (Breakdown OTC vs Resep)
        // OTC  = transaksi tanpa prescription_id (null)
        // Resep = transaksi dengan prescription_id terisi
        // =========================================================
        $transaksiHariIni = Sale::whereDate('created_at', $today)
            ->where('status', 'Completed')
            ->count();

        // Cek apakah kolom prescription_id ada di tabel sales
        $hasRxColumn = DB::getSchemaBuilder()->hasColumn('sales', 'prescription_id');

        if ($hasRxColumn) {
            $transaksiOTC   = Sale::whereDate('created_at', $today)
                ->where('status', 'Completed')
                ->whereNull('prescription_id')
                ->count();
            $transaksiResep = Sale::whereDate('created_at', $today)
                ->where('status', 'Completed')
                ->whereNotNull('prescription_id')
                ->count();
        } else {
            // Fallback: semua dianggap OTC jika kolom belum ada
            $transaksiOTC   = $transaksiHariIni;
            $transaksiResep = 0;
        }

        // =========================================================
        // CARD 3: STOK KRITIS
        // High priority = produk dengan stok = 0 (habis total)
        // Normal kritis = stok > 0 tapi <= min_stock
        // =========================================================
        $criticalProducts = DB::table('products')
            ->leftJoin('product_batches', 'products.id', '=', 'product_batches.product_id')
            ->select(
                'products.id',
                'products.min_stock',
                DB::raw('COALESCE(SUM(product_batches.qty_available), 0) as total_qty')
            )
            ->where('products.is_active', true)
            ->groupBy('products.id', 'products.min_stock')
            ->havingRaw('COALESCE(SUM(product_batches.qty_available), 0) <= products.min_stock')
            ->get();

        $stokKritisTotal    = $criticalProducts->count();
        $stokKritisHighPrio = $criticalProducts->filter(fn($p) => $p->total_qty == 0)->count();

        // =========================================================
        // CARD 4: ED ≤ 90 HARI
        // Butuh FEFO review = batch yang ED < 30 hari (sangat mendesak)
        // =========================================================
        $edKurang90 = DB::table('product_batches')
            ->where('qty_available', '>', 0)
            ->where('expired_date', '<=', Carbon::now()->addDays(90))
            ->where('expired_date', '>=', Carbon::now())
            ->count();

        $edButuhFEFO = DB::table('product_batches')
            ->where('qty_available', '>', 0)
            ->where('expired_date', '<=', Carbon::now()->addDays(30))
            ->where('expired_date', '>=', Carbon::now())
            ->count();

        // =========================================================
        // 5. TREN PENJUALAN MINGGUAN (7 hari terakhir)
        // =========================================================
        $salesTrend = [];
        $daysMap = [
            'Sunday' => 'Min',
            'Monday' => 'Sen',
            'Tuesday' => 'Sel',
            'Wednesday' => 'Rab',
            'Thursday' => 'Kam',
            'Friday' => 'Jum',
            'Saturday' => 'Sab'
        ];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayNameEnglish = $date->format('l');
            $dayName = $daysMap[$dayNameEnglish] ?? substr($dayNameEnglish, 0, 3);
            
            $totalAmount = Sale::whereDate('created_at', $date)
                ->where('status', 'Completed')
                ->sum('total');

            $salesTrend[] = [
                'day' => $dayName,
                'date' => $date->toDateString(),
                'total' => (float) $totalAmount
            ];
        }

        // =========================================================
        // 6. AKTIVITAS PENTING
        // =========================================================
        $activities = [];

        // Notifikasi Stok Kritis
        if ($stokKritisTotal > 0) {
            $activities[] = [
                'id' => 'critical_stock',
                'title' => "{$stokKritisTotal} produk stok kritis",
                'description' => "{$stokKritisHighPrio} produk sudah habis total, perlu reorder segera.",
                'type' => 'danger',
            ];
        }

        // Notifikasi Expiring Batches
        if ($edKurang90 > 0) {
            $activities[] = [
                'id' => 'near_expiry',
                'title' => "{$edKurang90} batch mendekati expired",
                'description' => "{$edButuhFEFO} batch ED ≤ 30 hari, segera lakukan FEFO review.",
                'type' => 'warning',
            ];
        }

        // Resep Pending / Menunggu Validasi
        $pendingPrescriptions = DB::table('prescriptions')->where('status', 'Draft')->count();
        if ($pendingPrescriptions > 0) {
            $activities[] = [
                'id' => 'pending_prescriptions',
                'title' => "{$pendingPrescriptions} resep menunggu validasi",
                'description' => 'Prioritas tinggi karena mengandung obat keras/racikan.',
                'type' => 'info',
            ];
        }

        // PO Otomatis
        if ($stokKritisTotal > 0) {
            $activities[] = [
                'id' => 'auto_po',
                'title' => 'PO otomatis disarankan',
                'description' => 'Beberapa produk berada di bawah reorder point.',
                'type' => 'info',
            ];
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'omset_hari_ini' => [
                    'value'       => (float) $omsetHariIni,
                    'yesterday'   => (float) $omsetKemarin,
                    'percentage'  => $omsetPersentase,
                    'trend'       => $omsetTrend,
                    'label'       => 'Omzet Hari Ini',
                ],
                'transaksi_hari_ini' => [
                    'value'          => $transaksiHariIni,
                    'otc'            => $transaksiOTC,
                    'resep'          => $transaksiResep,
                    'label'          => 'Transaksi',
                ],
                'stok_kritis' => [
                    'value'          => $stokKritisTotal,
                    'high_priority'  => $stokKritisHighPrio,
                    'label'          => 'Stok Kritis',
                ],
                'ed_kurang_90_hari' => [
                    'value'          => $edKurang90,
                    'butuh_fefo'     => $edButuhFEFO,
                    'label'          => 'ED ≤ 90 Hari',
                ],
                'sales_trend' => $salesTrend,
                'activities'  => $activities,
            ],
        ]);
    }
}
