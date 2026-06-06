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
    public function processCheckout(array $cartItems, int $cashierId, string $paymentMethod, float $total, float $discount = 0, float $tax = 0)
    {
        return DB::transaction(function () use ($cartItems, $cashierId, $paymentMethod, $total, $discount, $tax) {
            
            // 1. Create Sale Header
            $sale = Sale::create([
                'transaction_no' => 'TRX-' . time(),
                'cashier_id' => $cashierId,
                'subtotal' => $total - $tax + $discount, // Kalkulasi mundur untuk MVP
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'status' => 'Paid',
                'payment_status' => 'Paid'
            ]);

            // 2. Process Items and FEFO (First Expired First Out) Logic
            foreach ($cartItems as $item) {
                $qtyNeeded = $item['qty'];
                
                // Get available batches ordered by ED closest to now
                $batches = ProductBatch::where('product_id', $item['product_id'])
                    ->where('status', 'Active')
                    ->where('qty_available', '>', 0)
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
                    throw new Exception("Stok tidak mencukupi untuk produk ID " . $item['product_id']);
                }
            }

            return $sale;
        });
    }
}
