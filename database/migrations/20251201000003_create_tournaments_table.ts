import { Knex } from "knex";

export async function up(knex: Knex) {
  return knex.schema.createTable('tournaments', function(table) {
    table.bigIncrements('id').unsigned().primary();
    table.bigInteger('page_id').unsigned().notNullable();
    table.string('path_name', 255).notNullable().unique();
    table.string('name', 255).notNullable();
    table.json('alt_names').notNullable();
    table.string('series', 255).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.integer('no_participants').unsigned().notNullable();
    table.boolean('has_been_checked').notNullable().defaultTo(false);

    table.index('name');
  });
};

export async function down(knex: Knex) {
  return knex.schema.dropTable('tournaments');
};
