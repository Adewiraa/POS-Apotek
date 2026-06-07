<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\DashboardController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Global Search
Route::get('/search', [SearchController::class, 'global']);

// Dashboard Metrics
Route::get('/dashboard/metrics', [DashboardController::class, 'getMetrics']);

// Route Endpoint Transaksi Kasir
Route::prefix('pos')->group(function () {
    Route::post('/checkout', [\App\Http\Controllers\Api\CheckoutController::class, 'store']);
    Route::post('/hold', [\App\Http\Controllers\Api\CheckoutController::class, 'hold']);
    Route::post('/void', [\App\Http\Controllers\Api\CheckoutController::class, 'voidTransaction']);
    Route::post('/returns', [\App\Http\Controllers\Api\SalesReturnController::class, 'store']);
});

// Master Data CRUD
Route::prefix('master')->group(function () {
    Route::apiResource('products', \App\Http\Controllers\Api\Master\ProductController::class);
    Route::get('categories', [\App\Http\Controllers\Api\Master\CategoryController::class, 'index']);
});

// Modul Pelayanan Kefarmasian & Resep
Route::prefix('pharmacy')->group(function () {
    Route::post('/compounds', [\App\Http\Controllers\Api\PrescriptionController::class, 'storeCompound']);
    Route::put('/prescriptions/{id}/validate', [\App\Http\Controllers\Api\PrescriptionController::class, 'validatePrescription']);
    Route::post('/counseling', [\App\Http\Controllers\Api\PrescriptionController::class, 'storeCounseling']);
});

// Modul Inventory & Gudang
Route::prefix('inventory')->group(function () {
    Route::post('/stock-opname', [\App\Http\Controllers\Api\InventoryController::class, 'submitStockOpname']);
    Route::put('/stock-opname/{id}/approve', [\App\Http\Controllers\Api\InventoryController::class, 'approveStockOpname']);
});

// Modul Procurement (Pengadaan & Retur)
Route::prefix('procurement')->group(function () {
    Route::post('/purchase-requests', [\App\Http\Controllers\Api\ProcurementController::class, 'storePurchaseRequest']);
    Route::put('/purchase-requests/{id}/approve', [\App\Http\Controllers\Api\ProcurementController::class, 'approvePurchaseRequest']);
    Route::post('/purchase-orders', [\App\Http\Controllers\Api\ProcurementController::class, 'storePurchaseOrder']);
    Route::post('/receive-goods', [\App\Http\Controllers\Api\ProcurementController::class, 'receiveGoods']);
    Route::post('/returns', [\App\Http\Controllers\Api\ProcurementController::class, 'purchaseReturn']);
});

Route::get('/pos/history', [\App\Http\Controllers\Api\CheckoutController::class, 'index']);
