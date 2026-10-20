import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Order from '#models/order'
import Product from '#models/product'

export class OrderItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare productId: number | null

  @column()
  declare nameSnapshot: string

  @column({
    consume: (value: number | string) =>
      value !== null && value !== undefined ? Number(value) : value,
  })
  declare unitPrice: number

  @column()
  declare quantity: number

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  get subtotal(): number {
    return Number(this.unitPrice) * this.quantity
  }
}

export default OrderItem
