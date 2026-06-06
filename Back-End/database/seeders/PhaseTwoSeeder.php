<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Master\Doctor;
use App\Models\Master\Patient;
use App\Models\Procurement\PurchaseOrder;
use App\Models\Procurement\PurchaseOrderItem;

class PhaseTwoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Doctors
        $doctors = [
            ['name' => 'dr. Budi Santoso', 'sip' => 'SIP/123/2024', 'specialization' => 'Umum', 'contact' => '0812333444'],
            ['name' => 'dr. Siti Aminah, Sp.A', 'sip' => 'SIP/124/2024', 'specialization' => 'Anak', 'contact' => '0812555666'],
        ];

        foreach ($doctors as $doc) {
            Doctor::create($doc);
        }

        // 2. Patients
        $patients = [
            ['name' => 'Ahmad Reza', 'phone' => '0855112233', 'address' => 'Jl. Mawar No. 5', 'type' => 'Member'],
            ['name' => 'Linda Susanti', 'phone' => '0855998877', 'address' => 'Jl. Melati No. 10', 'type' => 'Regular'],
        ];

        foreach ($patients as $pat) {
            Patient::create($pat);
        }

        // 3. Purchase Order (Draft)
        $po = PurchaseOrder::create([
            'po_no' => 'PO-' . date('Ymd') . '-001',
            'supplier_id' => 1, // PBF Enseval
            'date' => now()->toDateString(),
            'status' => 'Draft',
            'total' => 280000,
        ]);

        PurchaseOrderItem::create([
            'po_id' => $po->id,
            'product_id' => 2, // Amoxsan 500mg
            'qty' => 10,
            'price' => 28000,
            'subtotal' => 280000,
        ]);
    }
}
