<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Master\Patient;
use App\Models\Master\Product;
use App\Models\Prescription\Prescription;

class SearchController extends Controller
{
    /**
     * Global search endpoint: cari pasien, produk, dan resep.
     * GET /api/search?q=keyword&limit=5
     */
    public function global(Request $request)
    {
        $request->validate([
            'q'     => 'required|string|min:1|max:100',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        $q     = $request->input('q');
        $limit = $request->input('limit', 5);

        // --- Produk ---
        $products = Product::where('name', 'like', "%{$q}%")
            ->orWhere('barcode', 'like', "%{$q}%")
            ->orWhere('generic_name', 'like', "%{$q}%")
            ->where('is_active', true)
            ->select('id', 'name', 'generic_name', 'barcode', 'classification', 'selling_price')
            ->limit($limit)
            ->get()
            ->map(fn($p) => [
                'id'           => $p->id,
                'label'        => $p->name,
                'sub_label'    => $p->generic_name,
                'meta'         => $p->barcode,
                'type'         => 'produk',
                'url'          => "/master/products/{$p->id}",
                'raw'          => $p,
            ]);

        // --- Pasien ---
        $patients = Patient::where('name', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->select('id', 'name', 'phone', 'type')
            ->limit($limit)
            ->get()
            ->map(fn($p) => [
                'id'        => $p->id,
                'label'     => $p->name,
                'sub_label' => $p->type,
                'meta'      => $p->phone,
                'type'      => 'pasien',
                'url'       => "/pharmacy/patients/{$p->id}",
                'raw'       => $p,
            ]);

        // --- Resep ---
        $prescriptions = Prescription::with('patient:id,name')
            ->where('prescription_no', 'like', "%{$q}%")
            ->orWhereHas('patient', fn($query) => $query->where('name', 'like', "%{$q}%"))
            ->select('id', 'prescription_no', 'date', 'status', 'patient_id')
            ->limit($limit)
            ->get()
            ->map(fn($rx) => [
                'id'        => $rx->id,
                'label'     => $rx->prescription_no,
                'sub_label' => $rx->patient?->name ?? 'Pasien tidak diketahui',
                'meta'      => $rx->status,
                'type'      => 'resep',
                'url'       => "/pharmacy/prescriptions/{$rx->id}",
                'raw'       => $rx,
            ]);

        $total = $products->count() + $patients->count() + $prescriptions->count();

        return response()->json([
            'status' => 'success',
            'query'  => $q,
            'total'  => $total,
            'data'   => [
                'produk'  => $products->values(),
                'pasien'  => $patients->values(),
                'resep'   => $prescriptions->values(),
            ],
        ]);
    }
}
