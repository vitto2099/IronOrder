import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('category_id')
        .unsigned()
        .references('id')
        .inTable('categories')
        .onDelete('RESTRICT')
        .notNullable()
      table.string('name', 150).notNullable()
      table.string('slug', 180).notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('image_url', 500).nullable()
      table.boolean('is_available').defaultTo(true).notNullable()
      table.json('tags').nullable()
      table.timestamp('deleted_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
