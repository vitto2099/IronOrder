import { CategorySchema } from '#database/schema'
import { hasMany, beforeCreate, scope, column } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import string from '@adonisjs/core/helpers/string'
import Product from '#models/product'

export default class Category extends CategorySchema {
  @column({
    consume: (value: any) => Boolean(value),
  })
  declare isActive: boolean

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  static active = scope((query) => {
    query.where('is_active', true)
  })

  @beforeCreate()
  static async assignSlug(category: Category) {
    if (!category.slug && category.name) {
      category.slug = string.slug(category.name).toLowerCase()
    }
  }
}
