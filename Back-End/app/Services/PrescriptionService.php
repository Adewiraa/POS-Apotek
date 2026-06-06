<?php

namespace App\Services;

use App\Models\Prescription\Prescription;
use App\Models\Prescription\PrescriptionCompound;
use App\Models\Prescription\PrescriptionCompoundItem;
use App\Models\Inventory\ProductBatch;
use App\Models\Inventory\StockMutation;
use Illuminate\Support\Facades\DB;
use Exception;

class PrescriptionService
{
    /**
     * Memproses racikan resep dokter (meracik 1 menu dari beberapa bahan baku).
     */
    public function processCompound(array $compoundData, int $pharmacistId)
    {
        return DB::transaction(function () use ($compoundData, $pharmacistId) {
            
            // Buat Induk Racikan
            $compound = PrescriptionCompound::create([
                'prescription_id' => $compoundData['prescription_id'],
                'compound_name' => $compoundData['compound_name'],
                'qty' => $compoundData['qty'],
                'signa' => $compoundData['signa'],
                'service_fee' => $compoundData['service_fee'] ?? 0
            ]);

            // Loop untuk setiap bahan baku yang diracik
            foreach ($compoundData['items'] as $item) {
                // Kalkulasi total bahan baku yang diperlukan: qty racikan * jumlah yang dipakai per puyer
                $totalQtyNeeded = $compound->qty * $item['qty_per_compound'];
                $qtyRemaining = $totalQtyNeeded;

                // Cek stok batch bahan baku (FEFO)
                $batches = ProductBatch::where('product_id', $item['product_id'])
                    ->where('status', 'Active')
                    ->where('qty_available', '>', 0)
                    ->orderBy('expired_date', 'asc')
                    ->lockForUpdate()
                    ->get();

                foreach ($batches as $batch) {
                    if ($qtyRemaining <= 0) break;

                    $takeQty = min($batch->qty_available, $qtyRemaining);
                    
                    // Potong stok bahan baku dari rak
                    $batch->decrement('qty_available', $takeQty);

                    // Catat penggunaan bahan baku ke tabel relasi racikan
                    PrescriptionCompoundItem::create([
                        'compound_id' => $compound->id,
                        'product_id' => $item['product_id'],
                        'qty_used' => $takeQty
                    ]);

                    // Catat mutasi untuk audit SIPNAP / Compliance
                    StockMutation::create([
                        'product_id' => $item['product_id'],
                        'product_batch_id' => $batch->id,
                        'mutation_type' => 'out_prescription',
                        'qty' => $takeQty,
                        'reference_no' => 'CMP-' . $compound->id,
                        'user_id' => $pharmacistId
                    ]);

                    $qtyRemaining -= $takeQty;
                }

                if ($qtyRemaining > 0) {
                    throw new Exception("Stok bahan baku ID " . $item['product_id'] . " tidak mencukupi untuk racikan ini.");
                }
            }

            // Opsional: Validasi otomatis atau pindah ke Pending Review
            return $compound->load('items');
        });
    }

    /**
     * APJ memvalidasi (Approve/Reject) resep sebelum diserahkan ke kasir
     */
    public function validatePrescription(int $prescriptionId, string $status, int $apjId)
    {
        $prescription = Prescription::findOrFail($prescriptionId);
        
        if (!in_array($status, ['Approved', 'Rejected', 'Need Revision'])) {
            throw new Exception("Status validasi tidak dikenali.");
        }

        $prescription->update([
            'status' => $status,
            'validator_id' => $apjId
        ]);

        return $prescription;
    }
}
