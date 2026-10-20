import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Tab from '#models/tab'
import Order from '#models/order'

export type TabMemberStatus = 'OPEN' | 'BILL_REQUESTED' | 'PAID'

export class TabMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tabId: number

  @column()
  declare alias: string

  @column()
  declare sessionToken: string

  @column()
  declare status: TabMemberStatus

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare closedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Tab)
  declare tab: BelongsTo<typeof Tab>

  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>
}

export default TabMember
