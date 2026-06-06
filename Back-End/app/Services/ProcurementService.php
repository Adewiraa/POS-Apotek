<?php

namespace App\Services;

use App\Models\Procurement\PurchaseRequest;
use App\Models\Procurement\PurchaseOrder;
use App\Models\Procurement\PurchaseReturn;
use App\Models\Inventory\ProductBatch;
use App\Models\Inventory\StockMutation;
use Illuminate\Support\Facades\DB;
use Exception;

class ProcurementService
{
    /**
     * Membuat Purchase Request (Usulan Pembelian)
     */
    public function createPurchaseRequest(array $data, int $userId)
    {
        return DB::transaction(function () use ($data, $userId) {
            $pr = PurchaseRequest::create([
                'pr_no' => 'PR-' . time(),
                'date' => now()->toDateString(),
                'status' => 'Draft',
                'created_by' => $userId
            ]);

            foreach ($data['items'] as $item) {
                $pr->items()->create([
                    'product_id' => $item['product_id'],
                    'qty_requested' => $item['qty_requested'],
                    'notes' => $item['notes'] ?? null
                ]);
            }

            return $pr->load('items');
        });
    }

    /**
     * Approve PR menjadi Approved (Siap diconvert ke PO)
     */
    public function approvePurchaseRequest(int $prId, int $approverId)
    {
        $pr = PurchaseRequest::findOrFail($prId);
        
        if ($pr->status !== 'Draft') {
            throw new Exception("Hanya PR berstatus Draft yang bisa di-approve.");
        }

        $pr->update([
            'status' => 'Approved',
            'approved_by' => $approverId
        ]);

        return $pr;
    }

    /**
     * Membuat Purchase Order (Bisa dari PR atau langsung)
     */
    public function createPurchaseOrder(array $data, int $userId)
    {
        return DB::transaction(function () use ($data, $userId) {
            $po = PurchaseOrder::create([
                'po_no' => 'PO-' . time(), // Asumsi kolom ini ada di migrasi Phase 2 (sebelumnya bernama po_id/po_no)
                'supplier_id' => $data['supplier_id'],
                'date' => now()->toDateString(),
                'status' => 'Pending Approval',
                'total' => $data['total'] ?? 0,
                'created_by' => $userId
            ]);

            foreach ($data['items'] as $item) {
                $po->items()->create([
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'price' => $item['price']
                ]);
            }

            // Jika dibuat dari PR, ubah status PR
            if (!empty($data['purchase_request_id'])) {
                PurchaseRequest::where('id', $data['purchase_request_id'])
                    ->update(['status' => 'Converted']);
            }

            return $po->load('items');
        });
    }
    /**
     * Memproses Purchase Return (Retur Pembelian ke PBF/Supplier)
     * Mengurangi stok dari rak.
     */
    public function processReturn(array $returnData, int $userId)
    {
        return DB::transaction(function () use ($returnData, $userId) {
            
            // 1. Buat Header Retur
            $return = PurchaseReturn::create([
                'return_no' => 'RET-' . time(),
                'supplier_id' => $returnData['supplier_id'],
                'date' => now()->toDateString(),
                'status' => 'Approved',
                'reason' => $returnData['reason'],
                'created_by' => $userId
            ]);

            // 2. Loop setiap item retur
            foreach ($returnData['items'] as $item) {
                $batch = ProductBatch::findOrFail($item['product_batch_id']);

                if ($batch->qty_available < $item['qty_returned']) {
                    throw new Exception("Stok batch {$batch->batch_no} tidak cukup untuk diretur.");
                }

                // 3. Potong stok dari rak (batch)
                $batch->decrement('qty_available', $item['qty_returned']);

                // 4. Catat riwayat item retur
                $return->items()->create([
                    'product_batch_id' => $batch->id,
                    'qty_returned' => $item['qty_returned']
                ]);

                // 5. Catat Mutasi Keluar (Retur)
                StockMutation::create([
                    'product_id' => $batch->product_id,
                    'product_batch_id' => $batch->id,
                    'mutation_type' => 'out_return',
                    'qty' => $item['qty_returned'],
                    'reference_no' => $return->return_no,
                    'user_id' => $userId
                ]);
            }

            return $return->load('items');
        });
    }

    /**
     * Terima Barang dari Supplier (Goods Receipt) -> Otomatis tambah Batch & Mutasi
     */
    public function receiveGoods(array $grData, int $userId)
    {
        return DB::transaction(function () use ($grData, $userId) {
            
            // Logika sederhana: langsung create batch baru (bisa juga tambah ke batch lama jika nomor batch sama)
            foreach ($grData['items'] as $item) {
                // Rule PRD: Barang masuk sediaan farmasi wajib memiliki batch number dan expired date
                if (empty($item['batch_no']) || empty($item['expired_date'])) {
                    throw new Exception("Penerimaan ditolak: Setiap sediaan farmasi wajib memiliki Batch Number dan Expired Date (BR-01).");
                }

                $batch = ProductBatch::firstOrCreate(
                    [
                        'product_id' => $item['product_id'],
                        'batch_no' => $item['batch_no'],
                        'supplier_id' => $grData['supplier_id']
                    ],
                    [
                        'expired_date' => $item['expired_date'],
                        'qty_available' => 0,
                        'status' => 'Active'
                    ]
                );

                $batch->increment('qty_available', $item['qty_received']);

                StockMutation::create([
                    'product_id' => $item['product_id'],
                    'product_batch_id' => $batch->id,
                    'mutation_type' => 'in_purchase',
                    'qty' => $item['qty_received'],
                    'reference_no' => 'GR-' . time(),
                    'user_id' => $userId
                ]);

                // Audit Trail: Setiap barang masuk harus dicatat di log audit (FR-TECH-03)
                \App\Models\Reporting\AuditLog::create([
                    'user_id' => $userId,
                    'action' => 'GOODS_RECEIPT',
                    'entity' => 'product_batches',
                    'entity_id' => $batch->id,
                    'old_values' => json_encode(['qty_available' => $batch->qty_available - $item['qty_received']]),
                    'new_values' => json_encode(['qty_available' => $batch->qty_available]),
                    'ip_address' => request()->ip() ?? '127.0.0.1'
                ]);
            }

            return true;
        });
    }
}
