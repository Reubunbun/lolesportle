import { Knex } from 'knex';

export async function up(knex: Knex) {
  return knex.schema.alterTable('tournaments', function (table) {
    table.timestamp('time_checked').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex) {
  return knex.schema.alterTable('tournaments', function (table) {
    table.dropColumn('time_checked');
  });
}
