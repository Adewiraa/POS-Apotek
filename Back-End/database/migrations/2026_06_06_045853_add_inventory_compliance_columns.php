<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_lasa')->default(false)->after('classification');
            $table->boolean('is_high_alert')->default(false)->after('is_lasa');
        });

        Schema::table('stock_opnames', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_batch_id')->nullable()->constrained('product_batches')->cascadeOnDelete();
            $table->integer('system_qty')->default(0);
            $table->integer('actual_qty')->default(0);
            $table->integer('total_difference')->default(0);
            $table->string('reason')->nullable();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('product_batches', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_batches', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropColumn('location_id');
        });

        Schema::table('stock_opnames', function (Blueprint $table) {
            $table->dropForeign(['approver_id']);
            $table->dropColumn(['status', 'approver_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_lasa', 'is_high_alert']);
        });
    }
};
