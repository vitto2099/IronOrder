import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import {
  OrderStateMachine,
  InvalidStateTransitionException,
  ForbiddenException,
} from '#modules/order_engine/state_machine/order_state_machine'
import Order from '#models/order'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import User from '#models/user'
import { DateTime } from 'luxon'

test.group('OrderStateMachine (Unit TDD)', (group) => {
  let stateMachine: OrderStateMachine
  let testTable: Table
  let testTab: Tab
  let testMember: TabMember
  let adminUser: User
  let managerUser: User
  let waiterUser: User
  let kitchenUser: User

  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('order_items').delete()
    await db.from('orders').delete()
    await db.from('tab_members').delete()
    await db.from('tabs').delete()
    await db.from('tables').delete()
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')

    stateMachine = new OrderStateMachine()

    testTable = await Table.create({
      number: Math.floor(Math.random() * 10000) + 1,
      capacity: 4,
      status: 'OCUPADA',
    })

    testTab = await Tab.create({
      tableId: testTable.id,
      status: 'ABERTA',
      openedAt: DateTime.now(),
    })

    testMember = await TabMember.create({
      tabId: testTab.id,
      alias: 'CLIENTE 1',
      sessionToken: `token-${Date.now()}-${Math.random()}`,
    })

    adminUser = await User.create({
      email: `admin-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Admin Chef',
      role: 'ADMIN',
    })

    managerUser = await User.create({
      email: `manager-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Gerente Operacional',
      role: 'GERENTE',
    })

    waiterUser = await User.create({
      email: `waiter-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Garçom Salão',
      role: 'GARCOM',
    })

    kitchenUser = await User.create({
      email: `kitchen-${Date.now()}@test.local`,
      password: 'password123',
      fullName: 'Cozinheiro Linha',
      role: 'COZINHA',
    })
  })

  // 1. Validação da matriz canTransition
  test('a) deve validar corretamente a matriz de transições com canTransition', async ({
    assert,
  }) => {
    // Transições diretas permitidas
    assert.isTrue(stateMachine.canTransition('ENVIADO', 'EM_PREPARO'))
    assert.isTrue(stateMachine.canTransition('ENVIADO', 'CANCELADO'))
    assert.isTrue(stateMachine.canTransition('EM_PREPARO', 'PRONTO'))
    assert.isTrue(stateMachine.canTransition('EM_PREPARO', 'CANCELADO'))
    assert.isTrue(stateMachine.canTransition('PRONTO', 'ENTREGUE'))
    assert.isTrue(stateMachine.canTransition('PRONTO', 'CANCELADO'))

    // Transições inválidas (pulos de etapas ou retrocessos)
    assert.isFalse(stateMachine.canTransition('ENVIADO', 'PRONTO'))
    assert.isFalse(stateMachine.canTransition('ENVIADO', 'ENTREGUE'))
    assert.isFalse(stateMachine.canTransition('EM_PREPARO', 'ENVIADO'))
    assert.isFalse(stateMachine.canTransition('EM_PREPARO', 'ENTREGUE'))
    assert.isFalse(stateMachine.canTransition('PRONTO', 'EM_PREPARO'))
    assert.isFalse(stateMachine.canTransition('PRONTO', 'ENVIADO'))

    // Estados terminais não podem transicionar para mais nenhum estado
    assert.isFalse(stateMachine.canTransition('ENTREGUE', 'ENVIADO'))
    assert.isFalse(stateMachine.canTransition('ENTREGUE', 'CANCELADO'))
    assert.isFalse(stateMachine.canTransition('CANCELADO', 'ENVIADO'))
    assert.isFalse(stateMachine.canTransition('CANCELADO', 'EM_PREPARO'))
  })

  // 2. Transições válidas de ciclo de vida normal
  test('b) deve executar o ciclo completo de vida do pedido (ENVIADO -> EM_PREPARO -> PRONTO -> ENTREGUE)', async ({
    assert,
  }) => {
    const order = await Order.create({
      tabId: testTab.id,
      tabMemberId: testMember.id,
      status: 'ENVIADO',
    })

    // 1. ENVIADO -> EM_PREPARO (Cozinha inicia)
    const inPrepOrder = await stateMachine.transition(order, 'EM_PREPARO', kitchenUser)
    assert.equal(inPrepOrder.status, 'EM_PREPARO')

    const dbOrder1 = await Order.findOrFail(order.id)
    assert.equal(dbOrder1.status, 'EM_PREPARO')

    // 2. EM_PREPARO -> PRONTO (Cozinha finaliza preparo)
    const readyOrder = await stateMachine.transition(order, 'PRONTO', kitchenUser)
    assert.equal(readyOrder.status, 'PRONTO')

    const dbOrder2 = await Order.findOrFail(order.id)
    assert.equal(dbOrder2.status, 'PRONTO')

    // 3. PRONTO -> ENTREGUE (Garçom entrega na mesa)
    const deliveredOrder = await stateMachine.transition(order, 'ENTREGUE', waiterUser)
    assert.equal(deliveredOrder.status, 'ENTREGUE')

    const dbOrder3 = await Order.findOrFail(order.id)
    assert.equal(dbOrder3.status, 'ENTREGUE')
  })

  // 3. Bloqueio de transição inválida
  test('c) deve lançar InvalidStateTransitionException ao tentar transição inválida', async ({
    assert,
  }) => {
    const order = await Order.create({
      tabId: testTab.id,
      tabMemberId: testMember.id,
      status: 'ENVIADO',
    })

    // Tentar pular de ENVIADO direto para ENTREGUE
    await assert.rejects(async () => {
      await stateMachine.transition(order, 'ENTREGUE', kitchenUser)
    }, InvalidStateTransitionException)
  })

  // 4. Cancelamento exclusivo por staff autorizado (ADMIN, GERENTE, GARCOM)
  test('d.1) deve permitir cancelamento quando solicitado por ADMIN, GERENTE ou GARCOM', async ({
    assert,
  }) => {
    const order1 = await Order.create({
      tabId: testTab.id,
      tabMemberId: testMember.id,
      status: 'ENVIADO',
    })

    const cancelled1 = await stateMachine.transition(order1, 'CANCELADO', waiterUser, {
      reason: 'Cliente trocou de ideia',
    })
    assert.equal(cancelled1.status, 'CANCELADO')
    assert.equal(cancelled1.cancellationReason, 'Cliente trocou de ideia')
    assert.equal(cancelled1.cancelledByUserId, waiterUser.id)

    const order2 = await Order.create({
      tabId: testTab.id,
      tabMemberId: testMember.id,
      status: 'EM_PREPARO',
    })

    const cancelled2 = await stateMachine.transition(order2, 'CANCELADO', managerUser, {
      reason: 'Ingrediente queimou e acabou estoque',
    })
    assert.equal(cancelled2.status, 'CANCELADO')
    assert.equal(cancelled2.cancelledByUserId, managerUser.id)

    const order3 = await Order.create({
      tabId: testTab.id,
      tabMemberId: testMember.id,
      status: 'PRONTO',
    })

    const cancelled3 = await stateMachine.transition(order3, 'CANCELADO', adminUser, {
      reason: 'Mesa foi embora sem pagar',
    })
    assert.equal(cancelled3.status, 'CANCELADO')
    assert.equal(cancelled3.cancelledByUserId, adminUser.id)
  })

  test('d.2) deve lançar ForbiddenException ao tentar cancelamento com papel não autorizado (ex: COZINHA)', async ({
    assert,
  }) => {
    const order = await Order.create({
      tabId: testTab.id,
      tabMemberId: testMember.id,
      status: 'ENVIADO',
    })

    await assert.rejects(async () => {
      await stateMachine.transition(order, 'CANCELADO', kitchenUser, {
        reason: 'Cozinheiro não quer fazer',
      })
    }, ForbiddenException)

    const refreshedOrder = await Order.findOrFail(order.id)
    assert.equal(refreshedOrder.status, 'ENVIADO')
  })
})
