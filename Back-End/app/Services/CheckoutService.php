<?php

namespace App\Services;

use App\Models\POS\Sale;
use App\Models\POS\SaleItem;
use App\Models\Inventory\ProductBatch;
use App\Models\Inventory\StockMutation;
use Illuminate\Support\Facades\DB;
use Exception;

class CheckoutService
{
    /**
     * Process a POS checkout transaction with atomic database operation.
     */
    public function processCheckout(array $cartItems, int $cashierId, string $paymentMethod, float $total, float $discount = 0, float $tax = 0, ?int $prescriptionId = null)
    {
        return DB::transaction(function () use ($cartItems, $cashierId, $paymentMethod, $total, $discount, $tax, $prescriptionId) {
            
            // 1. Validasi Resep jika ada item dengan klasifikasi "Obat Keras"
            $hasObatKeras = false;
            foreach ($cartItems as $item) {
                $product = \App\Models\Master\Product::find($item['product_id']);
                if ($product && $product->classification === 'Obat Keras') {
                    $hasObatKeras = true;
                    break;
                }
            }

            if ($hasObatKeras) {
                if (empty($prescriptionId)) {
                    throw new Exception("Transaksi mengandung Obat Keras. Validasi Resep Dokter diperlukan untuk melanjutkan.");
                }

                $prescription = \App\Models\Prescription\Prescription::find($prescriptionId);
                if (!$prescription) {
                    throw new Exception("Resep Dokter tidak ditemukan.");
                }

                if ($prescription->status !== 'Approved') {
                    throw new Exception("Resep Dokter dengan nomor {$prescription->prescription_no} belum disetujui (Status saat ini: {$prescription->status}). Validasi APJ diperlukan.");
                }
            }

            // 2. Create Sale Header
            $sale = Sale::create([
                'transaction_no' => 'TRX-' . time(),
                'cashier_id' => $cashierId,
                'prescription_id' => $prescriptionId,
                'subtotal' => $total - $tax + $discount, // Kalkulasi mundur untuk MVP
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'status' => 'Paid',
                'payment_status' => 'Paid'
            ]);

            // 3. Process Items and FEFO (First Expired First Out) Logic
            foreach ($cartItems as $item) {
                $qtyNeeded = $item['qty'];
                
                // Get available batches ordered by ED closest to now (harus belum expired)
                $batches = ProductBatch::where('product_id', $item['product_id'])
                    ->where('status', 'Active')
                    ->where('qty_available', '>', 0)
                    ->where('expired_date', '>', now()) // Mencegah batch expired terjual
                    ->orderBy('expired_date', 'asc')
                    ->lockForUpdate() // Prevent race conditions
                    ->get();

                $qtyRemaining = $qtyNeeded;

                foreach ($batches as $batch) {
                    if ($qtyRemaining <= 0) break;

                    $takeQty = min($batch->qty_available, $qtyRemaining);
                    
                    // Deduct stock from batch
                    $batch->decrement('qty_available', $takeQty);

                    // Create Sale Item linked to this specific batch
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $item['product_id'],
                        'product_batch_id' => $batch->id,
                        'qty' => $takeQty,
                        'price' => $item['price'],
                        'subtotal' => $takeQty * $item['price']
                    ]);

                    // Record Stock Mutation
                    StockMutation::create([
                        'product_id' => $item['product_id'],
                        'product_batch_id' => $batch->id,
                        'mutation_type' => 'out_sales',
                        'qty' => $takeQty,
                        'reference_no' => $sale->transaction_no,
                        'user_id' => $cashierId
                    ]);

                    $qtyRemaining -= $takeQty;
                }

                // If we still need qty after checking all batches, stock is insufficient
                if ($qtyRemaining > 0) {
                    throw new Exception("Stok tidak mencukupi untuk produk ID " . $item['product_id'] . " (hanya batch aktif & belum kedaluwarsa yang dapat dijual)");
                }
            }

            // 4. Update status resep menjadi Dispensed
            if ($prescriptionId) {
                \App\Models\Prescription\Prescription::where('id', $prescriptionId)->update([
                    'status' => 'Dispensed'
                ]);
            }

            return $sale;
        });
    }
}
