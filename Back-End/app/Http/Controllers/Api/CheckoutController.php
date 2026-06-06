<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CheckoutService;
use Illuminate\Http\Request;
use Exception;

class CheckoutController extends Controller
{
    protected $checkoutService;

    public function __construct(CheckoutService $checkoutService)
    {
        $this->checkoutService = $checkoutService;
    }

    public function store(Request $request)
    {
        // Validasi input (Sederhana untuk keperluan testing awal)
        $request->validate([
            'cashier_id' => 'required|integer',
            'payment_method' => 'required|string',
            'total' => 'required|numeric',
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
        ]);

        try {
            // Jalankan Service
            $sale = $this->checkoutService->processCheckout(
                $request->input('items'),
                $request->input('cashier_id'),
                $request->input('payment_method'),
                $request->input('total')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi berhasil diproses!',
                'data' => $sale->load('items') // Memuat relasi item yang terjual
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function hold(Request $request)
    {
        $validated = $request->validate([
            'cashier_id' => 'required|integer',
            'subtotal' => 'required|numeric',
            'total' => 'required|numeric',
            // Simpan detail cart ke dalam JSON sementara atau database terpisah
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi berhasil di-hold (Draft). Antrean berikutnya dapat diproses.'
        ]);
    }

    public function voidTransaction(Request $request, \App\Services\VoidService $voidService)
    {
        $validated = $request->validate([
            'transaction_no' => 'required|string',
            'void_reason' => 'required|string',
            'authorizer_id' => 'required|integer' // Simulasi APJ yang memberi izin void
        ]);

        try {
            $sale = $voidService->voidTransaction(
                $validated['transaction_no'],
                $validated['authorizer_id'],
                $validated['void_reason']
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi berhasil di-void dan stok telah dikembalikan.',
                'data' => $sale
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
