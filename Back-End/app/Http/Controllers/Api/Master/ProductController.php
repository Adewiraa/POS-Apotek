<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of products with relations.
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'unit'])
            ->withSum(['batches as total_qty' => function ($q) {
                $q->where('status', 'Active');
            }], 'qty_available');

        // Optional search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%");
        }

        $products = $query->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $products
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'nullable|string|unique:products,barcode',
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'unit_id' => 'nullable|exists:units,id',
            'classification' => 'required|string',
            'selling_price' => 'required|numeric|min:0',
            'purchase_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'is_active' => 'boolean'
        ]);

        $product = Product::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil ditambahkan',
            'data' => $product
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        $product->load(['category', 'unit', 'batches' => function ($q) {
            $q->where('status', 'Active')->orderBy('expired_date', 'asc');
        }]);

        return response()->json([
            'status' => 'success',
            'data' => $product
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'barcode' => ['nullable', 'string', Rule::unique('products')->ignore($product->id)],
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'unit_id' => 'nullable|exists:units,id',
            'classification' => 'required|string',
            'selling_price' => 'required|numeric|min:0',
            'purchase_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'is_active' => 'boolean'
        ]);

        $product->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil diperbarui',
            'data' => $product
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product)
    {
        // Pengecekan apakah produk punya relasi stok atau histori penjualan (contoh basic)
        if ($product->batches()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak bisa dihapus karena masih memiliki riwayat batch stok.'
            ], 400);
        }

        $product->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil dihapus'
        ]);
    }
}
