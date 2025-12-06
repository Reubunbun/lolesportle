import { Knex } from "knex";

export async function up(knex: Knex) {
  return knex.schema.createTable('teams', function(table) {
    table.bigIncrements('id').unsigned().primary();
    table.bigInteger('page_id').unsigned();
    table.string('path_name', 255).notNullable().unique();
    table.string('name', 255).notNullable();

    table.index('name');
  });
};

export async function down(knex: Knex) {
  return knex.schema.dropTable('teams');
};
