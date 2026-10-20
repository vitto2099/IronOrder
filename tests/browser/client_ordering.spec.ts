import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Table from '#models/table'
import Category from '#models/category'
import Product from '#models/product'
import Order from '#models/order'
import OrderItem from '#models/order_item'

test.group('E2E: Cardápio Mobile e Carrinho de Pedidos', (group) => {
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
    await db.from('products').delete()
    await db.from('categories').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('Filtros de categoria e busca em tempo real no cardápio mobile', async ({
    browserContext,
  }) => {
    // 1. Cria mesa física
    const table = await Table.create({
      number: 11,
      capacity: 4,
      status: 'LIVRE',
    })

    // 2. Cria categorias e produtos
    const catEntradas = await Category.create({
      name: 'Entradas',
      slug: 'entradas',
      emoji: '🥗',
      sortOrder: 1,
      isActive: true,
    })

    const catPrincipais = await Category.create({
      name: 'Principais',
      slug: 'principais',
      emoji: '🍽️',
      sortOrder: 2,
      isActive: true,
    })

    await Product.create({
      categoryId: catEntradas.id,
      name: 'Carpaccio Trufado',
      description: 'Finas fatias de carne com azeite de trufas e alcaparras',
      price: 36.0,
      isAvailable: true,
    })

    await Product.create({
      categoryId: catPrincipais.id,
      name: 'Bife de Chorizo Angus',
      description: 'Corte nobre grelhado na brasa com chimichurri fresco',
      price: 78.0,
      isAvailable: true,
    })

    // 3. Cliente entra na mesa via Zero-Auth
    const page = await browserContext.visit(`/m/${table.number}`)
    await page.fill('input#alias', 'Camila')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/m/11/menu')

    // 4. Valida renderização de todos os pratos no início
    await page.assertVisible('text=Carpaccio Trufado')
    await page.assertVisible('text=Bife de Chorizo Angus')

    // 5. Filtro por Categoria: Clica na pill "🥗 Entradas"
    await page.click('button:has-text("Entradas")')
    await page.assertVisible('text=Carpaccio Trufado')
    await page.assertNotExists('text=Bife de Chorizo Angus')

    // Volta para "✦ Todos"
    await page.click('button:has-text("Todos")')
    await page.assertVisible('text=Carpaccio Trufado')
    await page.assertVisible('text=Bife de Chorizo Angus')

    // 6. Busca por texto em tempo real
    await page.fill('input[placeholder="Buscar no cardápio…"]', 'Chorizo')
    await page.assertVisible('text=Bife de Chorizo Angus')
    await page.assertNotExists('text=Carpaccio Trufado')

    // Limpa a busca
    await page.fill('input[placeholder="Buscar no cardápio…"]', '')
    await page.assertVisible('text=Carpaccio Trufado')
    await page.assertVisible('text=Bife de Chorizo Angus')
  })

  test('Abertura do ItemModal, personalização com observação, adição ao carrinho e envio atômico', async ({
    browserContext,
    assert,
  }) => {
    // 1. Cria mesa física
    const table = await Table.create({
      number: 14,
      capacity: 4,
      status: 'LIVRE',
    })

    // 2. Cria categorias e produtos
    const category = await Category.create({
      name: 'Hambúrgueres',
      slug: 'hamburgueres',
      emoji: '🍔',
      sortOrder: 1,
      isActive: true,
    })

    await Product.create({
      categoryId: category.id,
      name: 'Smash Bacon Especial',
      description: 'Blend bovino 160g, cheddar inglês e fatias generosas de bacon',
      price: 35.0,
      isAvailable: true,
    })

    await Product.create({
      categoryId: category.id,
      name: 'Refrigerante Lata',
      description: 'Lata 350ml gelada com copo e gelo',
      price: 8.0,
      isAvailable: true,
    })

    // 3. Cliente entra na mesa via Zero-Auth
    const page = await browserContext.visit(`/m/${table.number}`)
    await page.fill('input#alias', 'Renato')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/m/14/menu')

    // 4. Abre o ItemModal clicando no card do Smash Bacon
    await page.click('text=Smash Bacon Especial')

    // Valida elementos do ItemModal
    await page.assertVisible('div.fixed h2:has-text("Smash Bacon Especial")')
    await page.assertVisible('textarea#modalNotes')

    // Preenche observações personalizadas para a cozinha
    await page.fill('textarea#modalNotes', 'Ponto da carne ao ponto para mal passada, sem picles')

    // Incrementa quantidade para 2 unidades no modal
    await page.click('div.fixed button:has-text("+")')

    // Clica em "Adicionar ao pedido"
    await page.click('div.fixed button:has-text("Adicionar ao pedido")')

    // Modal deve fechar e a barra flutuante do carrinho deve surgir com 2 itens
    await page.assertNotExists('textarea#modalNotes')
    await page.assertVisible('div.fixed button:has-text("Ver pedido")')
    await page.assertVisible('text=R$\xa070,00')

    // 5. Adição rápida do refrigerante (+1 item)
    await page
      .locator('div.rounded-2xl', { hasText: 'Refrigerante Lata' })
      .locator('button')
      .click()

    // Total agora deve ser R$ 78,00 e 3 itens
    await page.assertVisible('text=R$\xa078,00')

    // 6. Abre o CartModal clicando em "Ver pedido"
    await page.click('button:has-text("Ver pedido")')

    // Valida itens listados no CartModal
    await page.assertVisible('h2:has-text("Seu Pedido")')
    await page.assertVisible('h4:has-text("Smash Bacon Especial") >> nth=0')
    await page.assertVisible('text=Obs: Ponto da carne ao ponto para mal passada, sem picles')
    await page.assertVisible('h4:has-text("Refrigerante Lata") >> nth=0')
    await page.assertVisible('button:has-text("Enviar pedido para a cozinha 🍳")')

    // 7. Envia o lote de pedidos atômico para a cozinha
    await page.click('button:has-text("Enviar pedido para a cozinha 🍳")')

    // Deve redirecionar para a comanda e exibir notificação de sucesso
    await page.waitForURL('**/m/14/**')
    await page.assertVisible('text=Pedido enviado com sucesso para a cozinha!')

    // 8. Valida persistência no banco de dados SQLite
    const savedOrder = await Order.query().firstOrFail()
    assert.oneOf(savedOrder.status, ['PENDING', 'ENVIADO'])

    const items = await OrderItem.query().where('orderId', savedOrder.id).orderBy('id', 'asc')
    assert.lengthOf(items, 2)

    // Item 1: Burger
    assert.equal(items[0].nameSnapshot, 'Smash Bacon Especial')
    assert.equal(items[0].quantity, 2)
    assert.equal(items[0].unitPrice, 35.0)
    assert.equal(items[0].notes, 'Ponto da carne ao ponto para mal passada, sem picles')

    // Item 2: Drink
    assert.equal(items[1].nameSnapshot, 'Refrigerante Lata')
    assert.equal(items[1].quantity, 1)
    assert.equal(items[1].unitPrice, 8.0)
  })
})
