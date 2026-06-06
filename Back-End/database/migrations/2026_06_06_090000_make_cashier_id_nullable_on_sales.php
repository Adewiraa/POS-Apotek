<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Drop the strict FK constraint
            $table->dropForeign(['cashier_id']);
            // Make cashier_id nullable (no FK enforcement for MVP)
            $table->unsignedBigInteger('cashier_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('cashier_id')->nullable(false)->change();
            $table->foreign('cashier_id')->references('id')->on('users');
        });
    }
};
