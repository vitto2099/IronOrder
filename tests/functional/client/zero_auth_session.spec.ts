import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import { DateTime } from 'luxon'

test.group('Zero-Auth Client Session (Functional HTTP) - TASK-05', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('order_items').delete()
    await db.from('orders').delete()
    await db.from('tab_members').delete()
    await db.from('tabs').delete()
    await db.from('tables').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('a) Acesso a GET /m/:tableNumber renderiza welcome ou redireciona se tiver sessão ativa', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 1,
      capacity: 4,
      status: 'LIVRE',
    })

    // 1. Sem cookie de sessão: deve responder 200 OK na tela de boas-vindas
    const welcomeRes = await client.get('/m/1')
    welcomeRes.assertStatus(200)

    // 2. Com sessão ativa para a mesa: deve redirecionar para /m/1/menu
    const tab = await Tab.create({
      tableId: table.id,
      status: 'OPEN',
      openedAt: DateTime.now(),
    })

    const member = await TabMember.create({
      tabId: tab.id,
      alias: 'MARIANA',
      sessionToken: 'token-valido-12345678901234567890123456',
    })

    const sessionRes = await client
      .get('/m/1')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: table.number,
      })
      .redirects(0)

    sessionRes.assertStatus(302)
    assert.equal(sessionRes.header('location'), '/m/1/menu')
  })

  test('b) POST /m/:tableNumber/join com validação de apelido, emissão de cookie e criação de TabMember', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 2,
      capacity: 4,
      status: 'LIVRE',
    })

    // 1. Validação: apelido com menos de 2 caracteres deve falhar
    const invalidRes = await client
      .post('/m/2/join')
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ alias: 'A' })

    invalidRes.assertStatus(422)

    // 2. Sucesso: apelido válido emite cookie tab_session e redireciona para /m/2/menu
    const validRes = await client
      .post('/m/2/join')
      .withCsrfToken()
      .json({ alias: 'Carlos' })
      .redirects(0)

    validRes.assertStatus(302)
    assert.equal(validRes.header('location'), '/m/2/menu')

    // Verifica que o cookie tab_session foi emitido
    const cookie = validRes.cookie('tab_session')
    assert.isDefined(cookie)

    // Verifica que o membro foi criado com alias normalizado (CARLOS)
    const memberInDb = await TabMember.findByOrFail('alias', 'CARLOS')
    assert.exists(memberInDb)

    // Verifica que a mesa foi atualizada para OCUPADA
    await table.refresh()
    assert.equal(table.status, 'OCUPADA')
  })

  test('c) Bloqueio de join se mesa estiver em CONTA_PEDIDA / BILL_REQUESTED', async ({
    client,
    assert,
  }) => {
    await Table.create({
      number: 3,
      capacity: 4,
      status: 'CONTA_PEDIDA',
    })

    const res = await client
      .post('/m/3/join')
      .withCsrfToken()
      .json({ alias: 'Novo Cliente' })
      .redirects(0)

    // Não deve redirecionar para o menu e não deve criar o membro
    assert.notEqual(res.header('location'), '/m/3/menu')

    const member = await TabMember.findBy('alias', 'NOVO CLIENTE')
    assert.isNull(member)
  })

  test('d) ClientSessionMiddleware protegendo rota do cliente (/m/:tableNumber/menu)', async ({
    client,
    assert,
  }) => {
    const table = await Table.create({
      number: 4,
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
      alias: 'ALICE',
      sessionToken: 'token-alice-12345678901234567890123456',
    })

    // 1. Sem cookie de sessão: deve ser redirecionado para /m/4
    const guestRes = await client.get('/m/4/menu').redirects(0)
    guestRes.assertStatus(302)
    assert.equal(guestRes.header('location'), '/m/4')

    // 2. Com cookie forjado / membro inexistente: deve redirecionar para /m/4 e limpar cookie
    const forgedRes = await client
      .get('/m/4/menu')
      .withEncryptedCookie('tab_session', {
        memberId: 99999,
        sessionToken: 'token-falso',
        tableNumber: 4,
      })
      .redirects(0)

    forgedRes.assertStatus(302)
    assert.equal(forgedRes.header('location'), '/m/4')

    // 3. Com comanda encerrada (CLOSED): deve limpar o cookie e redirecionar para /m/4
    tab.status = 'CLOSED'
    await tab.save()

    const closedRes = await client
      .get('/m/4/menu')
      .withEncryptedCookie('tab_session', {
        memberId: member.id,
        sessionToken: member.sessionToken,
        tableNumber: 4,
      })
      .redirects(0)

    closedRes.assertStatus(302)
    assert.equal(closedRes.header('location'), '/m/4')

    // 4. Com comanda ativa (OPEN) e sessão válida: deve ter acesso permitido (200 OK)
    tab.status = 'OPEN'
    await tab.save()

    const validRes = await client.get('/m/4/menu').withEncryptedCookie('tab_session', {
      memberId: member.id,
      sessionToken: member.sessionToken,
      tableNumber: 4,
    })

    validRes.assertStatus(200)
  })
})
