import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { TabSessionService } from '#services/tab_session_service'
import { Table } from '#models/table'
import { Tab } from '#models/tab'
import { TabMember } from '#models/tab_member'
import { Order } from '#models/order'
import { OrderItem } from '#models/order_item'
import db from '@adonisjs/lucid/services/db'

test.group('TabSessionService - Trilha B (Sessão de Mesa & Zero-Auth)', (group) => {
  let service: TabSessionService

  group.setup(async () => {
    await testUtils.db().migrate()
    service = new TabSessionService()
  })

  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF;')
    await OrderItem.query().delete()
    await Order.query().delete()
    await TabMember.query().delete()
    await Tab.query().delete()
    await Table.query().delete()
    await db.rawQuery('PRAGMA foreign_keys = ON;')
  })

  test('a) Abertura ou recuperação de mesa (Table) e comanda ativa (Tab com status OPEN)', async ({
    assert,
  }) => {
    const table = await Table.create({
      number: 10,
      capacity: 4,
      status: 'LIVRE',
    })

    // Primeira vinculação: abre nova comanda com status OPEN / ABERTA e mesa fica OCUPADA
    const firstResult = await service.bindAliasToTable(table.id, 'Alice')
    assert.isTrue(firstResult.isNewTab)
    assert.exists(firstResult.member)
    assert.oneOf(firstResult.tab.status, ['OPEN', 'ABERTA'])

    await table.refresh()
    assert.equal(table.status, 'OCUPADA')

    // Segunda vinculação: recupera a comanda ativa existente, não cria nova comanda
    const secondResult = await service.bindAliasToTable(table.id, 'Bob')
    assert.isFalse(secondResult.isNewTab)
    assert.equal(secondResult.tab.id, firstResult.tab.id)

    const tabsCount = await Tab.query().where('table_id', table.id)
    assert.lengthOf(tabsCount, 1)
  })

  test('b) Entrada de cliente via Zero-Auth gerando TabMember com normalização de alias (uppercase e trim)', async ({
    assert,
  }) => {
    const table = await Table.create({
      number: 5,
      capacity: 4,
      status: 'LIVRE',
    })

    const result = await service.bindAliasToTable(table.id, '   joão da silva   ')

    assert.equal(result.member.alias, 'JOÃO DA SILVA')
    assert.isString(result.member.sessionToken)
    assert.isAtLeast(result.member.sessionToken.length, 32)

    const memberInDb = await TabMember.findByOrFail('session_token', result.member.sessionToken)
    assert.equal(memberInDb.alias, 'JOÃO DA SILVA')
  })

  test('c) Deduplicação de alias na mesma mesa (ex: LUCAS e LUCAS 2)', async ({ assert }) => {
    const table = await Table.create({
      number: 7,
      capacity: 4,
      status: 'LIVRE',
    })

    const member1 = await service.bindAliasToTable(table.id, 'Lucas')
    assert.equal(member1.member.alias, 'LUCAS')

    const member2 = await service.bindAliasToTable(table.id, '  lucas ')
    assert.equal(member2.member.alias, 'LUCAS 2')

    const member3 = await service.bindAliasToTable(table.id, 'LUCAS')
    assert.equal(member3.member.alias, 'LUCAS 3')

    // Em outra mesa, o alias 'lucas' não deve sofrer deduplicação
    const otherTable = await Table.create({
      number: 8,
      capacity: 4,
      status: 'LIVRE',
    })
    const memberOtherTable = await service.bindAliasToTable(otherTable.id, 'lucas')
    assert.equal(memberOtherTable.member.alias, 'LUCAS')
  })

  test('d) Bloqueio de novos membros se comanda estiver em BILL_REQUESTED ou CLOSED', async ({
    assert,
  }) => {
    const table = await Table.create({
      number: 3,
      capacity: 4,
      status: 'LIVRE',
    })

    await service.bindAliasToTable(table.id, 'Cliente 1')

    // Cenário 1: Mesa em solicitação de conta (CONTA_PEDIDA / BILL_REQUESTED)
    await service.requestBill(table.id)
    await table.refresh()
    assert.oneOf(table.status, ['CONTA_PEDIDA', 'BILL_REQUESTED'])

    await assert.rejects(
      () => service.bindAliasToTable(table.id, 'Novo Cliente'),
      /fechamento|bloquead|encerrad|bill_requested/i
    )

    // Cenário 2: Mesa liberada e comanda encerrada (CLOSED / FECHADA)
    const member = await TabMember.query().where('alias', 'CLIENTE 1').firstOrFail()
    await service.payMember(member.id)
    await service.releaseTable(table.id)
    await table.refresh()
    assert.equal(table.status, 'LIVRE')

    // Com a mesa liberada (LIVRE), um novo cliente pode abrir uma NOVA comanda
    const newSession = await service.bindAliasToTable(table.id, 'Cliente 2')
    assert.isTrue(newSession.isNewTab)

    // Se a comanda estiver explicitamente fechada, tentar associar a ela falha
    const activeTab = newSession.tab
    activeTab.status = 'CLOSED'
    await activeTab.save()

    await assert.rejects(() => service.bindAliasToTab(activeTab.id, 'Cliente 3'), /fechad|closed/i)
  })

  test('e) Obtenção do extrato detalhado da mesa com subtotais por membro', async ({ assert }) => {
    const table = await Table.create({
      number: 12,
      capacity: 4,
      status: 'LIVRE',
    })

    const { tab, member: lucas } = await service.bindAliasToTable(table.id, 'Lucas')
    const { member: mariana } = await service.bindAliasToTable(table.id, 'Mariana')

    // Inserir pedidos e itens diretamente via models para validar o cálculo financeiro do extrato
    // Pedido 1: Lucas - Item faturável (1x 35.00)
    const order1 = await Order.create({
      tabId: tab.id,
      tabMemberId: lucas.id,
      status: 'ENTREGUE',
    })
    await OrderItem.create({
      orderId: order1.id,
      nameSnapshot: 'Hambúrguer Artesanal',
      unitPrice: 35.0,
      quantity: 1,
    })

    // Pedido 2: Lucas - Item cancelado (1x 50.00) - Deve ser DESCONSIDERADO
    const order2 = await Order.create({
      tabId: tab.id,
      tabMemberId: lucas.id,
      status: 'CANCELADO',
      cancellationReason: 'Desistência do cliente',
    })
    await OrderItem.create({
      orderId: order2.id,
      nameSnapshot: 'Garrafa de Vinho',
      unitPrice: 50.0,
      quantity: 1,
    })

    // Pedido 3: Mariana - Itens faturáveis (2x 12.50 = 25.00)
    const order3 = await Order.create({
      tabId: tab.id,
      tabMemberId: mariana.id,
      status: 'EM_PREPARO',
    })
    await OrderItem.create({
      orderId: order3.id,
      nameSnapshot: 'Chopp 500ml',
      unitPrice: 12.5,
      quantity: 2,
    })

    const summary = await service.getTabSummary(table.id)

    assert.equal(summary.tabId, tab.id)
    assert.equal(summary.tableNumber, 12)
    assert.oneOf(summary.status, ['OPEN', 'ABERTA'])

    // Total da comanda: 35.00 (Lucas) + 25.00 (Mariana) = 60.00 (exclui 50.00 cancelados)
    assert.equal(summary.total, 60.0)

    const lucasSummary = summary.members.find((m) => m.alias === 'LUCAS')
    assert.isDefined(lucasSummary)
    assert.equal(lucasSummary!.subtotal, 35.0)
    assert.equal(lucasSummary!.itemsCount, 1)

    const marianaSummary = summary.members.find((m) => m.alias === 'MARIANA')
    assert.isDefined(marianaSummary)
    assert.equal(marianaSummary!.subtotal, 25.0)
    assert.equal(marianaSummary!.itemsCount, 2)
  })
})
