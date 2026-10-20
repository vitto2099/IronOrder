import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderStateMachine from '#modules/order_engine/state_machine/order_state_machine'
import { updateKdsOrderStatusValidator } from '#validators/kds_validator'

export default class KdsController {
  private stateMachine = new OrderStateMachine()

  /**
   * Exibe o Display KDS da Cozinha com os pedidos ativos ordenados cronologicamente
   * RN-06.2: created_at ASC
   */
  async index({ inertia }: HttpContext) {
    const activeStatuses = ['ENVIADO', 'EM_PREPARO', 'PRONTO', 'PENDING', 'PREPARING', 'READY']

    const orders = await Order.query()
      .whereIn('status', activeStatuses)
      .orderBy('created_at', 'asc')
      .preload('items')
      .preload('tab', (tabQuery) => {
        tabQuery.preload('table')
      })
      .preload('member')

    const formattedOrders = orders.map((order) => {
      const table = order.tab?.table
      const member = order.member

      return {
        id: order.id,
        tabId: order.tabId,
        tabMemberId: order.tabMemberId,
        status: order.status,
        createdAt: order.createdAt.toISO() ?? order.createdAt.toString(),
        tableNumber: table?.number ?? null,
        memberAlias: member?.alias ?? 'Cliente',
        items: order.items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          nameSnapshot: item.nameSnapshot,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          notes: item.notes,
          subtotal: item.subtotal,
        })),
      }
    })

    return (inertia as any).render('staff/kds/index', {
      orders: formattedOrders,
    })
  }

  /**
   * Atualiza o status do pedido através da máquina de estados
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateKdsOrderStatusValidator)
    const order = await Order.findOrFail(params.id)

    const user = auth.user
    const updatedOrder = await this.stateMachine.transition(
      order,
      payload.status,
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
        order: updatedOrder,
      })
    }

    return response.redirect().back()
  }
}
