<?php

namespace App\Services;

use App\Models\Inventory\StockOpname;
use App\Models\Inventory\ProductBatch;
use App\Models\Inventory\StockMutation;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Membuat pengajuan Stock Opname (Stok tidak langsung berubah, butuh approval)
     */
    public function createStockOpname(array $data, int $userId)
    {
        return DB::transaction(function () use ($data, $userId) {
            $batch = ProductBatch::findOrFail($data['product_batch_id']);
            
            $difference = $data['actual_qty'] - $batch->qty_available;
            
            $opname = StockOpname::create([
                'product_id' => $batch->product_id,
                'product_batch_id' => $batch->id,
                'system_qty' => $batch->qty_available,
                'actual_qty' => $data['actual_qty'],
                'total_difference' => $difference,
                'reason' => $data['reason'] ?? 'Routine Check',
                'user_id' => $userId,
                'status' => 'Pending Approval'
            ]);

            return $opname;
        });
    }

    /**
     * APJ / Owner memberikan Approval untuk Stock Opname.
     * Setelah di-approve, stok fisik (ProductBatch) akan disesuaikan.
     */
    public function approveStockOpname(int $opnameId, int $approverId, string $status)
    {
        return DB::transaction(function () use ($opnameId, $approverId, $status) {
            $opname = StockOpname::findOrFail($opnameId);

            if ($opname->status !== 'Pending Approval') {
                throw new Exception("Stock Opname ini sudah diproses sebelumnya.");
            }

            if (!in_array($status, ['Approved', 'Rejected'])) {
                throw new Exception("Status approval tidak valid.");
            }

            $opname->update([
                'status' => $status,
                'approver_id' => $approverId
            ]);

            // Jika disetujui, sesuaikan stok di rak!
            if ($status === 'Approved' && $opname->total_difference != 0) {
                $batch = ProductBatch::findOrFail($opname->product_batch_id);
                
                // Ubah kuantitas batch menjadi nilai actual
                $batch->update([
                    'qty_available' => $opname->actual_qty
                ]);

                // Catat mutasi untuk Audit Trail
                StockMutation::create([
                    'product_id' => $opname->product_id,
                    'product_batch_id' => $opname->product_batch_id,
                    'mutation_type' => $opname->total_difference > 0 ? 'in_adjustment' : 'out_adjustment',
                    'qty' => abs($opname->total_difference),
                    'reference_no' => 'SO-' . $opname->id,
                    'user_id' => $approverId
                ]);
            }

            return $opname;
        });
    }
}
