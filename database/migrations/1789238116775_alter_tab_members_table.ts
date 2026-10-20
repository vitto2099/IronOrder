import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tab_members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status', 30).notNullable().defaultTo('OPEN')
      table.timestamp('paid_at').nullable()
      table.timestamp('closed_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
      table.dropColumn('paid_at')
      table.dropColumn('closed_at')
    })
  }
}
