<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PrescriptionService;
use App\Models\Prescription\CounselingLog;
use Illuminate\Http\Request;
use Exception;

class PrescriptionController extends Controller
{
    protected $prescriptionService;

    public function __construct(PrescriptionService $prescriptionService)
    {
        $this->prescriptionService = $prescriptionService;
    }

    // Endpoint untuk meracik obat (Compound)
    public function storeCompound(Request $request)
    {
        $validated = $request->validate([
            'pharmacist_id' => 'required|integer',
            'prescription_id' => 'required|integer|exists:prescriptions,id',
            'compound_name' => 'required|string',
            'qty' => 'required|integer|min:1',
            'signa' => 'required|string',
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty_per_compound' => 'required|numeric|min:0.1' // Misal: 0.5 tablet per kapsul
        ]);

        try {
            $compound = $this->prescriptionService->processCompound(
                $validated,
                $request->input('pharmacist_id')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Racikan berhasil diproses dan stok bahan baku telah dipotong.',
                'data' => $compound
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // Endpoint untuk Validasi Resep oleh APJ
    public function validatePrescription(Request $request, $id)
    {
        $validated = $request->validate([
            'apj_id' => 'required|integer',
            'status' => 'required|string'
        ]);

        try {
            $rx = $this->prescriptionService->validatePrescription(
                $id,
                $validated['status'],
                $validated['apj_id']
            );

            return response()->json([
                'status' => 'success',
                'message' => "Resep berhasil divalidasi dengan status {$rx->status}.",
                'data' => $rx
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // Endpoint untuk Catatan Konseling Pasien
    public function storeCounseling(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|integer|exists:patients,id',
            'pharmacist_id' => 'required|integer|exists:users,id',
            'prescription_id' => 'nullable|integer|exists:prescriptions,id',
            'counseling_notes' => 'required|string'
        ]);

        $log = CounselingLog::create([
            'patient_id' => $validated['patient_id'],
            'pharmacist_id' => $validated['pharmacist_id'],
            'prescription_id' => $validated['prescription_id'],
            'counseling_notes' => $validated['counseling_notes'],
            'date' => now()->toDateString()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Catatan konseling / KIE (Komunikasi Informasi Edukasi) berhasil disimpan.',
            'data' => $log
        ], 201);
    }
}
