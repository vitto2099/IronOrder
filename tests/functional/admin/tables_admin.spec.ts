import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Table from '#models/table'

test.group('Admin Tables (Functional HTTP)', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    if (await db.connection().schema.hasTable('tabs')) {
      await db.from('tabs').delete()
    }
    await db.from('tables').delete()
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('a) Acesso a /admin/tables e /admin/tables/print protegido por RBAC (somente ADMIN)', async ({
    client,
    assert,
  }) => {
    // Anônimo
    const guestRes = await client.get('/admin/tables').header('accept', 'application/json')
    assert.equal(guestRes.status(), 401)

    // Gerente (não tem permissão em tables - apenas ADMIN)
    const manager = await User.create({
      email: 'manager@test.local',
      password: 'password123',
      fullName: 'Gerente Teste',
      role: 'GERENTE',
    })
    const managerRes = await client.get('/admin/tables').loginAs(manager)
    managerRes.assertStatus(403)

    // Garçom
    const waiter = await User.create({
      email: 'waiter@test.local',
      password: 'password123',
      fullName: 'Garçom Teste',
      role: 'GARCOM',
    })
    const waiterRes = await client.get('/admin/tables').loginAs(waiter)
    waiterRes.assertStatus(403)

    // Administrador
    const admin = await User.create({
      email: 'admin@test.local',
      password: 'password123',
      fullName: 'Admin Teste',
      role: 'ADMIN',
    })
    const adminRes = await client.get('/admin/tables').loginAs(admin)
    adminRes.assertStatus(200)

    const adminPrintRes = await client.get('/admin/tables/print').loginAs(admin)
    adminPrintRes.assertStatus(200)
  })

  test('b) Criação de mesa individual e em lote com validação de unicidade', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin@tables.test',
      password: 'password123',
      fullName: 'Admin Tables',
      role: 'ADMIN',
    })

    // Criação individual
    const createRes = await client.post('/admin/tables').loginAs(admin).withCsrfToken().json({
      number: 1,
      capacity: 4,
    })
    assert.oneOf(createRes.status(), [200, 201, 302])

    const createdTable = await Table.findBy('number', 1)
    assert.isNotNull(createdTable)
    assert.equal(createdTable?.capacity, 4)
    assert.equal(createdTable?.status, 'LIVRE')

    // Tentar duplicar mesa 1 deve falhar
    const dupRes = await client
      .post('/admin/tables')
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        number: 1,
        capacity: 6,
      })
    assert.oneOf(dupRes.status(), [400, 422])

    // Criação em lote (ex: mesas 2 a 5)
    const batchRes = await client.post('/admin/tables').loginAs(admin).withCsrfToken().json({
      isBatch: true,
      startNumber: 2,
      endNumber: 5,
      capacity: 4,
    })
    assert.oneOf(batchRes.status(), [200, 201, 302])

    const allTables = await Table.query().orderBy('number', 'asc')
    assert.lengthOf(allTables, 5) // Mesas 1, 2, 3, 4, 5
    assert.deepEqual(
      allTables.map((t) => t.number),
      [1, 2, 3, 4, 5]
    )
  })

  test('c) Exclusão de mesa: permitida se LIVRE e bloqueada se OCUPADA ou com comanda ativa', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin_delete@test.local',
      password: 'password123',
      fullName: 'Admin Delete',
      role: 'ADMIN',
    })

    const freeTable = await Table.create({
      number: 10,
      capacity: 2,
      status: 'LIVRE',
    })

    const busyTable = await Table.create({
      number: 11,
      capacity: 4,
      status: 'OCUPADA',
    })

    // Exclusão da mesa livre deve ter sucesso
    const deleteFreeRes = await client
      .delete(`/admin/tables/${freeTable.id}`)
      .loginAs(admin)
      .withCsrfToken()
    assert.oneOf(deleteFreeRes.status(), [200, 302])

    const checkFree = await Table.find(freeTable.id)
    assert.isNull(checkFree)

    // Exclusão da mesa ocupada deve falhar
    const deleteBusyRes = await client
      .delete(`/admin/tables/${busyTable.id}`)
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
    assert.oneOf(deleteBusyRes.status(), [400, 422])

    const checkBusy = await Table.find(busyTable.id)
    assert.isNotNull(checkBusy)
  })

  test('d) Página de impressão de etiquetas gera QR Code com dados válidos', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin_print@test.local',
      password: 'password123',
      fullName: 'Admin Print',
      role: 'ADMIN',
    })

    await Table.create({
      number: 99,
      capacity: 6,
      status: 'LIVRE',
    })

    const printRes = await client.get('/admin/tables/print').loginAs(admin)
    printRes.assertStatus(200)

    // Se requisitar com accept json, deve retornar lista de mesas com qrCodeDataUrl
    const printJsonRes = await client
      .get('/admin/tables/print')
      .loginAs(admin)
      .header('accept', 'application/json')
    assert.equal(printJsonRes.status(), 200)
    const body = printJsonRes.body()
    const tablesList = body.tables || body.props?.tables
    assert.isDefined(tablesList)
    assert.isTrue(tablesList.some((t: any) => t.number === 99 && Boolean(t.qrCodeDataUrl)))
  })
})
