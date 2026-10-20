import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

test.group('E2E Browser: Navegação Pós-Login e Hubs Operacionais', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    if (await db.connection().schema.hasTable('order_items')) {
      await db.from('order_items').delete()
    }
    if (await db.connection().schema.hasTable('orders')) {
      await db.from('orders').delete()
    }
    if (await db.connection().schema.hasTable('tab_members')) {
      await db.from('tab_members').delete()
    }
    if (await db.connection().schema.hasTable('tabs')) {
      await db.from('tabs').delete()
    }
    if (await db.connection().schema.hasTable('tables')) {
      await db.from('tables').delete()
    }
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('login de ADMIN renderiza Admin Hub com cards operacionais e métricas', async ({
    visit,
  }) => {
    await User.create({
      fullName: 'Super Administrador',
      email: 'admin@qrorder.local',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    })

    const page = await visit('/login')
    await page.fill('input[name="email"]', 'admin@qrorder.local')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin/hub')
    await page.assertPath('/admin/hub')
    await page.assertVisible('h1')
    await page.assertTextContains('h1', 'Super Administrador')
    await page.assertVisible('.grid a[href="/admin/staff"]')
    await page.assertVisible('.grid a[href="/admin/tables"]')
    await page.assertVisible('.grid a[href="/admin/catalog"]')
  })

  test('login de GARCOM redireciona visualmente direto para o Grid de Mesas', async ({ visit }) => {
    await User.create({
      fullName: 'Garçom de Salão',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const page = await visit('/login')
    await page.fill('input[name="email"]', 'garcom@qrorder.local')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/staff/tables')
    await page.assertPath('/staff/tables')
    await page.assertVisible('h1')
    await page.assertTextContains('h1', 'Mesas')
  })
})
