import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { randomBytes } from 'node:crypto'
import Table from '#models/table'

export default class extends BaseSeeder {
  async run() {
    for (let i = 1; i <= 15; i++) {
      const existingTable = await Table.findBy('number', i)
      await Table.updateOrCreate(
        { number: i },
        {
          number: i,
          capacity: i <= 5 ? 2 : i <= 12 ? 4 : 6,
          status: existingTable ? existingTable.status : 'LIVRE',
          token: existingTable?.token || randomBytes(16).toString('hex'),
        }
      )
    }
  }
}
