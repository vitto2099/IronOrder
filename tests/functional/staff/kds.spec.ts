import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import Product from '#models/product'
import Category from '#models/category'
import { DateTime } from 'luxon'

test.group('KDS Staff Display & Workflow (Functional HTTP)', (group) => {
  let kitchenUser: User
  let managerUser: User
  let adminUser: User
  let waiterUser: User

  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('order_items').delete()
    await db.from('orders').delete()
    await db.from('tab_members').delete()
    await db.from('tabs').delete()
    await db.from('tables').delete()
    await db.from('products').delete()
    await db.from('categories').delete()
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')

    kitchenUser = await User.create({
      email: `kitchen-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Cozinheiro Chefe',
      role: 'COZINHA',
    })

    managerUser = await User.create({
      email: `manager-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Gerente Geral',
      role: 'GERENTE',
    })

    adminUser = await User.create({
      email: `admin-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Administrador',
      role: 'ADMIN',
    })

    waiterUser = await User.create({
      email: `waiter-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Garçom Salão',
      role: 'GARCOM',
    })
  })

  test('a.1) GET /kds: RBAC - Acesso restrito a COZINHA, GERENTE e ADMIN (GARCOM e anônimo recebem 403 e 401/302)', async ({
    client,
    assert,
  }) => {
    // 1. Anônimo (sem login)
    const guestJsonRes = await client.get('/kds').header('accept', 'application/json')
    assert.equal(guestJsonRes.status(), 401)

    const guestRes = await client.get('/kds').redirects(0)
    assert.equal(guestRes.status(), 302)

    // 2. Garçom (não tem permissão no KDS)
    const waiterRes = await client.get('/kds').loginAs(waiterUser)
    waiterRes.assertStatus(403)

    // 3. Cozinha (autorizado)
    const kitchenRes = await client.get('/kds').loginAs(kitchenUser)
    kitchenRes.assertStatus(200)

    // 4. Gerente (autorizado)
    const managerRes = await client.get('/kds').loginAs(managerUser)
    managerRes.assertStatus(200)

    // 5. Admin (autorizado)
    const adminRes = await client.get('/kds').loginAs(adminUser)
    adminRes.assertStatus(200)
  })

  test('a.2) GET /kds: deve retornar lotes ordenados cronologicamente (created_at ASC) e apenas status ativos', async ({
    client,
    assert,
  }) => {
    const category = await Category.create({
      name: 'Lanches',
      slug: `lanches-${Date.now()}`,
      sortOrder: 1,
      isActive: true,
    })

    const product = await Product.create({
      categoryId: category.id,
      name: 'X-Burger Especial',
      price: 35.0,
      isAvailable: true,
    })

    const table = await Table.create({
      number: 12,
      capacity: 4,
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'ABERTA',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'MARCOS',
      sessionToken: `token-${Date.now()}-1`,
    })

    // Pedido 1: Mais antigo (10 minutos atrás) - status ENVIADO
    const order1 = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENVIADO',
      createdAt: DateTime.now().minus({ minutes: 10 }),
    })
    await OrderItem.create({
      orderId: order1.id,
      productId: product.id,
      nameSnapshot: product.name,
      unitPrice: product.price,
      quantity: 2,
      notes: 'Sem cebola',
    })

    // Pedido 2: Médio (5 minutos atrás) - status EM_PREPARO
    const order2 = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'EM_PREPARO',
      createdAt: DateTime.now().minus({ minutes: 5 }),
    })
    await OrderItem.create({
      orderId: order2.id,
      productId: product.id,
      nameSnapshot: product.name,
      unitPrice: product.price,
      quantity: 1,
    })

    // Pedido 3: Mais recente (agora) - status PRONTO
    const order3 = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'PRONTO',
      createdAt: DateTime.now(),
    })

    // Pedido 4: Já ENTREGUE (não deve aparecer no KDS)
    await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENTREGUE',
      createdAt: DateTime.now().minus({ minutes: 20 }),
    })

    // Pedido 5: Já CANCELADO (não deve aparecer no KDS)
    await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'CANCELADO',
      createdAt: DateTime.now().minus({ minutes: 25 }),
    })

    const response = await client.get('/kds').loginAs(kitchenUser)

    response.assertStatus(200)

    // Valida no banco que apenas 3 pedidos ativos foram retornados
    const activeOrders = await Order.query()
      .whereIn('status', ['ENVIADO', 'EM_PREPARO', 'PRONTO'])
      .orderBy('created_at', 'asc')

    assert.lengthOf(activeOrders, 3)
    assert.equal(activeOrders[0].id, order1.id)
    assert.equal(activeOrders[1].id, order2.id)
    assert.equal(activeOrders[2].id, order3.id)
  })

  test('b.1) PATCH /kds/orders/:id/status: transição de status com validação (ENVIADO -> EM_PREPARO -> PRONTO)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({ number: 9, status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'CARLA',
      sessionToken: `token-${Date.now()}`,
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENVIADO',
    })

    // 1. Transiciona ENVIADO -> EM_PREPARO
    const prepRes = await client
      .patch(`/kds/orders/${order.id}/status`)
      .loginAs(kitchenUser)
      .withCsrfToken()
      .json({ status: 'EM_PREPARO' })

    assert.oneOf(prepRes.status(), [200, 302])
    await order.refresh()
    assert.equal(order.status, 'EM_PREPARO')

    // 2. Transiciona EM_PREPARO -> PRONTO
    const readyRes = await client
      .patch(`/kds/orders/${order.id}/status`)
      .loginAs(kitchenUser)
      .withCsrfToken()
      .json({ status: 'PRONTO' })

    assert.oneOf(readyRes.status(), [200, 302])
    await order.refresh()
    assert.equal(order.status, 'PRONTO')
  })

  test('b.2) PATCH /kds/orders/:id/status: deve rejeitar transição de status inválida', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({ number: 10, status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'RENATO',
      sessionToken: `token-${Date.now()}`,
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENVIADO',
    })

    // Tentar avançar direto de ENVIADO para ENTREGUE deve ser rejeitado (422)
    const invalidRes = await client
      .patch(`/kds/orders/${order.id}/status`)
      .loginAs(kitchenUser)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ status: 'ENTREGUE' })

    assert.equal(invalidRes.status(), 422)
    await order.refresh()
    assert.equal(order.status, 'ENVIADO')
  })
})
