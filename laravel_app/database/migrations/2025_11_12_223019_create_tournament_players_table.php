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
        Schema::create('tournament_players', function (Blueprint $table) {
            $table->string('tournament_url');
            $table->string('player_url');
            $table->string('team_url');
            $table->unsignedInteger('position');
            $table->unsignedInteger('beat_percent');

            $table->foreign('tournament_url')
                ->references('url')
                ->on('tournaments')
                ->onDelete('cascade');

            $table->foreign('player_url')
                ->references('url')
                ->on('players')
                ->onDelete('cascade');

            $table->foreign('team_url')
                ->references('url')
                ->on('teams')
                ->onDelete('cascade');

            $table->primary(['tournament_url', 'player_url']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_players');
    }
};
