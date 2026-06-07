<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Prescription\Prescription;

class PrescriptionTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Resep disetujui (Approved)
        Prescription::create([
            'prescription_no' => 'RX-TEST-001',
            'patient_id' => 1,
            'doctor_id' => 1,
            'date' => now()->toDateString(),
            'status' => 'Approved'
        ]);

        // 2. Resep belum disetujui (Draft)
        Prescription::create([
            'prescription_no' => 'RX-TEST-002',
            'patient_id' => 1,
            'doctor_id' => 1,
            'date' => now()->toDateString(),
            'status' => 'Draft'
        ]);
    }
}
