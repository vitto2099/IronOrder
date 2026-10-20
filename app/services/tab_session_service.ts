import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember, { type TabMemberStatus } from '#models/tab_member'
import Order from '#models/order'

export interface TabMemberSummary {
  id: number
  alias: string
  status: TabMemberStatus
  subtotal: number
  itemsCount: number
  hasPendingOrders: boolean
  paidAt: string | null
}

export interface TabSummary {
  tabId: number
  tableNumber: number
  status: string
  total: number
  members: TabMemberSummary[]
  activeMembersCount: number
  paidMembersCount: number
  hasPendingOrders: boolean
}

export interface BindAliasResult {
  member: TabMember
  isNewTab: boolean
  tab: Tab
  table: Table
}

export class TabSessionService {
  /**
   * Vincula um alias a uma mesa física através do fluxo Zero-Auth.
   * Abre uma nova comanda caso a mesa esteja livre ou recupera a comanda ativa existente.
   */
  async bindAliasToTable(tableIdOrNumber: number, desiredAlias: string): Promise<BindAliasResult> {
    const rawAlias = desiredAlias?.trim()
    if (!rawAlias) {
      throw new Error('Apelido não pode ser vazio.')
    }

    const normalizedAlias = rawAlias.toUpperCase()

    return await db.transaction(async (trx) => {
      // Localiza a mesa por ID ou por número
      let table = await Table.query({ client: trx })
        .where('id', tableIdOrNumber)
        .orWhere('number', tableIdOrNumber)
        .first()

      if (!table) {
        throw new Error(`Mesa ${tableIdOrNumber} não encontrada.`)
      }

      // Se a mesa estiver em processo de conta solicitada e todos os membros já pediram conta, bloqueia
      if (table.status === 'CONTA_PEDIDA' || (table.status as string) === 'BILL_REQUESTED') {
        throw new Error('Mesa em processo de fechamento. Entrada de novos membros bloqueada.')
      }

      // Busca comanda ativa da mesa
      let tab = await Tab.query({ client: trx })
        .where('table_id', table.id)
        .whereIn('status', ['ABERTA', 'OPEN', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
        .orderBy('id', 'desc')
        .first()

      let isNewTab = false

      if (!tab) {
        // Abre nova comanda
        tab = await Tab.create(
          {
            tableId: table.id,
            status: 'OPEN',
            openedAt: DateTime.now(),
          },
          { client: trx }
        )

        table.status = 'OCUPADA'
        await table.useTransaction(trx).save()
        isNewTab = true
      } else {
        if (tab.status === 'FECHADA' || (tab.status as string) === 'CLOSED') {
          throw new Error('Comanda fechada. Entrada de novos membros bloqueada.')
        }

        if (table.status === 'LIVRE') {
          table.status = 'OCUPADA'
          await table.useTransaction(trx).save()
        }
      }

      // Deduplicação de alias na comanda
      const existingMembers = await TabMember.query({ client: trx }).where('tab_id', tab.id)
      const existingAliases = new Set(existingMembers.map((m) => m.alias.toUpperCase()))

      let finalAlias = normalizedAlias
      if (existingAliases.has(normalizedAlias)) {
        let suffix = 2
        while (
          existingAliases.has(`${normalizedAlias} ${suffix}`) ||
          existingAliases.has(`${normalizedAlias} (${suffix})`)
        ) {
          suffix++
        }
        finalAlias = `${normalizedAlias} ${suffix}`
      }

      // Gera token de sessão opaco e seguro
      const sessionToken = randomBytes(24).toString('hex')

      const member = await TabMember.create(
        {
          tabId: tab.id,
          alias: finalAlias,
          sessionToken,
          status: 'OPEN',
        },
        { client: trx }
      )

      return {
        member,
        isNewTab,
        tab,
        table,
      }
    })
  }

  /**
   * Vincula um alias diretamente pelo ID da comanda.
   */
  async bindAliasToTab(tabId: number, desiredAlias: string): Promise<BindAliasResult> {
    const tab = await Tab.findOrFail(tabId)
    if (tab.status === 'FECHADA' || (tab.status as string) === 'CLOSED') {
      throw new Error('Comanda fechada. Entrada de novos membros bloqueada.')
    }
    return this.bindAliasToTable(tab.tableId, desiredAlias)
  }

  /**
   * Solicita a conta individual de um membro específico (RN-MEMBER.2).
   */
  async requestMemberBill(memberId: number): Promise<{ member: TabMember; table: Table }> {
    const member = await TabMember.query().where('id', memberId).preload('tab').firstOrFail()

    if (member.status === 'PAID') {
      throw new Error('A comanda deste cliente já foi quitada.')
    }

    member.status = 'BILL_REQUESTED'
    await member.save()

    const table = await Table.findOrFail(member.tab.tableId)

    // Se todos os membros não-pagos tiverem pedido a conta, transiciona a mesa para CONTA_PEDIDA
    const allMembers = await TabMember.query().where('tab_id', member.tabId)
    const nonPaidMembers = allMembers.filter((m) => m.status !== 'PAID')
    const allRequested =
      nonPaidMembers.length > 0 && nonPaidMembers.every((m) => m.status === 'BILL_REQUESTED')

    if (allRequested) {
      table.status = 'CONTA_PEDIDA'
      await table.save()
    }

    return { member, table }
  }

  /**
   * Solicita a conta da mesa. Se memberId for passado, solicita apenas dele.
   */
  async requestBill(tableIdOrNumber: number, memberId?: number): Promise<Table> {
    if (memberId) {
      const res = await this.requestMemberBill(memberId)
      return res.table
    }

    const table = await Table.query()
      .where('id', tableIdOrNumber)
      .orWhere('number', tableIdOrNumber)
      .firstOrFail()

    const tab = await Tab.query()
      .where('table_id', table.id)
      .whereIn('status', ['ABERTA', 'OPEN', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
      .orderBy('id', 'desc')
      .first()

    if (tab) {
      await TabMember.query()
        .where('tab_id', tab.id)
        .where('status', 'OPEN')
        .update({ status: 'BILL_REQUESTED' })
    }

    table.status = 'CONTA_PEDIDA'
    await table.save()
    return table
  }

  /**
   * Realiza a liquidação individual da conta de um membro (RN-MEMBER.3 e RN-MEMBER.4).
   * Trava anti-orfandade: impede liquidação se houver pedidos em preparo ou a caminho.
   */
  async payMember(
    memberId: number
  ): Promise<{ member: TabMember; remainingActiveMembers: number; table: Table }> {
    return await db.transaction(async (trx) => {
      const member = await TabMember.query({ client: trx })
        .where('id', memberId)
        .preload('tab')
        .firstOrFail()

      if (member.status === 'PAID') {
        throw new Error('Esta comanda já foi quitada anteriormente.')
      }

      // Trava Anti-Orfandade no KDS: pedidos do membro com status não-final
      const pendingOrders = await Order.query({ client: trx })
        .where('tab_member_id', member.id)
        .whereIn('status', ['ENVIADO', 'EM_PREPARO', 'PRONTO', 'PENDING', 'PREPARING', 'READY'])

      if (pendingOrders.length > 0) {
        const orderIds = pendingOrders.map((o) => `#${o.id} (${o.status})`).join(', ')
        throw new Error(
          `Não é possível liquidar a comanda: o cliente ${member.alias} possui pedidos em andamento [${orderIds}]. Conclua a entrega ou cancele antes de receber.`
        )
      }

      member.status = 'PAID'
      member.paidAt = DateTime.now()
      member.closedAt = DateTime.now()
      await member.useTransaction(trx).save()

      const table = await Table.findOrFail(member.tab.tableId, { client: trx })

      // Analisa membros restantes da mesa
      const allMembers = await TabMember.query({ client: trx }).where('tab_id', member.tabId)
      const remainingOpen = allMembers.filter((m) => m.status === 'OPEN')
      const remainingBillRequested = allMembers.filter((m) => m.status === 'BILL_REQUESTED')
      const remainingActive = remainingOpen.length + remainingBillRequested.length

      if (remainingOpen.length === 0 && remainingBillRequested.length > 0) {
        table.status = 'CONTA_PEDIDA'
        await table.useTransaction(trx).save()
      } else if (remainingOpen.length > 0) {
        table.status = 'OCUPADA'
        await table.useTransaction(trx).save()
      }

      return {
        member,
        remainingActiveMembers: remainingActive,
        table,
      }
    })
  }

  /**
   * Quita todos os membros em lote e libera a mesa simultaneamente (RN-MEMBER.5).
   * Trava anti-orfandade: só permite se 100% dos pratos da mesa estiverem entregues ou cancelados.
   */
  async payAllMembersAndReleaseTable(tableIdOrNumber: number): Promise<{ table: Table; tab: Tab }> {
    return await db.transaction(async (trx) => {
      const table = await Table.query({ client: trx })
        .where('id', tableIdOrNumber)
        .orWhere('number', tableIdOrNumber)
        .firstOrFail()

      const tab = await Tab.query({ client: trx })
        .where('table_id', table.id)
        .whereIn('status', ['ABERTA', 'OPEN', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
        .orderBy('id', 'desc')
        .firstOrFail()

      // Trava Anti-Orfandade global
      const pendingOrders = await Order.query({ client: trx })
        .where('tab_id', tab.id)
        .whereIn('status', ['ENVIADO', 'EM_PREPARO', 'PRONTO', 'PENDING', 'PREPARING', 'READY'])

      if (pendingOrders.length > 0) {
        const orderIds = pendingOrders.map((o) => `#${o.id} (${o.status})`).join(', ')
        throw new Error(
          `Não é possível liquidar todos os membros: existem pedidos em andamento na mesa ${table.number} [${orderIds}]. Conclua as entregas ou cancele os pedidos antes de finalizar.`
        )
      }

      const members = await TabMember.query({ client: trx }).where('tab_id', tab.id)
      for (const m of members) {
        if (m.status !== 'PAID') {
          m.status = 'PAID'
          m.paidAt = DateTime.now()
          m.closedAt = DateTime.now()
          await m.useTransaction(trx).save()
        }
      }

      tab.status = 'CLOSED'
      tab.closedAt = DateTime.now()
      await tab.useTransaction(trx).save()

      table.status = 'LIVRE'
      await table.useTransaction(trx).save()

      return { table, tab }
    })
  }

  /**
   * Encerra a comanda e libera a mesa (LIVRE).
   * Valida se todos os membros foram quitados e se não há pedidos pendentes.
   */
  async releaseTable(tableIdOrNumber: number): Promise<{ table: Table; tab: Tab | null }> {
    return await db.transaction(async (trx) => {
      const table = await Table.query({ client: trx })
        .where('id', tableIdOrNumber)
        .orWhere('number', tableIdOrNumber)
        .firstOrFail()

      const tab = await Tab.query({ client: trx })
        .where('table_id', table.id)
        .whereIn('status', ['ABERTA', 'OPEN', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
        .orderBy('id', 'desc')
        .first()

      if (tab) {
        // Valida pedidos não finalizados
        const pendingOrders = await Order.query({ client: trx })
          .where('tab_id', tab.id)
          .whereIn('status', ['ENVIADO', 'EM_PREPARO', 'PRONTO', 'PENDING', 'PREPARING', 'READY'])

        if (pendingOrders.length > 0) {
          const orderIds = pendingOrders.map((o) => `#${o.id} (${o.status})`).join(', ')
          throw new Error(
            `Não é possível liberar a mesa: existem pedidos em andamento na cozinha/salão [${orderIds}]. Finalize as entregas antes de liberar.`
          )
        }

        // Valida membros não quitados
        const unclosedMembers = await TabMember.query({ client: trx })
          .where('tab_id', tab.id)
          .whereNot('status', 'PAID')

        if (unclosedMembers.length > 0) {
          const names = unclosedMembers.map((m) => `${m.alias} (${m.status})`).join(', ')
          throw new Error(
            `Não é possível liberar a mesa: ainda existem comandas em aberto [${names}]. Realize a liquidação dos membros antes de liberar.`
          )
        }

        tab.status = 'CLOSED'
        tab.closedAt = DateTime.now()
        await tab.useTransaction(trx).save()
      }

      table.status = 'LIVRE'
      await table.useTransaction(trx).save()

      return { table, tab }
    })
  }

  /**
   * Obtém o extrato financeiro detalhado da comanda ativa com subtotais por membro e status.
   */
  async getTabSummary(tableIdOrNumber: number): Promise<TabSummary> {
    const table = await Table.query()
      .where('id', tableIdOrNumber)
      .orWhere('number', tableIdOrNumber)
      .firstOrFail()

    const tab = await Tab.query().where('table_id', table.id).orderBy('id', 'desc').first()

    if (!tab) {
      throw new Error(`Nenhuma comanda encontrada para a mesa ${table.number}.`)
    }

    const members = await TabMember.query().where('tab_id', tab.id)
    const orders = await Order.query().where('tab_id', tab.id).preload('items')

    const memberStats = new Map<
      number,
      { subtotal: number; itemsCount: number; hasPendingOrders: boolean }
    >()
    for (const member of members) {
      memberStats.set(member.id, { subtotal: 0, itemsCount: 0, hasPendingOrders: false })
    }

    let grandTotal = 0
    let tabHasPendingOrders = false

    for (const order of orders) {
      const isPending = [
        'ENVIADO',
        'EM_PREPARO',
        'PRONTO',
        'PENDING',
        'PREPARING',
        'READY',
      ].includes(order.status)

      if (isPending) {
        tabHasPendingOrders = true
      }

      // Ignora pedidos cancelados conforme RN-04.2
      if (order.status === 'CANCELADO') {
        continue
      }

      const stats = memberStats.get(order.tabMemberId)
      if (stats && isPending) {
        stats.hasPendingOrders = true
      }

      for (const item of order.items) {
        const itemTotal = Number(item.unitPrice) * item.quantity
        grandTotal += itemTotal

        if (stats) {
          stats.subtotal += itemTotal
          stats.itemsCount += item.quantity
        }
      }
    }

    const activeMembersCount = members.filter((m) => m.status !== 'PAID').length
    const paidMembersCount = members.filter((m) => m.status === 'PAID').length

    return {
      tabId: tab.id,
      tableNumber: table.number,
      status: tab.status,
      total: Number(grandTotal.toFixed(2)),
      activeMembersCount,
      paidMembersCount,
      hasPendingOrders: tabHasPendingOrders,
      members: members.map((m) => {
        const s = memberStats.get(m.id)
        return {
          id: m.id,
          alias: m.alias,
          status: m.status,
          subtotal: Number((s?.subtotal ?? 0).toFixed(2)),
          itemsCount: s?.itemsCount ?? 0,
          hasPendingOrders: s?.hasPendingOrders ?? false,
          paidAt: m.paidAt?.toISO?.() ?? null,
        }
      }),
    }
  }

  /**
   * Obtém o extrato completo da mesa discriminando itens consumidos por membro
   * para exibição no extrato mobile (TASK-09 & TASK-15).
   */
  async getTabStatement(tableIdOrNumber: number, currentMemberId?: number) {
    const table = await Table.query()
      .where('id', tableIdOrNumber)
      .orWhere('number', tableIdOrNumber)
      .firstOrFail()

    const tab = await Tab.query().where('table_id', table.id).orderBy('id', 'desc').first()

    if (!tab) {
      throw new Error(`Nenhuma comanda encontrada para a mesa ${table.number}.`)
    }

    const members = await TabMember.query().where('tab_id', tab.id)
    const orders = await Order.query()
      .where('tab_id', tab.id)
      .preload('items')
      .orderBy('created_at', 'asc')

    let tableTotal = 0
    let mySubtotal = 0
    let myStatus: TabMemberStatus = 'OPEN'

    const membersBreakdown = members.map((member) => {
      let memberSubtotal = 0
      let hasPendingOrders = false

      const memberItems: Array<{
        id: number
        name: string
        unitPrice: number
        quantity: number
        subtotal: number
        status: string
        notes?: string | null
        orderId: number
      }> = []

      const memberOrders = orders.filter((o) => o.tabMemberId === member.id)

      for (const order of memberOrders) {
        if (
          ['ENVIADO', 'EM_PREPARO', 'PRONTO', 'PENDING', 'PREPARING', 'READY'].includes(
            order.status
          )
        ) {
          hasPendingOrders = true
        }

        for (const item of order.items) {
          const itemSubtotal = Number(item.unitPrice) * item.quantity

          if (order.status !== 'CANCELADO') {
            memberSubtotal += itemSubtotal
            tableTotal += itemSubtotal

            if (currentMemberId && member.id === currentMemberId) {
              mySubtotal += itemSubtotal
            }
          }

          memberItems.push({
            id: item.id,
            name: item.nameSnapshot,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            subtotal: Number(itemSubtotal.toFixed(2)),
            status: order.status,
            notes: item.notes,
            orderId: order.id,
          })
        }
      }

      if (currentMemberId && member.id === currentMemberId) {
        myStatus = member.status
      }

      return {
        id: member.id,
        alias: member.alias,
        status: member.status,
        subtotal: Number(memberSubtotal.toFixed(2)),
        hasPendingOrders,
        paidAt: member.paidAt?.toISO?.() ?? null,
        items: memberItems,
      }
    })

    return {
      tableNumber: table.number,
      tableStatus: table.status,
      tableTotal: Number(tableTotal.toFixed(2)),
      mySubtotal: Number(mySubtotal.toFixed(2)),
      myStatus,
      tabId: tab.id,
      membersBreakdown,
    }
  }
}

export default TabSessionService
