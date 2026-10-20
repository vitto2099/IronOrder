import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

test.group('Auth | Redirecionamento Inteligente Pós-Login & Hubs', (group) => {
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

  test('ADMIN deve ser redirecionado para /admin/hub após login', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Admin Teste',
      email: 'admin@qrorder.local',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    })

    const response = await client.post('/login').withCsrfToken().redirects(0).form({
      email: admin.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/admin/hub')
  })

  test('GARCOM deve ser redirecionado diretamente para /staff/tables após login', async ({
    client,
  }) => {
    const waiter = await User.create({
      fullName: 'Garcom Teste',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const response = await client.post('/login').withCsrfToken().redirects(0).form({
      email: waiter.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/staff/tables')
  })

  test('COZINHA deve ser redirecionada diretamente para /kds após login', async ({ client }) => {
    const chef = await User.create({
      fullName: 'Cozinha Teste',
      email: 'cozinha@qrorder.local',
      password: 'password123',
      role: 'COZINHA',
      isActive: true,
    })

    const response = await client.post('/login').withCsrfToken().redirects(0).form({
      email: chef.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/kds')
  })

  test('GERENTE deve ser redirecionado para /manager/hub após login', async ({ client }) => {
    const manager = await User.create({
      fullName: 'Gerente Teste',
      email: 'gerente@qrorder.local',
      password: 'password123',
      role: 'GERENTE',
      isActive: true,
    })

    const response = await client.post('/login').withCsrfToken().redirects(0).form({
      email: manager.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/manager/hub')
  })

  test('CAIXA deve ser redirecionado para /cashier/hub após login', async ({ client }) => {
    const cashier = await User.create({
      fullName: 'Caixa Teste',
      email: 'caixa@qrorder.local',
      password: 'password123',
      role: 'CAIXA',
      isActive: true,
    })

    const response = await client.post('/login').withCsrfToken().redirects(0).form({
      email: cashier.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/cashier/hub')
  })

  test('usuário autenticado acessando raiz / deve ser redirecionado para seu hub', async ({
    client,
  }) => {
    const admin = await User.create({
      fullName: 'Admin Teste',
      email: 'admin@qrorder.local',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    })

    const response = await client.get('/').redirects(0).loginAs(admin)
    response.assertStatus(302)
    response.assertHeader('location', '/admin/hub')
  })

  test('visitante anônimo acessando raiz / recebe 200 OK', async ({ client }) => {
    const response = await client.get('/')
    response.assertStatus(200)
  })

  test('usuário autenticado acessando /login deve ser redirecionado para seu hub', async ({
    client,
  }) => {
    const waiter = await User.create({
      fullName: 'Garcom Teste',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const response = await client.get('/login').redirects(0).loginAs(waiter)
    response.assertStatus(302)
    response.assertHeader('location', '/staff/tables')
  })

  test('usuário autenticado acessando /signup deve ser redirecionado para seu hub', async ({
    client,
  }) => {
    const chef = await User.create({
      fullName: 'Chef Teste',
      email: 'chef@qrorder.local',
      password: 'password123',
      role: 'COZINHA',
      isActive: true,
    })

    const response = await client.get('/signup').redirects(0).loginAs(chef)
    response.assertStatus(302)
    response.assertHeader('location', '/kds')
  })

  test('endpoint universal /hub redireciona usuário autenticado para seu hub correspondente', async ({
    client,
  }) => {
    const manager = await User.create({
      fullName: 'Gerente Teste',
      email: 'gerente@qrorder.local',
      password: 'password123',
      role: 'GERENTE',
      isActive: true,
    })

    const response = await client.get('/hub').redirects(0).loginAs(manager)
    response.assertStatus(302)
    response.assertHeader('location', '/manager/hub')
  })

  test('alias /staff/kds redireciona para /kds', async ({ client }) => {
    const chef = await User.create({
      fullName: 'Chef Teste',
      email: 'chef@qrorder.local',
      password: 'password123',
      role: 'COZINHA',
      isActive: true,
    })

    const response = await client.get('/staff/kds').redirects(0).loginAs(chef)
    response.assertStatus(302)
    response.assertHeader('location', '/kds')
  })

  test('GARCOM tentando acessar /admin/hub deve receber 403 Forbidden', async ({ client }) => {
    const waiter = await User.create({
      fullName: 'Garcom Teste',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const response = await client.get('/admin/hub').loginAs(waiter)
    response.assertStatus(403)
  })

  test('GERENTE tentando acessar /admin/hub deve receber 403 Forbidden', async ({ client }) => {
    const manager = await User.create({
      fullName: 'Gerente Teste',
      email: 'gerente@qrorder.local',
      password: 'password123',
      role: 'GERENTE',
      isActive: true,
    })

    const response = await client.get('/admin/hub').loginAs(manager)
    response.assertStatus(403)
  })

  test('COZINHA tentando acessar /cashier/hub deve receber 403 Forbidden', async ({ client }) => {
    const chef = await User.create({
      fullName: 'Chef Teste',
      email: 'chef@qrorder.local',
      password: 'password123',
      role: 'COZINHA',
      isActive: true,
    })

    const response = await client.get('/cashier/hub').loginAs(chef)
    response.assertStatus(403)
  })

  test('ADMIN acessando /admin/hub deve receber 200 OK', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Admin Teste',
      email: 'admin@qrorder.local',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    })

    const response = await client.get('/admin/hub').loginAs(admin)
    response.assertStatus(200)
  })

  test('GERENTE acessando /manager/hub deve receber 200 OK', async ({ client }) => {
    const manager = await User.create({
      fullName: 'Gerente Teste',
      email: 'gerente@qrorder.local',
      password: 'password123',
      role: 'GERENTE',
      isActive: true,
    })

    const response = await client.get('/manager/hub').loginAs(manager)
    response.assertStatus(200)
  })

  test('CAIXA acessando /cashier/hub deve receber 200 OK', async ({ client }) => {
    const cashier = await User.create({
      fullName: 'Caixa Teste',
      email: 'caixa@qrorder.local',
      password: 'password123',
      role: 'CAIXA',
      isActive: true,
    })

    const response = await client.get('/cashier/hub').loginAs(cashier)
    response.assertStatus(200)
  })
})
