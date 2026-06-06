<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProcurementService;
use Illuminate\Http\Request;
use Exception;

class ProcurementController extends Controller
{
    protected $procurementService;

    public function __construct(ProcurementService $procurementService)
    {
        $this->procurementService = $procurementService;
    }

    public function storePurchaseRequest(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty_requested' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string'
        ]);

        $pr = $this->procurementService->createPurchaseRequest($validated, $validated['user_id']);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Purchase Request berhasil dibuat.',
            'data' => $pr
        ], 201);
    }

    public function approvePurchaseRequest(Request $request, $id)
    {
        $validated = $request->validate([
            'approver_id' => 'required|integer'
        ]);

        try {
            $pr = $this->procurementService->approvePurchaseRequest($id, $validated['approver_id']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Purchase Request berhasil disetujui.',
                'data' => $pr
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function storePurchaseOrder(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'purchase_request_id' => 'nullable|integer|exists:purchase_requests,id',
            'total' => 'required|numeric',
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric'
        ]);

        $po = $this->procurementService->createPurchaseOrder($validated, $validated['user_id']);

        return response()->json([
            'status' => 'success',
            'message' => 'Purchase Order berhasil dibuat.',
            'data' => $po
        ], 201);
    }

    // Endpoint untuk Menerima Barang dari Supplier
    public function receiveGoods(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'user_id' => 'required|integer',
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.batch_no' => 'required|string',
            'items.*.expired_date' => 'required|date',
            'items.*.qty_received' => 'required|integer|min:1',
        ]);

        try {
            $this->procurementService->receiveGoods($validated, $validated['user_id']);

            return response()->json([
                'status' => 'success',
                'message' => 'Penerimaan barang berhasil diproses dan stok bertambah.'
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // Endpoint untuk Retur Pembelian ke Supplier
    public function purchaseReturn(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'user_id' => 'required|integer',
            'reason' => 'required|string',
            'items' => 'required|array',
            'items.*.product_batch_id' => 'required|integer|exists:product_batches,id',
            'items.*.qty_returned' => 'required|integer|min:1',
        ]);

        try {
            $return = $this->procurementService->processReturn($validated, $validated['user_id']);

            return response()->json([
                'status' => 'success',
                'message' => 'Retur pembelian berhasil. Stok telah dikurangi.',
                'data' => $return
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
