import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tabs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('table_id').unsigned().references('id').inTable('tables').onDelete('CASCADE')
      table.string('status', 30).defaultTo('ABERTA').notNullable()
      table.timestamp('opened_at').notNullable()
      table.timestamp('closed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
