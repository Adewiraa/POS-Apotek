<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Reporting\ReportExport;
use Illuminate\Support\Facades\Log;

class ExportReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $exportId;

    public function __construct($exportId)
    {
        $this->exportId = $exportId;
    }

    public function handle(): void
    {
        $export = ReportExport::find($this->exportId);
        
        if (!$export) return;

        try {
            // Simulasi proses pembuatan laporan berat yang butuh waktu lama
            Log::info("Memulai pembuatan laporan ID: {$this->exportId}");
            
            // Generate Excel/PDF logic here...
            sleep(5); // Simulate heavy work
            
            $export->update([
                'status' => 'Completed',
                'file_url' => '/storage/reports/report_' . $this->exportId . '.xlsx'
            ]);
            
            Log::info("Laporan ID: {$this->exportId} selesai di-generate.");

            // Opsional: Kirim notifikasi atau email ke User bahwa laporan siap
        } catch (\Exception $e) {
            $export->update(['status' => 'Failed']);
            Log::error("Gagal generate laporan: " . $e->getMessage());
        }
    }
}
