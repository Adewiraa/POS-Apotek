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
    public function getMetrics()
    {
        $today = Carbon::today();

        // 1. Omzet Hari Ini (Total penjualan hari ini, status Completed)
        $omsetHariIni = Sale::whereDate('created_at', $today)
            ->where('status', 'Completed')
            ->sum('total_amount');

        // 2. Transaksi Hari Ini (Jumlah struck hari ini)
        $transaksiHariIni = Sale::whereDate('created_at', $today)
            ->where('status', 'Completed')
            ->count();

        // 3. Stok Kritis (Produk yang total qty-nya <= min_stock)
        $criticalStockCount = DB::table('products')
            ->leftJoin('product_batches', 'products.id', '=', 'product_batches.product_id')
            ->select('products.id', 'products.min_stock', DB::raw('COALESCE(SUM(product_batches.qty_available), 0) as total_qty'))
            ->groupBy('products.id', 'products.min_stock')
            ->havingRaw('COALESCE(SUM(product_batches.qty_available), 0) <= products.min_stock')
            ->get()
            ->count();

        // 4. ED <= 90 hari (Produk batch yang akan kedaluwarsa 90 hari ke depan, stok masih ada)
        $expiringCount = DB::table('product_batches')
            ->where('qty_available', '>', 0)
            ->where('expired_date', '<=', Carbon::now()->addDays(90))
            ->where('expired_date', '>=', Carbon::now()) // Optional: jika ingin exclude yang sudah kedaluwarsa
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'omset_hari_ini' => $omsetHariIni,
                'transaksi_hari_ini' => $transaksiHariIni,
                'stok_kritis' => $criticalStockCount,
                'ed_kurang_90_hari' => $expiringCount
            ]
        ]);
    }
}
