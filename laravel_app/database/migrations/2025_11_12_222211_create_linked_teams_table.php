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
        Schema::create('linked_teams', function (Blueprint $table) {
            $table->string('current_url');
            $table->string('old_team_url');

            $table->foreign('current_url')
                ->references('url')
                ->on('teams')
                ->onDelete('cascade');

            $table->foreign('old_team_url')
                ->references('url')
                ->on('teams')
                ->onDelete('cascade');

            $table->primary(['current_url', 'old_team_url']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('linked_teams');
    }
};
