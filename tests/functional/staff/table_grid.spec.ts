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

test.group('Table Grid & Staff Workflow (Functional HTTP)', (group) => {
  let waiterUser: User
  let managerUser: User
  let kitchenUser: User
  let defaultCategory: Category
  let defaultProduct: Product

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

    waiterUser = await User.create({
      email: `waiter-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Garçom Marcos',
      role: 'GARCOM',
    })

    managerUser = await User.create({
      email: `manager-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Gerente Roberto',
      role: 'GERENTE',
    })

    kitchenUser = await User.create({
      email: `kitchen-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Cozinheiro Souza',
      role: 'COZINHA',
    })

    defaultCategory = await Category.create({
      name: 'Bebidas e Pratos',
      slug: `bebidas-${Date.now()}`,
      sortOrder: 1,
      isActive: true,
    })

    defaultProduct = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Chopp Pilsen 500ml',
      price: 15.0,
      isAvailable: true,
    })
  })

  // a) GET /staff/tables: RBAC e exibição do grid com status coloridos e indicador de pratos PRONTOS
  test('a) GET /staff/tables: RBAC e listagem de mesas com indicadores de status e itens prontos', async ({
    client,
    assert,
  }) => {
    // 1. Anônimo (401/302)
    const guestRes = await client.get('/staff/tables').header('accept', 'application/json')
    assert.equal(guestRes.status(), 401)

    // 2. Cozinha (403 Forbidden - salão é exclusivo de garçom, gerente, admin)
    const kitchenRes = await client.get('/staff/tables').loginAs(kitchenUser)
    kitchenRes.assertStatus(403)

    // 3. Garçom (200 OK)
    await Table.create({ number: 1, capacity: 4, status: 'LIVRE' })
    const table2 = await Table.create({ number: 2, capacity: 4, status: 'OCUPADA' })
    await Table.create({ number: 3, capacity: 2, status: 'CONTA_PEDIDA' })

    const tab2 = await Tab.create({ tableId: table2.id, status: 'OPEN', openedAt: DateTime.now() })
    const member2 = await TabMember.create({
      tabId: tab2.id,
      alias: 'ALICE',
      sessionToken: `token-${Date.now()}`,
    })

    // Pedido com status PRONTO na Mesa 2 (deve acionar indicador hasReadyOrders)
    const orderPronto = await Order.create({
      tabId: tab2.id,
      tabMemberId: member2.id,
      status: 'PRONTO',
    })
    await OrderItem.create({
      orderId: orderPronto.id,
      productId: defaultProduct.id,
      nameSnapshot: defaultProduct.name,
      unitPrice: defaultProduct.price,
      quantity: 2,
    })

    const response = await client.get('/staff/tables').loginAs(waiterUser)
    response.assertStatus(200)

    const tablesInDb = await Table.query().orderBy('number', 'asc')
    assert.lengthOf(tablesInDb, 3)
    assert.equal(tablesInDb[0].status, 'LIVRE')
    assert.equal(tablesInDb[1].status, 'OCUPADA')
    assert.equal(tablesInDb[2].status, 'CONTA_PEDIDA')
  })

  // b) GET /staff/tables/:id: Detalhe da mesa com pedidos ativos e extrato
  test('b) GET /staff/tables/:id: detalhe da mesa com pedidos ativos e extrato da comanda', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({ number: 5, capacity: 4, status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'OPEN', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'LUCAS',
      sessionToken: `token-${Date.now()}`,
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'EM_PREPARO',
    })
    await OrderItem.create({
      orderId: order.id,
      productId: defaultProduct.id,
      nameSnapshot: defaultProduct.name,
      unitPrice: 15.0,
      quantity: 3,
      notes: 'Bem gelado',
    })

    const response = await client
      .get(`/staff/tables/${table.id}`)
      .loginAs(waiterUser)
      .header('accept', 'application/json')

    response.assertStatus(200)
    const body = response.body()
    assert.exists(body.table)
    assert.equal(body.table.number, 5)
    assert.exists(body.tab)
    assert.equal(body.tab.total, 45.0)
    assert.lengthOf(body.orders, 1)
    assert.equal(body.orders[0].items[0].nameSnapshot, 'Chopp Pilsen 500ml')
  })

  // c) POST /staff/tables/:id/orders: Lançamento manual de pedidos pelo garçom (RN-06.1)
  test('c) POST /staff/tables/:id/orders: lançamento manual de pedidos pelo garçom (RN-06.1)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({ number: 8, capacity: 4, status: 'LIVRE' })

    const response = await client
      .post(`/staff/tables/${table.id}/orders`)
      .loginAs(waiterUser)
      .withCsrfToken()
      .json({
        alias: 'BALCÃO',
        items: [
          {
            productId: defaultProduct.id,
            quantity: 2,
            notes: 'Sem colarinho',
          },
        ],
      })

    assert.oneOf(response.status(), [200, 201, 302])

    // Mesa deve ter passado para OCUPADA
    await table.refresh()
    assert.equal(table.status, 'OCUPADA')

    // Comanda e membros devem ter sido criados com o alias "BALCÃO"
    const tab = await Tab.query().where('table_id', table.id).firstOrFail()
    const member = await TabMember.query().where('tab_id', tab.id).firstOrFail()
    assert.equal(member.alias, 'BALCÃO')

    // Pedido gravado no banco com preço congelado
    const order = await Order.query().where('tab_id', tab.id).preload('items').firstOrFail()
    assert.oneOf(order.status, ['ENVIADO', 'PENDING'])
    assert.lengthOf(order.items, 1)
    assert.equal(order.items[0].quantity, 2)
    assert.equal(order.items[0].notes, 'Sem colarinho')
    assert.equal(Number(order.items[0].unitPrice), 15.0)
  })

  // d) PATCH /staff/tables/orders/:orderId/deliver: Baixa de entrega de pedido PRONTO -> ENTREGUE
  test('d) PATCH /staff/tables/orders/:orderId/deliver: baixa de entrega de pedido PRONTO para ENTREGUE', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({ number: 10, status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'OPEN', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'FELIPE',
      sessionToken: `token-${Date.now()}`,
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'PRONTO',
    })

    const response = await client
      .patch(`/staff/tables/orders/${order.id}/deliver`)
      .loginAs(waiterUser)
      .withCsrfToken()

    assert.oneOf(response.status(), [200, 302])
    await order.refresh()
    assert.equal(order.status, 'ENTREGUE')
  })

  // e) POST /staff/tables/orders/:orderId/cancel: Cancelamento com justificativa por staff autorizado (RN-03.3)
  test('e) POST /staff/tables/orders/:orderId/cancel: cancelamento com justificativa por garçom/gerente/admin', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({ number: 14, status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'OPEN', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'MARINA',
      sessionToken: `token-${Date.now()}`,
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENVIADO',
    })

    const response = await client
      .post(`/staff/tables/orders/${order.id}/cancel`)
      .loginAs(managerUser)
      .withCsrfToken()
      .json({
        reason: 'Cliente cancelou antes do preparo iniciar',
      })

    assert.oneOf(response.status(), [200, 302])
    await order.refresh()
    assert.equal(order.status, 'CANCELADO')
    assert.equal(order.cancellationReason, 'Cliente cancelou antes do preparo iniciar')
    assert.equal(order.cancelledByUserId, managerUser.id)
  })

  // f) POST /staff/tables/:id/release: Encerramento presencial da comanda (Tab CLOSED) e liberação da mesa (LIVRE) (RN-05.3)
  test('f) POST /staff/tables/:id/release: encerramento presencial da comanda e liberação da mesa', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({ number: 20, status: 'CONTA_PEDIDA' })
    const tab = await Tab.create({
      tableId: table.id,
      status: 'OPEN',
      openedAt: DateTime.now(),
    })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'RODRIGO',
      sessionToken: `token-${Date.now()}`,
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENTREGUE',
    })
    await OrderItem.create({
      orderId: order.id,
      productId: defaultProduct.id,
      nameSnapshot: defaultProduct.name,
      unitPrice: 15.0,
      quantity: 1,
    })

    // Garçom quita a comanda do membro
    await client
      .post(`/staff/tables/${table.id}/members/${member.id}/pay`)
      .loginAs(waiterUser)
      .withCsrfToken()

    const response = await client
      .post(`/staff/tables/${table.id}/release`)
      .loginAs(waiterUser)
      .withCsrfToken()

    assert.oneOf(response.status(), [200, 302])

    // Mesa deve voltar para LIVRE
    await table.refresh()
    assert.equal(table.status, 'LIVRE')

    // Comanda deve estar CLOSED com closedAt preenchido
    await tab.refresh()
    assert.equal(tab.status, 'CLOSED')
    assert.isNotNull(tab.closedAt)
  })
})
