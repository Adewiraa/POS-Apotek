<?php

namespace App\Services;

use App\Models\POS\Sale;
use App\Models\Inventory\ProductBatch;
use App\Models\Inventory\StockMutation;
use Illuminate\Support\Facades\DB;
use Exception;

class VoidService
{
    /**
     * Membatalkan transaksi kasir dan mengembalikan stok.
     */
    public function voidTransaction(string $transactionNo, int $voidedBy, string $reason)
    {
        return DB::transaction(function () use ($transactionNo, $voidedBy, $reason) {
            
            $sale = Sale::with('items')->where('transaction_no', $transactionNo)->first();
            
            if (!$sale) {
                throw new Exception("Transaksi tidak ditemukan.");
            }

            if ($sale->status === 'Voided') {
                throw new Exception("Transaksi ini sudah dibatalkan sebelumnya.");
            }

            // 1. Kembalikan stok untuk setiap item
            foreach ($sale->items as $item) {
                // Tambah stok ke batch
                ProductBatch::where('id', $item->product_batch_id)
                            ->increment('qty_available', $item->qty);

                // Catat mutasi pengembalian stok (Void)
                StockMutation::create([
                    'product_id' => $item->product_id,
                    'product_batch_id' => $item->product_batch_id,
                    'mutation_type' => 'in_void',
                    'qty' => $item->qty,
                    'reference_no' => $sale->transaction_no,
                    'user_id' => $voidedBy
                ]);
            }

            // 2. Update status transaksi menjadi Voided
            $sale->update([
                'status' => 'Voided',
                'payment_status' => 'Refunded',
                'voided_at' => now(),
                'voided_by' => $voidedBy,
                'void_reason' => $reason
            ]);

            return $sale;
        });
    }
}
