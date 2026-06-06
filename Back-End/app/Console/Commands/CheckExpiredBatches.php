<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inventory\ProductBatch;
use App\Models\Reporting\NotificationLog;
use Carbon\Carbon;

class CheckExpiredBatches extends Command
{
    protected $signature = 'pharmacy:check-ed';
    protected $description = 'Memeriksa batch obat yang mendekati tanggal kedaluwarsa (ED) dan membuat notifikasi';

    public function handle()
    {
        $threeMonthsFromNow = Carbon::now()->addMonths(3);

        $nearExpiredBatches = ProductBatch::with('product')
            ->where('status', 'Active')
            ->where('qty_available', '>', 0)
            ->whereDate('expired_date', '<=', $threeMonthsFromNow)
            ->get();

        if ($nearExpiredBatches->count() > 0) {
            foreach ($nearExpiredBatches as $batch) {
                // Buat Notifikasi ke Super Admin (Asumsi user_id 1)
                NotificationLog::create([
                    'user_id' => 1, 
                    'title' => 'Peringatan ED Dekat!',
                    'message' => "Produk {$batch->product->name} (Batch: {$batch->batch_no}) akan kadaluarsa pada {$batch->expired_date}. Sisa stok: {$batch->qty_available}."
                ]);
            }
            $this->info("Menemukan {$nearExpiredBatches->count()} batch mendekati ED.");
        } else {
            $this->info("Tidak ada batch yang mendekati ED.");
        }
    }
}
