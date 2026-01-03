import { Knex } from 'knex';

export async function up(knex: Knex) {
  return knex.schema.alterTable('tournaments', function (table) {
    table.integer('tier');
  });
}

export async function down(knex: Knex) {
  return knex.schema.alterTable('tournaments', function (table) {
    table.dropColumn('tier');
  });
}
