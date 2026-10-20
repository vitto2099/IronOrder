import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Tab from '#models/tab'

export type TableStatus = 'LIVRE' | 'OCUPADA' | 'CONTA_PEDIDA' | 'BILL_REQUESTED' | 'OPEN'

export class Table extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare number: number

  @column()
  declare capacity: number

  @column()
  declare status: TableStatus

  @column()
  declare token: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Tab)
  declare tabs: HasMany<typeof Tab>

  async activeTab(): Promise<Tab | null> {
    return Tab.query()
      .where('table_id', this.id)
      .whereIn('status', ['ABERTA', 'OPEN', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
      .orderBy('id', 'desc')
      .first()
  }
}

export default Table
