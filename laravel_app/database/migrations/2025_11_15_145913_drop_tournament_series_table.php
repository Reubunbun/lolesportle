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
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropForeign(['series_url']);
            $table->dropColumn('series_url');
        });

        Schema::dropIfExists('tournament_series');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
