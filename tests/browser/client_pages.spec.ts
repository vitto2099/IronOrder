import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import { DateTime } from 'luxon'

test.group('E2E: Páginas do Cliente (Welcome, Menu e Extrato)', (group) => {
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
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('deve renderizar a página de boas-vindas com identificação da mesa e formulário zero-auth', async ({
    visit,
  }) => {
    await Table.create({
      number: 10,
      capacity: 4,
      status: 'LIVRE',
    })

    const page = await visit('/m/10')

    await page.assertPath('/m/10')
    await page.assertVisible('h1')
    await page.assertText('h1', 'QR-Order')
    await page.assertVisible('text=Mesa 10')
    await page.assertVisible('h2:has-text("Boas-vindas!")')
    await page.assertVisible('input#alias')
    await page.assertVisible('button[type="submit"]')
    await page.assertTextContains('button[type="submit"]', 'Ver Cardápio & Fazer Pedido')
  })

  test('botão de entrar na mesa deve estar desabilitado quando o campo de apelido estiver vazio', async ({
    visit,
  }) => {
    await Table.create({
      number: 10,
      capacity: 4,
      status: 'LIVRE',
    })

    const page = await visit('/m/10')

    // O botão tem a condição: disabled={processing || !data.alias.trim()}
    await page.assertDisabled('button[type="submit"]')

    // Ao digitar, o botão habilita
    await page.fill('input#alias', 'Carlos')
    await page.assertNotDisabled('button[type="submit"]')

    // Ao apagar, volta a ficar desabilitado
    await page.fill('input#alias', '   ')
    await page.assertDisabled('button[type="submit"]')
  })

  test('deve bloquear novos acessos na tela de boas-vindas quando a mesa estiver com CONTA_PEDIDA', async ({
    visit,
  }) => {
    await Table.create({
      number: 12,
      capacity: 4,
      status: 'CONTA_PEDIDA',
    })

    const page = await visit('/m/12')

    await page.assertPath('/m/12')
    await page.assertVisible('text=Mesa em Fechamento')
    await page.assertTextContains('body', 'Esta mesa está em processo de fechamento de conta')
    // O formulário de entrada não deve existir
    await page.assertNotExists('input#alias')
  })

  test('visitante sem sessão tentando acessar menu ou extrato deve ser redirecionado para a tela de boas-vindas', async ({
    visit,
  }) => {
    await Table.create({
      number: 8,
      capacity: 4,
      status: 'LIVRE',
    })

    // 1. Tentativa de acessar menu sem cookie
    const menuPage = await visit('/m/8/menu')
    await menuPage.waitForURL('**/m/8')
    await menuPage.assertPath('/m/8')
    await menuPage.assertVisible('text=Sessão não identificada')

    // 2. Tentativa de acessar extrato sem cookie
    const tabPage = await visit('/m/8/tab')
    await tabPage.waitForURL('**/m/8')
    await tabPage.assertPath('/m/8')
    await tabPage.assertVisible('text=Sessão não identificada')
  })

  test('cliente realiza entrada Zero-Auth com sucesso e é direcionado ao cardápio com identificação ativa', async ({
    visit,
  }) => {
    await Table.create({
      number: 3,
      capacity: 4,
      status: 'LIVRE',
    })

    const page = await visit('/m/3')

    await page.fill('input#alias', 'Mariana')
    await page.click('button[type="submit"]')

    // Redireciona para o cardápio da mesa 3
    await page.waitForURL('**/m/3/menu')
    await page.assertPath('/m/3/menu')
    await page.assertVisible('h1:has-text("Cardápio - Mesa 3")')
    await page.assertTextContains('body', 'Conectado como: MARIANA')

    // Tentar voltar para /m/3 enquanto a sessão estiver aberta deve redirecionar direto para o menu
    await page.goto('/m/3')
    await page.waitForURL('**/m/3/menu')
    await page.assertPath('/m/3/menu')
  })

  test('deve renderizar o extrato da comanda com resumo financeiro, itens próprios e outros membros', async ({
    browserContext,
  }) => {
    const table = await Table.create({
      number: 5,
      capacity: 4,
      status: 'OCUPADA',
    })

    // Lucas entra na mesa primeiro via interface real (Zero-Auth)
    const page = await browserContext.visit('/m/5')
    await page.fill('input#alias', 'Lucas')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/m/5/menu')

    // Recupera comanda e membro criados
    const tab = await Tab.query().where('tableId', table.id).where('status', 'OPEN').firstOrFail()

    const lucas = await TabMember.query()
      .where('tabId', tab.id)
      .where('alias', 'LUCAS')
      .firstOrFail()

    const ana = await TabMember.create({
      tabId: tab.id,
      alias: 'ANA',
      sessionToken: 'token-ana-e2e-12345678901234567890',
    })

    // Pedido do Lucas: 1x Hambúrguer Artesanal (R$ 38,00)
    const order1 = await Order.create({
      tabId: tab.id,
      tabMemberId: lucas.id,
      status: 'EM_PREPARO',
    })
    await OrderItem.create({
      orderId: order1.id,
      nameSnapshot: 'Hambúrguer Artesanal',
      unitPrice: 38.0,
      quantity: 1,
      notes: 'Sem cebola',
    })

    // Pedido da Ana: 2x Suco de Laranja (2x R$ 12,00 = R$ 24,00)
    const order2 = await Order.create({
      tabId: tab.id,
      tabMemberId: ana.id,
      status: 'PRONTO',
    })
    await OrderItem.create({
      orderId: order2.id,
      nameSnapshot: 'Suco de Laranja',
      unitPrice: 12.0,
      quantity: 2,
    })

    // Lucas navega para o extrato da comanda
    await page.goto('/m/5/tab')
    await page.assertPath('/m/5/tab')

    // 1. Cabeçalho e Identificação da mesa
    await page.assertVisible('text=Mesa 5')
    await page.assertVisible('text=Voltar ao Cardápio')

    // 2. Resumo financeiro (Total geral: R$ 62,00; Lucas: R$ 38,00)
    await page.assertVisible('text=Resumo Financeiro da Mesa')
    await page.assertVisible('section.bg-gray-900')
    await page.assertTextContains('section.bg-gray-900', 'R$\xa062,00')
    await page.assertTextContains('section.bg-gray-900', 'R$\xa038,00')

    // 3. Seção "Seu Consumo"
    await page.assertVisible('h2:has-text("Seu Consumo")')
    await page.assertVisible('text=Hambúrguer Artesanal')
    await page.assertVisible('text=Obs: Sem cebola')
    await page.assertVisible('text=🍳 Na cozinha')

    // 4. Seção "Amigos na Mesa" (Ana com R$ 24,00)
    await page.assertVisible('h2:has-text("Amigos na Mesa")')
    await page.assertVisible('button:has-text("ANA")')
    await page.assertVisible('text=R$\xa024,00')

    // Expande os detalhes da Ana para ver os itens consumidos por ela
    await page.click('button:has-text("ANA")')
    await page.assertVisible('text=Suco de Laranja')
  })

  test('fluxo de pedir a conta: cliente abre modal, confirma solicitação e mesa transiciona para CONTA_PEDIDA', async ({
    browserContext,
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

    // Gabriel entra na mesa pelo formulário Zero-Auth
    const page = await browserContext.visit('/m/7')
    await page.fill('input#alias', 'Gabriel')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/m/7/menu')

    const member = await TabMember.query()
      .where('tab_id', tab.id)
      .where('alias', 'GABRIEL')
      .firstOrFail()

    const order = await Order.create({
      tabId: tab.id,
      tabMemberId: member.id,
      status: 'ENTREGUE',
    })
    await OrderItem.create({
      orderId: order.id,
      nameSnapshot: 'Pizza Individual',
      unitPrice: 45.0,
      quantity: 1,
    })

    // Acessa o extrato
    await page.goto('/m/7/tab')
    await page.assertPath('/m/7/tab')

    // Clica no botão "Pedir a Conta (Fechar Mesa)"
    await page.click('button:has-text("Pedir a Conta (Fechar Mesa)")')

    // Modal de confirmação deve abrir
    await page.assertVisible('h3:has-text("Pedir a Conta?")')
    await page.assertVisible('text=Total Acumulado')
    await page.assertVisible('button:has-text("Continuar Pedindo")')
    await page.assertVisible('button:has-text("Sim, Chamar Garçom")')

    // Clica em "Sim, Chamar Garçom"
    await page.click('button:has-text("Sim, Chamar Garçom")')

    // Aguarda atualização da tela após request-bill
    await page.assertVisible('h3:has-text("Conta Solicitada!")')
    await page.assertVisible('text=O garçom foi notificado e virá à sua mesa')
    await page.assertVisible('button:has-text("Aguardando o Garçom...")')
    await page.assertDisabled('button:has-text("Aguardando o Garçom...")')

    // Valida que no banco a mesa transicionou para CONTA_PEDIDA
    await table.refresh()
    assert.equal(table.status, 'CONTA_PEDIDA')
  })

  test('jornada completa do cliente: QR Code -> boas-vindas -> menu -> extrato -> retorno ao menu', async ({
    browserContext,
  }) => {
    await Table.create({
      number: 15,
      capacity: 2,
      status: 'LIVRE',
    })

    // Passo 1: Simula o cliente escaneando o QR Code da mesa 15
    const page = await browserContext.visit('/m/15')
    await page.assertPath('/m/15')
    await page.assertVisible('text=Mesa 15')

    // Passo 2: Preenche seu apelido e entra na mesa
    await page.fill('input#alias', 'Beatriz')
    await page.click('button[type="submit"]')

    // Passo 3: Chega na página do cardápio com boas-vindas personalizadas
    await page.waitForURL('**/m/15/menu')
    await page.assertPath('/m/15/menu')
    await page.assertVisible('h1:has-text("Cardápio - Mesa 15")')
    await page.assertTextContains('body', 'Conectado como: BEATRIZ')

    // Passo 4: Navega até o extrato da comanda
    await page.goto('/m/15/tab')
    await page.assertPath('/m/15/tab')
    await page.assertVisible('text=Mesa 15')
    await page.assertVisible('text=Você ainda não enviou nenhum pedido para a cozinha.')

    // Passo 5: Clica no botão de navegação "Voltar ao Cardápio"
    await page.click('button:has-text("Voltar ao Cardápio")')
    await page.waitForURL('**/m/15/menu')
    await page.assertPath('/m/15/menu')
    await page.assertVisible('h1:has-text("Cardápio - Mesa 15")')
  })
})
