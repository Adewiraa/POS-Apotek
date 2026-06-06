<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Exception;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    // Endpoint untuk mengajukan Stock Opname
    public function submitStockOpname(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'product_batch_id' => 'required|integer|exists:product_batches,id',
            'actual_qty' => 'required|numeric|min:0',
            'reason' => 'nullable|string'
        ]);

        try {
            $opname = $this->inventoryService->createStockOpname(
                $validated,
                $validated['user_id']
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan Stock Opname berhasil dibuat dan menunggu persetujuan.',
                'data' => $opname
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // Endpoint untuk Approval Selisih Stok oleh APJ/Owner
    public function approveStockOpname(Request $request, $id)
    {
        $validated = $request->validate([
            'approver_id' => 'required|integer',
            'status' => 'required|in:Approved,Rejected'
        ]);

        try {
            $opname = $this->inventoryService->approveStockOpname(
                $id,
                $validated['approver_id'],
                $validated['status']
            );

            $message = $opname->status === 'Approved' 
                ? 'Stock Opname disetujui dan stok fisik telah disesuaikan.' 
                : 'Stock Opname ditolak. Stok fisik tidak berubah.';

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => $opname
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
