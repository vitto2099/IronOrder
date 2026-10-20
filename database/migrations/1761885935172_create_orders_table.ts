import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tab_id').unsigned().references('id').inTable('tabs').onDelete('CASCADE')
      table
        .integer('tab_member_id')
        .unsigned()
        .references('id')
        .inTable('tab_members')
        .onDelete('CASCADE')
      table.string('status', 30).defaultTo('ENVIADO').notNullable()
      table.text('cancellation_reason').nullable()
      table.integer('cancelled_by_user_id').unsigned().nullable().references('id').inTable('users')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
