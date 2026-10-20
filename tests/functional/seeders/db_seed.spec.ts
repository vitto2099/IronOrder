import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'
import Table from '#models/table'
import UserSeeder from '#database/seeders/01_user_seeder'
import CatalogSeeder from '#database/seeders/02_catalog_seeder'
import TableSeeder from '#database/seeders/03_table_seeder'

test.group('Database Seeders | Provisionamento Inicial', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('order_items').delete()
    await db.from('orders').delete()
    await db.from('tab_members').delete()
    await db.from('tabs').delete()
    await db.from('products').delete()
    await db.from('categories').delete()
    await db.from('tables').delete()
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('deve provisionar admin e todo o staff com credenciais funcionais', async ({ assert }) => {
    const userSeeder = new UserSeeder(db.connection())
    await userSeeder.run()

    const users = await User.all()
    assert.lengthOf(users, 5)

    // Testa verificação de credenciais para cada role
    const admin = await User.verifyCredentials('admin@qrorder.local', 'admin123456')
    assert.isNotNull(admin)
    assert.equal(admin.role, 'ADMIN')
    assert.isTrue(admin.isActive)

    const waiter = await User.verifyCredentials('garcom@qrorder.local', 'garcom123')
    assert.isNotNull(waiter)
    assert.equal(waiter.role, 'GARCOM')

    const kitchen = await User.verifyCredentials('cozinha@qrorder.local', 'cozinha123')
    assert.isNotNull(kitchen)
    assert.equal(kitchen.role, 'COZINHA')

    const manager = await User.verifyCredentials('gerente@qrorder.local', 'gerente123')
    assert.isNotNull(manager)
    assert.equal(manager.role, 'GERENTE')

    const cashier = await User.verifyCredentials('caixa@qrorder.local', 'caixa123')
    assert.isNotNull(cashier)
    assert.equal(cashier.role, 'CAIXA')
  })

  test('deve garantir idempotência absoluta ao re-executar seeders consecutivamente', async ({
    assert,
  }) => {
    const userSeeder = new UserSeeder(db.connection())
    const catalogSeeder = new CatalogSeeder(db.connection())
    const tableSeeder = new TableSeeder(db.connection())

    // Primeira execução
    await userSeeder.run()
    await catalogSeeder.run()
    await tableSeeder.run()

    // Segunda execução consecutiva
    await userSeeder.run()
    await catalogSeeder.run()
    await tableSeeder.run()

    const usersCount = await User.query().count('* as total')
    const categoriesCount = await Category.query().count('* as total')
    const productsCount = await Product.query().count('* as total')
    const tablesCount = await Table.query().count('* as total')

    assert.equal(Number(usersCount[0].$extras.total), 5)
    assert.equal(Number(categoriesCount[0].$extras.total), 4)
    assert.equal(Number(productsCount[0].$extras.total), 12)
    assert.equal(Number(tablesCount[0].$extras.total), 15)
  })

  test('deve preservar os tokens existentes das mesas na re-execução', async ({ assert }) => {
    const tableSeeder = new TableSeeder(db.connection())
    await tableSeeder.run()

    const table1Before = await Table.findByOrFail('number', 1)
    const tokenBefore = table1Before.token

    await tableSeeder.run()

    const table1After = await Table.findByOrFail('number', 1)
    assert.equal(table1After.token, tokenBefore)
  })
})
