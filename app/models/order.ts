import { BaseModel, column, belongsTo, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import OrderItem from '#models/order_item'

export type OrderStatus =
  | 'ENVIADO'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'

export class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tabId: number

  @column()
  declare tabMemberId: number

  @column()
  declare status: OrderStatus

  @column()
  declare cancellationReason: string | null

  @column()
  declare cancelledByUserId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Tab)
  declare tab: BelongsTo<typeof Tab>

  @belongsTo(() => TabMember)
  declare member: BelongsTo<typeof TabMember>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  static active = scope((query) => {
    query.whereNotIn('status', ['CANCELADO', 'CANCELLED'])
  })

  static pendingKitchen = scope((query) => {
    query.whereIn('status', ['ENVIADO', 'EM_PREPARO', 'PENDING', 'PREPARING'])
  })
}

export default Order
