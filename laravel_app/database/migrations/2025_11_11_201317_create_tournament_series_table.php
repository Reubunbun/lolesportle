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
        Schema::create('tournament_series', function (Blueprint $table) {
            $table->string('url')->primary();
            $table->string('name')->nullable();
            $table->string('big_icon_path')->nullable();
            $table->string('small_icon_path')->nullable();
            $table->integer('rank')->nullable();
            $table->timestamp('last_checked')
                ->default(date('Y-m-d H:i:s', 1));
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};
