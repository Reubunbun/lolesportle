import { Knex } from "knex";

export async function up(knex: Knex) {
  return knex.schema.createTable('players', function(table) {
    table.bigIncrements('id').unsigned().primary();
    table.bigInteger('page_id').unsigned().notNullable();
    table.string('path_name', 255).notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('alt_names', 255).notNullable();
    table.date('birth_date');
    table.json('nationalities').notNullable();
    table.json('signature_champions').notNullable();
    table.json('roles').notNullable();

    table.index('name');
  });
};

export async function down(knex: Knex) {
  return knex.schema.dropTable('players');
};
