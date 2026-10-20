import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import { DateTime } from 'luxon'

test.group('Client Tab Statement & Bill Request (Functional HTTP) - TASK-09', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('order_items').delete()
    await db.from('orders').delete()
    await db.from('tab_members').delete()
    await db.from('tabs').delete()
    await db.from('tables').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('a) GET /m/:tableNumber/tab retorna extrato com total geral, mySubtotal e detalhamento por alias (RN-04.1)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 5,
      capacity: 4,
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'OPEN',
      openedAt: DateTime.now(),
    })

    const lucas = await TabMember.create({
      tabId: tab.id,
      alias: 'LUCAS',
      sessionToken: 'token-lucas-12345678901234567890123456',
    })

    const mariana = await TabMember.create({
      tabId: tab.id,
      alias: 'MARIANA',
      sessionToken: 'token-mariana-12345678901234567890123456',
    })

    // Pedido do Lucas: 1x Hambúrguer Artesanal (R$ 30,00)
    const order1 = await Order.create({
      tabId: tab.id,
      tabMemberId: lucas.id,
      status: 'ENVIADO',
    })
    await OrderItem.create({
      orderId: order1.id,
      nameSnapshot: 'Hambúrguer Artesanal',
      unitPrice: 30.0,
      quantity: 1,
    })

    // Pedido da Mariana: 2x Chopp 500ml (2x R$ 15,00 = R$ 30,00)
    const order2 = await Order.create({
      tabId: tab.id,
      tabMemberId: mariana.id,
      status: 'ENTREGUE',
    })
    await OrderItem.create({
      orderId: order2.id,
      nameSnapshot: 'Chopp 500ml',
      unitPrice: 15.0,
      quantity: 2,
    })

    // Lucas requisita o extrato da mesa
    const response = await client
      .get('/m/5/tab')
      .withEncryptedCookie('tab_session', {
        memberId: lucas.id,
        sessionToken: lucas.sessionToken,
        tableNumber: 5,
      })
      .header('accept', 'application/json')

    response.assertStatus(200)

    const data = response.body()
    assert.equal(data.tableNumber, 5)
    assert.equal(data.tableTotal, 60.0)
    assert.equal(data.mySubtotal, 30.0)
    assert.equal(data.tableStatus, 'OCUPADA')
    assert.isArray(data.membersBreakdown)
    assert.lengthOf(data.membersBreakdown, 2)

    const lucasBreakdown = data.membersBreakdown.find((m: any) => m.alias === 'LUCAS')
    assert.isDefined(lucasBreakdown)
    assert.equal(lucasBreakdown.subtotal, 30.0)
    assert.lengthOf(lucasBreakdown.items, 1)

    const marianaBreakdown = data.membersBreakdown.find((m: any) => m.alias === 'MARIANA')
    assert.isDefined(marianaBreakdown)
    assert.equal(marianaBreakdown.subtotal, 30.0)
    assert.lengthOf(marianaBreakdown.items, 1)
  })

  test('b) Pedidos CANCELADOS devem ser excluídos dos totais e do consumo faturável (RN-04.2)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 6,
      capacity: 4,
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'OPEN',
      openedAt: DateTime.now(),
    })

    const lucas = await TabMember.create({
      tabId: tab.id,
      alias: 'LUCAS',
      sessionToken: 'token-lucas-cancel-123456789012345678',
    })

    // Pedido Válido: 1x Suco de Laranja (R$ 12,00)
    const validOrder = await Order.create({
      tabId: tab.id,
      tabMemberId: lucas.id,
      status: 'ENTREGUE',
    })
    await OrderItem.create({
      orderId: validOrder.id,
      nameSnapshot: 'Suco de Laranja',
      unitPrice: 12.0,
      quantity: 1,
    })

    // Pedido Cancelado: 1x Vinho Tinto (R$ 90,00)
    const cancelledOrder = await Order.create({
      tabId: tab.id,
      tabMemberId: lucas.id,
      status: 'CANCELADO',
      cancellationReason: 'Cliente desistiu',
    })
    await OrderItem.create({
      orderId: cancelledOrder.id,
      nameSnapshot: 'Vinho Tinto',
      unitPrice: 90.0,
      quantity: 1,
    })

    const response = await client
      .get('/m/6/tab')
      .withEncryptedCookie('tab_session', {
        memberId: lucas.id,
        sessionToken: lucas.sessionToken,
        tableNumber: 6,
      })
      .header('accept', 'application/json')

    response.assertStatus(200)

    const data = response.body()
    // Total não deve conter os R$ 90,00 cancelados
    assert.equal(data.mySubtotal, 12.0)
    assert.equal(data.tableTotal, 12.0)

    const lucasBreakdown = data.membersBreakdown.find((m: any) => m.alias === 'LUCAS')
    assert.equal(lucasBreakdown.subtotal, 12.0)
    // Itens ativos faturáveis
    const nonCancelledItems = lucasBreakdown.items.filter((i: any) => i.status !== 'CANCELADO')
    assert.lengthOf(nonCancelledItems, 1)
    assert.equal(nonCancelledItems[0].name, 'Suco de Laranja')
  })

  test('c) POST /m/:tableNumber/request-bill transiciona a mesa para CONTA_PEDIDA (RN-05.1)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 7,
      capacity: 4,
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'OPEN',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'ANA',
      sessionToken: 'token-ana-request-123456789012345678',
    })

    const response = await client
      .post('/m/7/request-bill')
      .withCsrfToken()
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 7,
      })
      .redirects(0)

    response.assertStatus(302)

    await table.refresh()
    assert.equal(table.status, 'CONTA_PEDIDA')

    // Na consulta seguinte do extrato, tableStatus deve ser CONTA_PEDIDA
    const tabRes = await client
      .get('/m/7/tab')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 7,
      })
      .header('accept', 'application/json')

    tabRes.assertStatus(200)
    assert.equal(tabRes.body().tableStatus, 'CONTA_PEDIDA')
  })

  test('d) Bloqueio de novas solicitações se comanda estiver CLOSED', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 8,
      capacity: 4,
      status: 'LIVRE',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'CLOSED',
      openedAt: DateTime.now().minus({ hours: 2 }),
      closedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'PEDRO',
      sessionToken: 'token-pedro-closed-123456789012345678',
    })

    // Tentativa de acessar /m/8/tab com comanda encerrada: ClientSessionMiddleware deve redirecionar para /m/8
    const tabResponse = await client
      .get('/m/8/tab')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 8,
      })
      .redirects(0)

    tabResponse.assertStatus(302)
    assert.equal(tabResponse.header('location'), '/m/8')

    // Tentativa de solicitar conta em comanda fechada
    const billResponse = await client
      .post('/m/8/request-bill')
      .withCsrfToken()
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 8,
      })
      .redirects(0)

    billResponse.assertStatus(302)
    assert.equal(billResponse.header('location'), '/m/8')
  })
})
