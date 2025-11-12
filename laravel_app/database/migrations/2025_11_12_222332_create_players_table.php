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
        Schema::create('players', function (Blueprint $table) {
            $table->string('url')->primary();
            $table->string('name')->nullable();
            $table->boolean('is_active')->default(false);
            $table->date('birth_date')->nullable();
            $table->string('icon_path')->nullable();
            $table->json('positions')->nullable();
            $table->timestamp('last_checked')
               ->default(date('Y-m-d H:i:s', 1));
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
