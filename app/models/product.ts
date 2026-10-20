import { ProductSchema } from '#database/schema'
import { belongsTo, beforeCreate, scope, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import string from '@adonisjs/core/helpers/string'
import Category from '#models/category'

export default class Product extends ProductSchema {
  @column({
    consume: (value: number | string) =>
      value !== null && value !== undefined ? Number(value) : value,
  })
  declare price: number

  @column({
    consume: (value: any) => Boolean(value),
  })
  declare isAvailable: boolean

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | string[] | null) => {
      if (!value) return null
      if (Array.isArray(value)) return value
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    },
  })
  declare tags: string[] | null

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  static available = scope((query) => {
    query.where('is_available', true).whereNull('deleted_at')
  })

  @beforeCreate()
  static async assignSlug(product: Product) {
    if (!product.slug && product.name) {
      product.slug = string.slug(product.name).toLowerCase()
    }
  }
}
