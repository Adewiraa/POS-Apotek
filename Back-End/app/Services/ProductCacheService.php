<?php

namespace App\Services;

use App\Models\Master\Product;
use Illuminate\Support\Facades\Cache;

class ProductCacheService
{
    private const CACHE_KEY = 'pos_active_products';

    /**
     * Dapatkan semua produk aktif dengan response cepat melalui cache.
     */
    public function getActiveProducts()
    {
        // Menyimpan data produk ke dalam Cache selama 24 jam
        return Cache::remember(self::CACHE_KEY, 60 * 60 * 24, function () {
            return Product::with(['category', 'unit'])
                ->where('is_active', true)
                ->get();
        });
    }

    /**
     * Panggil fungsi ini setiap kali ada perubahan data produk agar cache diperbarui
     */
    public function flushCache()
    {
        Cache::forget(self::CACHE_KEY);
    }
}
