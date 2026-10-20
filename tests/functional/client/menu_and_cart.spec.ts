import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import Category from '#models/category'
import Product from '#models/product'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import { DateTime } from 'luxon'

test.group('Client Menu and Cart (Functional HTTP) - TASK-08', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('order_items').delete()
    await db.from('orders').delete()
    await db.from('tab_members').delete()
    await db.from('tabs').delete()
    await db.from('tables').delete()
    await db.from('products').delete()
    await db.from('categories').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('a) GET /m/:tableNumber/menu renderiza cardapio apenas com itens disponiveis sob sessao de cliente', async ({
    client,
    assert,
  }) => {
    // 1. Acesso sem sessão deve ser rejeitado (401 se JSON / 302 se HTML)
    const unauthorizedRes = await client.get('/m/12/menu').header('accept', 'application/json')
    assert.equal(unauthorizedRes.status(), 401)

    // 2. Cria mesa e comanda
    const table = await Table.create({
      number: 12,
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
      alias: 'RODRIGO',
      sessionToken: 'token-rodrigo-12345678901234567890',
    })

    // 3. Cria categorias e produtos (disponíveis e indisponíveis)
    const catEntradas = await Category.create({
      name: 'Entradas',
      slug: 'entradas',
      emoji: '🥗',
      sortOrder: 1,
      isActive: true,
    })

    const catInativa = await Category.create({
      name: 'Especiais Desativados',
      slug: 'especiais-desativados',
      sortOrder: 2,
      isActive: false,
    })

    const prodDisponivel = await Product.create({
      categoryId: catEntradas.id,
      name: 'Bruschetta Artesanal',
      price: 28.0,
      isAvailable: true,
    })

    const prodIndisponivel = await Product.create({
      categoryId: catEntradas.id,
      name: 'Carpaccio Esgotado',
      price: 45.0,
      isAvailable: false,
    })

    await Product.create({
      categoryId: catInativa.id,
      name: 'Prato Proibido',
      price: 99.0,
      isAvailable: true,
    })

    // 4. Requisição autenticada com cookie de cliente
    const res = await client
      .get('/m/12/menu')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 12,
      })
      .header('accept', 'application/json')

    res.assertStatus(200)

    const data = res.body()
    assert.equal(data.tableNumber, 12)
    assert.equal(data.member.alias, 'RODRIGO')
    assert.equal(data.tableStatus, 'OCUPADA')
    assert.isArray(data.categories)

    // Categoria inativa não deve aparecer
    assert.isFalse(data.categories.some((c: any) => c.id === catInativa.id))

    // Produtos retornados na categoria Entradas
    const entradas = data.categories.find((c: any) => c.id === catEntradas.id)
    assert.isDefined(entradas)
    assert.lengthOf(entradas.products, 1)
    assert.equal(entradas.products[0].id, prodDisponivel.id)
    assert.isFalse(entradas.products.some((p: any) => p.id === prodIndisponivel.id))
  })

  test('b) POST /m/:tableNumber/orders envia lote atômico gravando itens, snapshot de preço e notas (RN-03.1)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 8,
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
      alias: 'JULIA',
      sessionToken: 'token-julia-12345678901234567890',
    })

    const category = await Category.create({
      name: 'Pratos',
      slug: 'pratos',
      isActive: true,
    })

    const burger = await Product.create({
      categoryId: category.id,
      name: 'Smash Burger',
      price: 35.0,
      isAvailable: true,
    })

    const drink = await Product.create({
      categoryId: category.id,
      name: 'Suco Natural',
      price: 12.0,
      isAvailable: true,
    })

    const res = await client
      .post('/m/8/orders')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 8,
      })
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        items: [
          {
            productId: burger.id,
            quantity: 2,
            notes: 'Sem cebola e bacon bem crocante',
          },
          {
            productId: drink.id,
            quantity: 1,
            notes: 'Com gelo e limão',
          },
        ],
      })

    assert.oneOf(res.status(), [200, 201, 302])

    // Verifica no banco a gravação atômica do pedido e itens
    const order = await Order.query().where('tab_id', tab.id).first()
    assert.isNotNull(order)
    assert.equal(order?.tabMemberId, member.id)
    assert.equal(order?.status, 'PENDING')

    const items = await OrderItem.query().where('order_id', order!.id).orderBy('id', 'asc')
    assert.lengthOf(items, 2)

    assert.equal(items[0].nameSnapshot, 'Smash Burger')
    assert.equal(items[0].unitPrice, 35.0)
    assert.equal(items[0].quantity, 2)
    assert.equal(items[0].notes, 'Sem cebola e bacon bem crocante')

    assert.equal(items[1].nameSnapshot, 'Suco Natural')
    assert.equal(items[1].unitPrice, 12.0)
    assert.equal(items[1].quantity, 1)
    assert.equal(items[1].notes, 'Com gelo e limão')
  })

  test('c) Rejeição de pratos indisponíveis no pedido (RN-02.1) com rollback total', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 3,
      capacity: 2,
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'OPEN',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'CARLOS',
      sessionToken: 'token-carlos-12345678901234567890',
    })

    const category = await Category.create({
      name: 'Sobremesas',
      slug: 'sobremesas',
      isActive: true,
    })

    const availableProduct = await Product.create({
      categoryId: category.id,
      name: 'Sorvete Artesanal',
      price: 18.0,
      isAvailable: true,
    })

    const unavailableProduct = await Product.create({
      categoryId: category.id,
      name: 'Torta Esgotada',
      price: 24.0,
      isAvailable: false,
    })

    // Envio contendo 1 item disponível e 1 indisponível
    const res = await client
      .post('/m/3/orders')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 3,
      })
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        items: [
          { productId: availableProduct.id, quantity: 1 },
          { productId: unavailableProduct.id, quantity: 1 },
        ],
      })

    assert.oneOf(res.status(), [400, 422])

    // Nenhum pedido deve ter sido criado no banco
    const orderCount = await Order.query().where('tab_id', tab.id)
    assert.lengthOf(orderCount, 0)
  })

  test('d) Bloqueio de novos pedidos se mesa estiver em CONTA_PEDIDA (RN-05.1)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 15,
      capacity: 4,
      status: 'CONTA_PEDIDA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'BILL_REQUESTED',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'BEATRIZ',
      sessionToken: 'token-beatriz-12345678901234567890',
    })

    const category = await Category.create({
      name: 'Bebidas',
      slug: 'bebidas',
      isActive: true,
    })

    const drink = await Product.create({
      categoryId: category.id,
      name: 'Água com Gás',
      price: 6.0,
      isAvailable: true,
    })

    const res = await client
      .post('/m/15/orders')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 15,
      })
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        items: [{ productId: drink.id, quantity: 1 }],
      })

    assert.oneOf(res.status(), [400, 422])

    const orderCount = await Order.query().where('tab_id', tab.id)
    assert.lengthOf(orderCount, 0)
  })
})
