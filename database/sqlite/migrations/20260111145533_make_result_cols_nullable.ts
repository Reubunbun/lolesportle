import { Knex } from 'knex';

export async function up(knex: Knex) {
  return knex.schema.alterTable('tournament_results', function (table) {
    table.string('position', 255).nullable().alter();
    table.integer('beat_percent').unsigned().nullable().alter();
    table.double('liquipedia_weight').nullable().alter();
  });
}

export async function down(knex: Knex) {
  return knex.schema.alterTable('tournament_results', function (table) {
    table.string('position', 255).notNullable().alter();
    table.integer('beat_percent').unsigned().notNullable().alter();
    table.double('liquipedia_weight').notNullable().alter();
  });
}
