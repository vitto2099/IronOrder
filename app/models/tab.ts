import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Table from '#models/table'
import TabMember from '#models/tab_member'
import Order from '#models/order'

export type TabStatus = 'ABERTA' | 'FECHADA' | 'OPEN' | 'CLOSED' | 'BILL_REQUESTED'

export class Tab extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tableId: number

  @column()
  declare status: TabStatus

  @column.dateTime()
  declare openedAt: DateTime

  @column.dateTime()
  declare closedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Table)
  declare table: BelongsTo<typeof Table>

  @hasMany(() => TabMember)
  declare members: HasMany<typeof TabMember>

  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>
}

export default Tab
