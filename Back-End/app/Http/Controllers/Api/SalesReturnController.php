<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SalesReturnService;
use Illuminate\Http\Request;
use Exception;

class SalesReturnController extends Controller
{
    protected $salesReturnService;

    public function __construct(SalesReturnService $salesReturnService)
    {
        $this->salesReturnService = $salesReturnService;
    }

    /**
     * Memproses retur penjualan dari kasir/customer
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_no' => 'required|string',
            'user_id' => 'required|integer',
            'reason' => 'required|string',
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_batch_id' => 'required|integer|exists:product_batches,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.condition' => 'required|string|in:Layak Jual,Karantina,Rusak'
        ]);

        try {
            $return = $this->salesReturnService->processReturn($validated, $validated['user_id']);

            return response()->json([
                'status' => 'success',
                'message' => 'Retur penjualan berhasil diproses.',
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
