import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { OrderEngineService } from '#services/order_engine_service'
import Order from '#models/order'
import Product from '#models/product'
import Category from '#models/category'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import User from '#models/user'
import { DateTime } from 'luxon'

test.group('OrderEngineService (TDD)', (group) => {
  let service: OrderEngineService
  let defaultCategory: Category
  let staffUser: User
  let tableCounter = 1000

  const getUniqueTableNumber = () => {
    tableCounter += 1
    return tableCounter + Math.floor(Math.random() * 100000)
  }

  group.each.setup(async () => {
    service = new OrderEngineService()
    const rollback = await testUtils.db().withGlobalTransaction()

    defaultCategory = await Category.create({
      name: 'Geral',
      slug: `geral-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      sortOrder: 1,
      isActive: true,
    })

    staffUser = await User.create({
      fullName: 'Garçom Teste',
      email: `staff-${Date.now()}-${Math.floor(Math.random() * 100000)}@teste.com`,
      password: 'password123',
    })

    return rollback
  })

  // a) Criação atômica de pedido (Order + OrderItems) dentro de db.transaction()
  test('a.1) deve criar pedido e itens com sucesso dentro de uma transação atômica', async ({
    assert,
  }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Hambúrguer Artesanal',
      price: 45.0,
      isAvailable: true,
    })

    const table = await Table.create({
      number: getUniqueTableNumber(),
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
      alias: 'JOÃO',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    const order = await service.submitBatchOrder({
      tabId: tab.id,
      tabMemberId: member.id,
      items: [
        {
          productId: product.id,
          quantity: 2,
          notes: 'Sem maionese',
        },
      ],
    })

    assert.isNotNull(order.id)
    assert.oneOf(order.status, ['PENDING', 'ENVIADO'])
    assert.lengthOf(order.items, 1)
    assert.equal(order.items[0].productId, product.id)
    assert.equal(order.items[0].quantity, 2)
    assert.equal(order.items[0].notes, 'Sem maionese')
    assert.equal(order.items[0].nameSnapshot, 'Hambúrguer Artesanal')
    assert.equal(Number(order.items[0].unitPrice), 45.0)
    assert.equal(order.items[0].subtotal, 90.0)

    // Verifica persistência no banco
    const orderInDb = await Order.query().where('id', order.id).preload('items').firstOrFail()
    assert.lengthOf(orderInDb.items, 1)
    assert.equal(orderInDb.items[0].nameSnapshot, 'Hambúrguer Artesanal')
  })

  test('a.2) deve realizar rollback de todo o pedido se ocorrer falha na gravação de algum item', async ({
    assert,
  }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Refrigerante 350ml',
      price: 8.0,
      isAvailable: true,
    })

    const table = await Table.create({
      number: getUniqueTableNumber(),
      capacity: 2,
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'ABERTA',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'MARIA',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    // Tentamos enviar 1 item válido e 1 item com ID de produto inexistente
    await assert.rejects(async () => {
      await service.submitBatchOrder({
        tabId: tab.id,
        tabMemberId: member.id,
        items: [
          { productId: product.id, quantity: 1 },
          { productId: 999999, quantity: 1 },
        ],
      })
    })

    // Garante que NENHUM registro de pedido ou item foi persistido no banco (atomicidade)
    const ordersCount = await Order.query().where('tab_id', tab.id)
    assert.lengthOf(ordersCount, 0)
  })

  // b) Congelamento do preço unitário (unit_price) no momento da compra em order_items
  test('b) deve congelar o unit_price no ato da compra mesmo que o preço do produto seja alterado posteriormente', async ({
    assert,
  }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Pizza Margherita',
      price: 50.0,
      isAvailable: true,
    })

    const table = await Table.create({
      number: getUniqueTableNumber(),
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'ABERTA',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'CARLOS',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    const order = await service.submitBatchOrder({
      tabId: tab.id,
      tabMemberId: member.id,
      items: [{ productId: product.id, quantity: 1 }],
    })

    assert.equal(Number(order.items[0].unitPrice), 50.0)

    // Reajuste de preço no catálogo para R$ 65,00
    product.price = 65.0
    await product.save()

    // Busca o item no banco de dados e verifica que o preço congelado permanece 50.00
    const refreshedOrder = await Order.query().where('id', order.id).preload('items').firstOrFail()
    assert.equal(Number(refreshedOrder.items[0].unitPrice), 50.0)
    assert.equal(refreshedOrder.items[0].subtotal, 50.0)
  })

  // c) Validação de pedido com itens vazios ou com produtos indisponíveis (isAvailable=false)
  test('c.1) deve rejeitar pedido com array de itens vazio', async ({ assert }) => {
    const table = await Table.create({ number: getUniqueTableNumber(), status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'ANA',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    await assert.rejects(async () => {
      await service.submitBatchOrder({
        tabId: tab.id,
        tabMemberId: member.id,
        items: [],
      })
    }, /vazio|pelo menos um item/i)
  })

  test('c.2) deve rejeitar pedido contendo produto indisponível (isAvailable = false)', async ({
    assert,
  }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Cerveja IPA Artesanal',
      price: 24.0,
      isAvailable: false, // Indisponível
    })

    const table = await Table.create({ number: getUniqueTableNumber(), status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'PAULO',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    await assert.rejects(async () => {
      await service.submitBatchOrder({
        tabId: tab.id,
        tabMemberId: member.id,
        items: [{ productId: product.id, quantity: 1 }],
      })
    }, /indisponível/i)

    const ordersCount = await Order.query().where('tab_id', tab.id)
    assert.lengthOf(ordersCount, 0)
  })

  // d) Transição de status do pedido (PENDING -> PREPARING -> DELIVERED)
  test('d) deve transicionar status de pedido respeitando o ciclo de vida (PENDING -> PREPARING -> DELIVERED)', async ({
    assert,
  }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Suco Natural',
      price: 12.0,
      isAvailable: true,
    })

    const table = await Table.create({ number: getUniqueTableNumber(), status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'LUCAS',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    const order = await service.submitBatchOrder({
      tabId: tab.id,
      tabMemberId: member.id,
      items: [{ productId: product.id, quantity: 1 }],
    })

    assert.oneOf(order.status, ['PENDING', 'ENVIADO'])

    const preparingOrder = await service.updateStatus(order.id, 'PREPARING')
    assert.oneOf(preparingOrder.status, ['PREPARING', 'EM_PREPARO'])

    const deliveredOrder = await service.updateStatus(order.id, 'DELIVERED')
    assert.oneOf(deliveredOrder.status, ['DELIVERED', 'ENTREGUE'])

    await assert.rejects(async () => {
      await service.updateStatus(order.id, 'PENDING')
    }, /transição inválida|não permitid/i)
  })

  // e) Bloqueio de cancelamento se status for diferente de PENDING
  test('e.1) deve permitir cancelamento de pedido com status PENDING', async ({ assert }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Batata Frita Rústica',
      price: 28.0,
      isAvailable: true,
    })

    const table = await Table.create({ number: getUniqueTableNumber(), status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'FERNANDA',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    const order = await service.submitBatchOrder({
      tabId: tab.id,
      tabMemberId: member.id,
      items: [{ productId: product.id, quantity: 1 }],
    })

    const cancelledOrder = await service.cancelOrder(order.id, {
      reason: 'Cliente desistiu do prato',
      cancelledByUserId: staffUser.id,
      staffRole: 'GARCOM',
    })

    assert.oneOf(cancelledOrder.status, ['CANCELLED', 'CANCELADO'])
    assert.equal(cancelledOrder.cancellationReason, 'Cliente desistiu do prato')
    assert.equal(cancelledOrder.cancelledByUserId, staffUser.id)
  })

  test('e.2) deve bloquear cancelamento de pedido cujo status seja diferente de PENDING (ex: PREPARING)', async ({
    assert,
  }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Sobremesa Brownie',
      price: 22.0,
      isAvailable: true,
    })

    const table = await Table.create({ number: getUniqueTableNumber(), status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'GABRIEL',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    const order = await service.submitBatchOrder({
      tabId: tab.id,
      tabMemberId: member.id,
      items: [{ productId: product.id, quantity: 1 }],
    })

    await service.updateStatus(order.id, 'PREPARING')

    await assert.rejects(async () => {
      await service.cancelOrder(order.id, {
        reason: 'Demorou muito',
        staffRole: 'GARCOM',
      })
    }, /apenas pedidos pendentes|não é possível cancelar/i)
  })

  // f) RN-05.1: Bloqueio de envio de pedidos caso mesa esteja em CONTA_PEDIDA ou comanda FECHADA
  test('f) deve rejeitar novos pedidos caso a mesa esteja em CONTA_PEDIDA', async ({ assert }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Café Espresso',
      price: 9.0,
      isAvailable: true,
    })

    const table = await Table.create({
      number: getUniqueTableNumber(),
      status: 'CONTA_PEDIDA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'ABERTA',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'ROBERTO',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    await assert.rejects(async () => {
      await service.submitBatchOrder({
        tabId: tab.id,
        tabMemberId: member.id,
        items: [{ productId: product.id, quantity: 1 }],
      })
    }, /mesa em fechamento/i)
  })

  // g) RN-03.3: Bloqueio de cancelamento por usuário sem perfil de Staff (ForbiddenException)
  test('g) deve rejeitar cancelamento se o solicitante não for Staff (ex: CLIENTE)', async ({
    assert,
  }) => {
    const product = await Product.create({
      categoryId: defaultCategory.id,
      name: 'Torta de Limão',
      price: 18.0,
      isAvailable: true,
    })

    const table = await Table.create({ number: getUniqueTableNumber(), status: 'OCUPADA' })
    const tab = await Tab.create({ tableId: table.id, status: 'ABERTA', openedAt: DateTime.now() })
    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'JULIA',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    const order = await service.submitBatchOrder({
      tabId: tab.id,
      tabMemberId: member.id,
      items: [{ productId: product.id, quantity: 1 }],
    })

    await assert.rejects(async () => {
      await service.cancelOrder(order.id, {
        reason: 'Não quero mais',
        staffRole: 'CLIENTE',
      })
    }, /apenas membros da equipe/i)
  })
})
