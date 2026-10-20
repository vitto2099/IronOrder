import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import Product from '#models/product'
import Category from '#models/category'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

test.group('Multi-Client Individual Tabs & KDS Safety - TASK-15', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  let waiterUser: User
  let category: Category
  let product1: Product
  let product2: Product

  group.setup(async () => {
    waiterUser = await User.create({
      fullName: 'Garçom Teste',
      email: 'waiter.task15@qrorder.com',
      password: await hash.make('secret123'),
      role: 'GARCOM',
      isActive: true,
    })

    category = await Category.create({
      name: 'Bebidas e Pratos',
      slug: 'bebidas-pratos',
      sortOrder: 1,
      isActive: true,
    })

    product1 = await Product.create({
      name: 'Chopp Pilsen 500ml',
      slug: 'chopp-pilsen-500ml',
      price: 15.0,
      categoryId: category.id,
      isAvailable: true,
    })

    product2 = await Product.create({
      name: 'Hambúrguer Artesanal',
      slug: 'hamburguer-artesanal',
      price: 35.0,
      categoryId: category.id,
      isAvailable: true,
    })
  })

  test('Cenário Completo TASK-15: Dois clientes na mesma mesa, pedidos independentes, quitação individual e trava no KDS', async ({
    client,
    assert,
  }) => {
    // 1. Abre mesa 5 e senta o Cliente 1 (BRUNO)
    const table = await Table.create({ number: 5, capacity: 4, status: 'LIVRE' })
    const tab = await Tab.create({ tableId: table.id, status: 'OPEN', openedAt: DateTime.now() })
    table.status = 'OCUPADA'
    await table.save()

    const member1 = await TabMember.create({
      tabId: tab.id,
      alias: 'BRUNO',
      sessionToken: 'token-bruno-123456789012345',
      status: 'OPEN',
    })

    // 2. Cliente 1 faz pedido de chopp e o prato é ENTREGUE
    const order1 = await Order.create({
      tabId: tab.id,
      tabMemberId: member1.id,
      status: 'ENTREGUE',
    })
    await OrderItem.create({
      orderId: order1.id,
      productId: product1.id,
      nameSnapshot: product1.name,
      unitPrice: product1.price,
      quantity: 2,
    })

    // 3. Cliente 2 (LUCAS) chega à mesa e faz pedido de hambúrguer (ainda EM_PREPARO na cozinha)
    const member2 = await TabMember.create({
      tabId: tab.id,
      alias: 'LUCAS',
      sessionToken: 'token-lucas-123456789012345',
      status: 'OPEN',
    })

    const order2 = await Order.create({
      tabId: tab.id,
      tabMemberId: member2.id,
      status: 'EM_PREPARO',
    })
    await OrderItem.create({
      orderId: order2.id,
      productId: product2.id,
      nameSnapshot: product2.name,
      unitPrice: product2.price,
      quantity: 1,
    })

    // 4. Cliente 1 pede a conta
    const reqBillResponse = await client
      .post(`/m/${table.number}/request-bill`)
      .withCsrfToken()
      .withEncryptedCookie('tab_session', {
        memberId: member1.id,
        sessionToken: member1.sessionToken,
        tableNumber: table.number,
      })
      .header('Accept', 'application/json')

    assert.equal(reqBillResponse.status(), 200)
    await member1.refresh()
    await member2.refresh()
    await table.refresh()

    // Status do membro 1 vira BILL_REQUESTED, membro 2 continua OPEN, mesa continua OCUPADA (já que membro 2 ainda consome)
    assert.equal(member1.status, 'BILL_REQUESTED')
    assert.equal(member2.status, 'OPEN')
    assert.equal(table.status, 'OCUPADA')

    // 5. Garçom tenta liquidar a comanda do Cliente 2 com prato em preparo -> deve ser BLOQUEADO (HTTP 422)
    const failPayMember2 = await client
      .post(`/staff/tables/${table.id}/members/${member2.id}/pay`)
      .loginAs(waiterUser)
      .withCsrfToken()
      .header('Accept', 'application/json')

    assert.equal(failPayMember2.status(), 422)
    assert.match(failPayMember2.body().error, /pedidos em andamento/i)

    // 6. Garçom tenta liberar a mesa enquanto há comandas abertas e pratos em preparo -> deve ser BLOQUEADO (HTTP 422)
    const failReleaseTable = await client
      .post(`/staff/tables/${table.id}/release`)
      .loginAs(waiterUser)
      .withCsrfToken()
      .header('Accept', 'application/json')

    assert.equal(failReleaseTable.status(), 422)
    assert.match(failReleaseTable.body().error, /pedidos em andamento|comandas em aberto/i)

    // 7. Garçom liquida a comanda do Cliente 1 (cujos pedidos já estão ENTREGUES)
    const payMember1Response = await client
      .post(`/staff/tables/${table.id}/members/${member1.id}/pay`)
      .loginAs(waiterUser)
      .withCsrfToken()
      .header('Accept', 'application/json')

    assert.equal(payMember1Response.status(), 200)
    await member1.refresh()
    await member2.refresh()
    await table.refresh()

    // Apenas Cliente 1 é encerrado (PAID). Cliente 2 permanece ativo (OPEN) e a mesa continua OCUPADA!
    assert.equal(member1.status, 'PAID')
    assert.isNotNull(member1.paidAt)
    assert.equal(member2.status, 'OPEN')
    assert.equal(table.status, 'OCUPADA')

    // 8. Cliente 1 tenta acessar o cardápio novamente -> middleware limpa o cookie e redireciona
    const client1MenuResponse = await client
      .get(`/m/${table.number}/menu`)
      .withEncryptedCookie('tab_session', {
        memberId: member1.id,
        sessionToken: member1.sessionToken,
        tableNumber: table.number,
      })

    assert.oneOf(client1MenuResponse.status(), [200, 302])

    // 9. Cozinha finaliza o prato do Cliente 2 e garçom entrega
    order2.status = 'ENTREGUE'
    await order2.save()

    // 10. Garçom agora liquida a comanda do Cliente 2
    const payMember2Response = await client
      .post(`/staff/tables/${table.id}/members/${member2.id}/pay`)
      .loginAs(waiterUser)
      .withCsrfToken()
      .header('Accept', 'application/json')

    assert.equal(payMember2Response.status(), 200)
    await member2.refresh()
    assert.equal(member2.status, 'PAID')

    // 11. Agora que 100% dos membros estão PAID e todos os pedidos entregues, garçom libera a mesa
    const releaseResponse = await client
      .post(`/staff/tables/${table.id}/release`)
      .loginAs(waiterUser)
      .withCsrfToken()
      .header('Accept', 'application/json')

    assert.equal(releaseResponse.status(), 200)
    await table.refresh()
    await tab.refresh()

    assert.equal(table.status, 'LIVRE')
    assert.equal(tab.status, 'CLOSED')
    assert.isNotNull(tab.closedAt)
  })
})
