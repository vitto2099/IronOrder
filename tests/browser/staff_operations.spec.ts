import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import { DateTime } from 'luxon'

test.group('E2E: Operações Staff (KDS e Salão de Mesas)', (group) => {
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

  test('KDS: exibe colunas kanban, timers e executa transições de status em 1 clique', async ({
    browserContext,
    assert,
  }) => {
    // 1. Cria usuário da cozinha
    const chef = await User.create({
      email: 'chef@qrorder.local',
      password: 'password123',
      fullName: 'Chef Cozinheiro',
      role: 'COZINHA',
    })

    // 2. Cria mesa, comanda e pedido novo (ENVIADO)
    const table = await Table.create({
      number: 4,
      capacity: 4,
      status: 'OCUPADA',
    })

    const tab = await Tab.create({
      tableId: table.id,
      status: 'OPEN',
      openedAt: DateTime.now().minus({ minutes: 5 }),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'FELIPE',
      sessionToken: 'token-felipe-kds-123456789012345678',
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENVIADO',
      createdAt: DateTime.now().minus({ minutes: 4 }),
    })

    await OrderItem.create({
      orderId: order.id,
      nameSnapshot: 'Risoto de Cogumelos',
      unitPrice: 55.0,
      quantity: 1,
      notes: 'Caprichar no queijo',
    })

    // 3. Login do chef e acesso ao KDS
    await browserContext.loginAs(chef)
    const page = await browserContext.visit('/kds')

    await page.assertPath('/kds')
    await page.assertVisible('h1:has-text("KDS - Cozinha & Bar")')
    await page.assertVisible('text=Ao vivo')

    // Valida colunas Kanban
    await page.assertVisible('h2:has-text("Novos Pedidos")')
    await page.assertVisible('h2:has-text("Em Preparo")')
    await page.assertVisible('h2:has-text("Prontos (Aguardando Garçom)")')

    // Valida dados do card na coluna "Novos Pedidos"
    await page.assertVisible('text=MESA 04')
    await page.assertVisible('text=Risoto de Cogumelos')
    await page.assertVisible('text=Caprichar no queijo')
    await page.assertVisible('text=4 min')

    // 4. Transição 1: Clica em "Iniciar Preparo 🍳"
    await page.click('button:has-text("Iniciar Preparo 🍳")')

    // Pedido deve mover para a coluna "Em Preparo"
    await page.assertVisible('button:has-text("Marcar Pronto 🔔")')
    await order.refresh()
    assert.equal(order.status, 'EM_PREPARO')

    // 5. Transição 2: Clica em "Marcar Pronto 🔔"
    await page.click('button:has-text("Marcar Pronto 🔔")')

    // Pedido deve mover para a coluna "Prontos (Aguardando Garçom)"
    await page.assertVisible('section:has-text("Prontos") >> text=MESA 04')
    await order.refresh()
    assert.equal(order.status, 'PRONTO')
  })

  test('Grid de Mesas: visualização de status, contadores e abertura de detalhes da mesa', async ({
    browserContext,
  }) => {
    // 1. Cria garçom
    const waiter = await User.create({
      email: 'waiter.grid@qrorder.local',
      password: 'password123',
      fullName: 'Garçom de Salão',
      role: 'GARCOM',
    })

    // 2. Cria 3 mesas com status distintos
    await Table.create({ number: 1, capacity: 2, status: 'LIVRE' })
    const table2 = await Table.create({ number: 2, capacity: 4, status: 'OCUPADA' })
    const tab2 = await Tab.create({ tableId: table2.id, status: 'OPEN', openedAt: DateTime.now() })
    await TabMember.create({
      tabId: tab2.id,
      alias: 'ALICE',
      sessionToken: 'token-alice-1234567890',
    })
    await Table.create({ number: 3, capacity: 6, status: 'CONTA_PEDIDA' })

    // 3. Login do garçom e acesso a /staff/tables
    await browserContext.loginAs(waiter)
    const page = await browserContext.visit('/staff/tables')

    await page.assertPath('/staff/tables')
    await page.assertVisible('h1:has-text("Painel do Salão & Mesas")')

    // Valida contadores de métricas no topo
    await page.assertVisible('text=Total de Mesas')
    await page.assertVisible('span:has-text("Livres")')
    await page.assertVisible('span:has-text("Ocupadas")')
    await page.assertVisible('text=Contas Pedidas ⚠️')

    // Valida cards de mesa
    await page.assertVisible('text=MESA 01')
    await page.assertVisible('span.bg-emerald-100:has-text("LIVRE")')

    await page.assertVisible('text=MESA 02')
    await page.assertVisible('span.bg-blue-100:has-text("OCUPADA")')

    await page.assertVisible('text=MESA 03')
    await page.assertVisible('text=PEDIU CONTA ⚠️')

    // 4. Clica no card da Mesa 02 para abrir o drawer de detalhes
    await page.click('text=MESA 02')

    // Valida drawer aberto com informações da comanda
    await page.assertVisible('div.fixed h2:has-text("MESA 02")')
    await page.assertVisible('text=Total da Mesa')
    await page.assertVisible('text=Clientes na Comanda')
    await page.assertVisible('text=👤 ALICE')
    await page.assertVisible('button:has-text("+ Lançar Pedido") >> nth=0')
  })

  test('Operação da Mesa: dar baixa de entrega em item pronto e liberar mesa', async ({
    browserContext,
    assert,
  }) => {
    // 1. Cria garçom
    const waiter = await User.create({
      email: 'garcom2@qrorder.local',
      password: 'password123',
      fullName: 'Garçom Roberto',
      role: 'GARCOM',
    })

    // 2. Cria mesa ocupada com pedido PRONTO
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

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'LEONARDO',
      sessionToken: 'token-leo-staff-12345678901234',
    })

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'PRONTO',
    })

    await OrderItem.create({
      orderId: order.id,
      nameSnapshot: 'Chopp Pilsen',
      unitPrice: 15.0,
      quantity: 2,
    })

    // 3. Garçom acessa o grid de mesas
    await browserContext.loginAs(waiter)
    const page = await browserContext.visit('/staff/tables')

    // Valida badge de prato pronto no card da mesa 6
    await page.assertVisible('text=MESA 06')
    await page.assertVisible('text=1 pronto!')

    // Abre detalhes da mesa 6
    await page.click('text=MESA 06')

    // Valida botão "Entregue na Mesa ✅"
    await page.assertVisible('button:has-text("Entregue na Mesa ✅")')

    // 4. Garçom clica em "Entregue na Mesa ✅"
    await page.click('button:has-text("Entregue na Mesa ✅")')

    // Valida que o pedido transicionou para ENTREGUE no banco
    await order.refresh()
    assert.equal(order.status, 'ENTREGUE')

    // 5. Garçom realiza a liberação/fechamento da mesa presencialmente
    // Configura o handler de diálogo para aceitar a confirmação
    page.on('dialog', (dialog) => dialog.accept())

    await page.click('button:has-text("Liberar Mesa & Fechar 🏁")')

    // Valida que a mesa voltou para o status LIVRE no banco
    await table.refresh()
    assert.equal(table.status, 'LIVRE')
  })
})
