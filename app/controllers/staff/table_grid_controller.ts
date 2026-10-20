import type { HttpContext } from '@adonisjs/core/http'
import Table from '#models/table'
import Tab from '#models/tab'
import TabMember from '#models/tab_member'
import Order from '#models/order'
import TabSessionService from '#services/tab_session_service'
import OrderEngineService from '#services/order_engine_service'
import OrderStateMachine from '#modules/order_engine/state_machine/order_state_machine'
import { manualOrderValidator, cancelOrderValidator } from '#validators/table_grid_validator'

export default class TableGridController {
  private tabSessionService = new TabSessionService()
  private orderEngineService = new OrderEngineService()
  private stateMachine = new OrderStateMachine()

  /**
   * Lista todas as mesas com métricas operacionais e indicadores visuais (LIVRE, OCUPADA, CONTA_PEDIDA)
   */
  async index({ request, response, inertia }: HttpContext) {
    const tables = await Table.query()
      .orderBy('number', 'asc')
      .preload('tabs', (tabQuery) => {
        tabQuery
          .whereIn('status', ['OPEN', 'ABERTA', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
          .orderBy('id', 'desc')
          .preload('members')
          .preload('orders', (orderQuery) => {
            orderQuery.preload('items')
          })
      })

    let totalReadyDishes = 0

    const formattedTables = tables.map((table) => {
      const activeTab = table.tabs[0] || null
      let totalAmount = 0
      let readyOrdersCount = 0

      if (activeTab) {
        for (const order of activeTab.orders) {
          if (order.status === 'PRONTO' || order.status === 'READY') {
            readyOrdersCount += 1
            totalReadyDishes += 1
          }

          if (order.status !== 'CANCELADO' && order.status !== 'CANCELLED') {
            for (const item of order.items) {
              totalAmount += Number(item.unitPrice) * item.quantity
            }
          }
        }
      }

      return {
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        hasReadyOrders: readyOrdersCount > 0,
        readyOrdersCount,
        membersCount: activeTab?.members?.length ?? 0,
        totalAmount: Number(totalAmount.toFixed(2)),
        activeTabId: activeTab?.id ?? null,
        openedAt: activeTab?.openedAt?.toISO?.() ?? activeTab?.openedAt?.toString() ?? null,
      }
    })

    const metrics = {
      totalTables: tables.length,
      freeTables: tables.filter((t) => t.status === 'LIVRE').length,
      occupiedTables: tables.filter((t) => t.status === 'OCUPADA').length,
      billRequestedTables: tables.filter(
        (t) => t.status === 'CONTA_PEDIDA' || (t.status as string) === 'BILL_REQUESTED'
      ).length,
      totalReadyDishes,
    }

    if (request.accepts(['json', 'html']) === 'json' && !request.header('X-Inertia')) {
      return response.ok({
        tables: formattedTables,
        metrics,
      })
    }

    return (inertia as any).render('staff/tables/index', {
      tables: formattedTables,
      metrics,
    })
  }

  /**
   * Exibe os detalhes da mesa, comanda ativa, membros presentes e pedidos agrupados
   */
  async show({ params, request, response, inertia }: HttpContext) {
    const table = await Table.findOrFail(params.id)

    const activeTab = await Tab.query()
      .where('table_id', table.id)
      .whereIn('status', ['OPEN', 'ABERTA', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
      .orderBy('id', 'desc')
      .preload('members')
      .preload('orders', (orderQuery) => {
        orderQuery.orderBy('created_at', 'desc').preload('items')
      })
      .first()

    let tabSummary = null
    if (activeTab) {
      tabSummary = await this.tabSessionService.getTabSummary(table.id)
    }

    const formattedOrders =
      activeTab?.orders.map((order) => {
        const member = activeTab.members.find((m) => m.id === order.tabMemberId)
        return {
          id: order.id,
          tabId: order.tabId,
          tabMemberId: order.tabMemberId,
          status: order.status,
          createdAt: order.createdAt?.toISO?.() ?? order.createdAt?.toString(),
          memberAlias: member?.alias ?? 'Cliente',
          items: order.items.map((i) => ({
            id: i.id,
            orderId: i.orderId,
            productId: i.productId,
            nameSnapshot: i.nameSnapshot,
            unitPrice: Number(i.unitPrice),
            quantity: i.quantity,
            notes: i.notes,
            subtotal: i.subtotal,
          })),
        }
      }) || []

    const result = {
      table: {
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
      },
      tab: tabSummary,
      members: activeTab?.members || [],
      orders: formattedOrders,
    }

    if (request.accepts(['json', 'html']) === 'json' && !request.header('X-Inertia')) {
      return response.ok(result)
    }

    return (inertia as any).render('staff/tables/show', result)
  }

  /**
   * Lança pedido manual pelo garçom associando a um alias existente ou avulso (RN-06.1)
   */
  async manualOrder({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(manualOrderValidator)
    const table = await Table.findOrFail(params.id)

    let targetTabMemberId = payload.tabMemberId

    // Se o tabMemberId não foi informado, resolve via alias (ou 'BALCÃO')
    if (!targetTabMemberId) {
      const aliasToUse = payload.alias?.trim() || 'BALCÃO'

      // Se a mesa estiver livre ou sem comanda ativa, bindAliasToTable abre a comanda
      const bindResult = await this.tabSessionService.bindAliasToTable(table.id, aliasToUse)
      targetTabMemberId = bindResult.member.id
    }

    const member = await TabMember.findOrFail(targetTabMemberId)

    const order = await this.orderEngineService.submitBatchOrder({
      tabId: member.tabId,
      tabMemberId: member.id,
      items: payload.items,
    })

    if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
      return response.created({
        success: true,
        order,
      })
    }

    return response.redirect().back()
  }

  /**
   * Dá baixa na entrega de um pedido PRONTO para ENTREGUE (RN-04.3)
   */
  async markDelivered({ params, request, response, auth }: HttpContext) {
    const order = await Order.findOrFail(params.orderId)
    const user = auth.user

    const updated = await this.stateMachine.transition(
      order,
      'ENTREGUE',
      user
        ? {
            id: user.id,
            role: user.role,
            fullName: user.fullName,
          }
        : null
    )

    if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
      return response.ok({
        success: true,
        order: updated,
      })
    }

    return response.redirect().back()
  }

  /**
   * Cancela um pedido informando justificativa por staff autorizado (RN-03.3)
   */
  async cancelOrder({ params, request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(cancelOrderValidator)
    const order = await Order.findOrFail(params.orderId)
    const user = auth.user

    const cancelled = await this.stateMachine.transition(
      order,
      'CANCELADO',
      user
        ? {
            id: user.id,
            role: user.role,
            fullName: user.fullName,
          }
        : null,
      { reason: payload.reason }
    )

    if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
      return response.ok({
        success: true,
        order: cancelled,
      })
    }

    return response.redirect().back()
  }

  /**
   * Quita a comanda individual de um membro específico (RN-MEMBER.4)
   */
  async payMember({ params, request, response, session }: HttpContext) {
    try {
      const result = await this.tabSessionService.payMember(Number(params.memberId))

      const message = `Comanda de ${result.member.alias} quitada com sucesso!`
      session?.flash('notification', { type: 'success', message })

      if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
        return response.ok({
          success: true,
          message,
          member: result.member,
          remainingActiveMembers: result.remainingActiveMembers,
          table: result.table,
        })
      }

      return response.redirect().back()
    } catch (error: any) {
      session?.flash('notification', {
        type: 'error',
        message: error.message || 'Erro ao liquidar comanda do cliente.',
      })

      if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
        return response.status(422).json({
          success: false,
          error: error.message,
        })
      }

      return response.redirect().back()
    }
  }

  /**
   * Quita todos os membros em lote e libera a mesa simultaneamente (RN-MEMBER.5)
   */
  async payAllAndRelease({ params, request, response, session }: HttpContext) {
    try {
      const result = await this.tabSessionService.payAllMembersAndReleaseTable(Number(params.id))

      const message = `Mesa ${result.table.number} liquidada e liberada com sucesso!`
      session?.flash('notification', { type: 'success', message })

      if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
        return response.ok({
          success: true,
          message,
          table: result.table,
          tab: result.tab,
        })
      }

      return response.redirect().back()
    } catch (error: any) {
      session?.flash('notification', {
        type: 'error',
        message: error.message || 'Erro ao liquidar e liberar mesa.',
      })

      if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
        return response.status(422).json({
          success: false,
          error: error.message,
        })
      }

      return response.redirect().back()
    }
  }

  /**
   * Libera a mesa e fecha a comanda presencialmente (RN-05.3 / RN-MEMBER.5)
   */
  async release({ params, request, response, session }: HttpContext) {
    try {
      const result = await this.tabSessionService.releaseTable(params.id)

      const message = 'Mesa liberada com sucesso.'
      session?.flash('notification', { type: 'success', message })

      if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
        return response.ok({
          success: true,
          message,
          table: result.table,
          tab: result.tab,
        })
      }

      return response.redirect().back()
    } catch (error: any) {
      session?.flash('notification', {
        type: 'error',
        message: error.message || 'Erro ao liberar mesa.',
      })

      if (request.header('accept')?.includes('application/json') && !request.header('X-Inertia')) {
        return response.status(422).json({
          success: false,
          error: error.message,
        })
      }

      return response.redirect().back()
    }
  }
}
