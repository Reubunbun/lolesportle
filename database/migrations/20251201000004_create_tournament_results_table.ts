import { Knex } from "knex";

export async function up(knex: Knex) {
  return knex.schema.createTable('tournament_results', function(table) {
    table.bigIncrements('id').unsigned().primary();
    table.string('tournament_path', 255).notNullable();
    table.string('player_path', 255).notNullable();
    table.string('team_path', 255).notNullable();
    table.string('position', 255).notNullable();
    table.integer('beat_percent').unsigned().notNullable();
    table.double('liquipedia_weight').notNullable();

    table.unique(['tournament_path', 'player_path', 'team_path']);

    table.index('player_path');
    table.index('team_path');
    table.index('liquipedia_weight');
  });
};

export async function down(knex: Knex) {
  return knex.schema.dropTable('tournament_results');
};
