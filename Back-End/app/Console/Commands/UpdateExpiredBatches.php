<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inventory\ProductBatch;
use Carbon\Carbon;

class UpdateExpiredBatches extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'inventory:update-expired';

    /**
     * The description of the console command.
     */
    protected $description = 'Updates product batches status to Expired if they pass their expiration date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();
        
        $updatedCount = ProductBatch::where('expired_date', '<', $today)
            ->where('status', '!=', 'Expired')
            ->update(['status' => 'Expired']);

        $this->info("Successfully updated {$updatedCount} expired batches to 'Expired'.");
    }
}
