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
        // 1. Tambahkan prescription_id ke tabel sales
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('prescription_id')
                  ->nullable()
                  ->after('customer_id')
                  ->constrained('prescriptions')
                  ->nullOnDelete();
        });

        // 2. Buat tabel sales_returns (Retur Penjualan)
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_no')->unique();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->date('date');
            $table->string('status')->default('Completed');
            $table->text('reason');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 3. Buat tabel sales_return_items
        Schema::create('sales_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_return_id')->constrained('sales_returns')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_batch_id')->constrained('product_batches')->cascadeOnDelete();
            $table->integer('qty');
            $table->string('condition'); // Layak Jual, Karantina, Rusak
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_return_items');
        Schema::dropIfExists('sales_returns');
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['prescription_id']);
            $table->dropColumn('prescription_id');
        });
    }
};
