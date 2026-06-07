<?php

namespace App\Services;

use App\Models\POS\Sale;
use App\Models\POS\SaleItem;
use App\Models\POS\SalesReturn;
use App\Models\POS\SalesReturnItem;
use App\Models\Inventory\ProductBatch;
use App\Models\Inventory\StockMutation;
use Illuminate\Support\Facades\DB;
use Exception;

class SalesReturnService
{
    /**
     * Memproses retur penjualan dari customer.
     */
    public function processReturn(array $returnData, int $userId)
    {
        return DB::transaction(function () use ($returnData, $userId) {
            $sale = Sale::where('transaction_no', $returnData['transaction_no'])->first();

            if (!$sale) {
                throw new Exception("Transaksi POS dengan nomor {$returnData['transaction_no']} tidak ditemukan.");
            }

            if ($sale->status === 'Voided') {
                throw new Exception("Transaksi sudah di-void/dibatalkan, tidak bisa diretur.");
            }

            // Buat header retur penjualan
            $salesReturn = SalesReturn::create([
                'return_no' => 'RET-POS-' . time(),
                'sale_id' => $sale->id,
                'date' => now()->toDateString(),
                'status' => 'Completed',
                'reason' => $returnData['reason'],
                'created_by' => $userId
            ]);

            foreach ($returnData['items'] as $item) {
                // Pastikan item yang diretur dibeli di transaksi asli
                $saleItem = SaleItem::where('sale_id', $sale->id)
                    ->where('product_id', $item['product_id'])
                    ->where('product_batch_id', $item['product_batch_id'])
                    ->first();

                if (!$saleItem) {
                    throw new Exception("Produk atau batch tidak ditemukan dalam transaksi pembelian asli.");
                }

                if ($item['qty'] > $saleItem->qty) {
                    throw new Exception("Jumlah retur ({$item['qty']}) melebihi jumlah pembelian asli ({$saleItem->qty}).");
                }

                // Simpan item retur
                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'product_id' => $item['product_id'],
                    'product_batch_id' => $item['product_batch_id'],
                    'qty' => $item['qty'],
                    'condition' => $item['condition'] // Layak Jual, Karantina, Rusak
                ]);

                // Jika Layak Jual, kembalikan stoknya ke batch aktif
                if ($item['condition'] === 'Layak Jual') {
                    ProductBatch::where('id', $item['product_batch_id'])
                        ->increment('qty_available', $item['qty']);
                    
                    // Pastikan status batch aktif jika sebelumnya kosong/habis
                    ProductBatch::where('id', $item['product_batch_id'])
                        ->where('status', '!=', 'Active')
                        ->update(['status' => 'Active']);
                }

                // Catat mutasi stok pengembalian (Return)
                StockMutation::create([
                    'product_id' => $item['product_id'],
                    'product_batch_id' => $item['product_batch_id'],
                    'mutation_type' => 'in_return',
                    'qty' => $item['qty'],
                    'reference_no' => $salesReturn->return_no,
                    'user_id' => $userId
                ]);
            }

            // Update status transaksi asli menjadi Returned
            $sale->update([
                'status' => 'Returned'
            ]);

            return $salesReturn->load('items');
        });
    }
}
