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
        Schema::create('prescription_compound_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compound_id')->constrained('prescription_compounds')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('qty_used', 8, 2); // Bisa desimal misal 0.5 tablet
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescription_compound_items');
    }
};
