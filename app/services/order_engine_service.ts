import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import Order, { type OrderStatus } from '#models/order'
import OrderItem from '#models/order_item'
import Product from '#models/product'
import Tab from '#models/tab'
import Table from '#models/table'

export class OrderException extends Exception {
  static status = 422
}

export class ForbiddenException extends Exception {
  static status = 403
}

export interface OrderItemDTO {
  productId: number
  quantity: number
  notes?: string | null
}

export interface SubmitBatchOrderDTO {
  tabId: number
  tabMemberId: number
  items: OrderItemDTO[]
}

export interface CancelOrderOptions {
  reason?: string
  cancelledByUserId?: number
  staffRole?: string
  staffUser?: { id: number; role: string }
}

const ALLOWED_STAFF_ROLES = ['GARCOM', 'GERENTE', 'ADMIN', 'STAFF', 'WAITER', 'MANAGER']

export class OrderEngineService {
  /**
   * Dispara um lote de pedidos de forma estritamente atômica dentro de uma transação.
   * RN-02.1: Valida estoque/disponibilidade dos itens.
   * RN-02.2: Congela unit_price e nome do produto no OrderItem.
   * RN-03.1: Se qualquer item falhar, toda a operação sofre rollback.
   * RN-05.1: Rejeita pedidos se a mesa/comanda estiver em fechamento.
   */
  async submitBatchOrder(payload: SubmitBatchOrderDTO): Promise<Order> {
    if (!payload.items || payload.items.length === 0) {
      throw new OrderException('O carrinho está vazio. Adicione pelo menos um item.', {
        status: 422,
        code: 'E_EMPTY_ORDER',
      })
    }

    for (const item of payload.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new OrderException('A quantidade de cada item deve ser de no mínimo 1.', {
          status: 422,
          code: 'E_INVALID_QUANTITY',
        })
      }
    }

    // Validação do estado da comanda / mesa
    if (payload.tabId) {
      const tab = await Tab.find(payload.tabId)
      if (tab) {
        if (['FECHADA', 'CLOSED'].includes(tab.status)) {
          throw new OrderException('Mesa em fechamento. Não são aceitos novos pedidos.', {
            status: 422,
            code: 'E_TAB_CLOSED',
          })
        }

        if (tab.tableId) {
          const table = await Table.find(tab.tableId)
          if (table && ['CONTA_PEDIDA', 'BILL_REQUESTED'].includes(table.status)) {
            throw new OrderException('Mesa em fechamento. Não são aceitos novos pedidos.', {
              status: 422,
              code: 'E_BILL_REQUESTED',
            })
          }
        }
      }
    }

    return await db.transaction(async (trx) => {
      // 1. Carrega e valida todos os produtos com lock/verificação na transação
      const productMap = new Map<number, Product>()

      for (const item of payload.items) {
        const product = await Product.find(item.productId, { client: trx })
        if (!product) {
          throw new OrderException(`Produto #${item.productId} não encontrado.`, {
            status: 404,
            code: 'E_PRODUCT_NOT_FOUND',
          })
        }

        if (!product.isAvailable || ('deletedAt' in product && (product as any).deletedAt)) {
          throw new OrderException(`Produto '${product.name}' está indisponível.`, {
            status: 422,
            code: 'E_PRODUCT_UNAVAILABLE',
          })
        }

        productMap.set(item.productId, product)
      }

      // 2. Criação do Pedido principal
      const order = new Order()
      order.useTransaction(trx)
      order.tabId = payload.tabId
      order.tabMemberId = payload.tabMemberId
      order.status = 'PENDING'
      await order.save()

      // 3. Criação de cada OrderItem congelando snapshot e unitPrice
      for (const item of payload.items) {
        const product = productMap.get(item.productId)!
        const orderItem = new OrderItem()
        orderItem.useTransaction(trx)
        orderItem.orderId = order.id
        orderItem.productId = product.id
        orderItem.nameSnapshot = product.name
        orderItem.unitPrice = Number(product.price)
        orderItem.quantity = item.quantity
        orderItem.notes = item.notes || null
        await orderItem.save()
      }

      // 4. Carrega os itens do pedido com os snapshots para retorno consistente
      await order.load('items')

      return order
    })
  }

  /**
   * Transiciona o status do pedido respeitando o ciclo de vida:
   * PENDING -> PREPARING -> READY / DELIVERED
   * ENVIADO -> EM_PREPARO -> PRONTO / ENTREGUE
   */
  async updateStatus(orderId: number, nextStatus: OrderStatus): Promise<Order> {
    const order = await Order.findOrFail(orderId)

    const normalizedCurrent = this.normalizeStatus(order.status)
    const normalizedNext = this.normalizeStatus(nextStatus)

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
      PREPARING: ['READY', 'DELIVERED'],
      READY: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    }

    const possibleNextStates = allowedTransitions[normalizedCurrent] || []
    if (!possibleNextStates.includes(normalizedNext)) {
      throw new OrderException(
        `Transição inválida de status: ${order.status} para ${nextStatus}. Operação não permitida.`,
        { status: 422, code: 'E_INVALID_STATUS_TRANSITION' }
      )
    }

    order.status = nextStatus
    await order.save()
    await order.load('items')
    return order
  }

  /**
   * Cancela um pedido se estiver no status PENDING / ENVIADO.
   * RN-03.3: Exclusivo para perfis de Staff (Garçom, Gerente, Admin).
   */
  async cancelOrder(orderId: number, options?: CancelOrderOptions): Promise<Order> {
    const order = await Order.findOrFail(orderId)

    const role = options?.staffRole || options?.staffUser?.role
    if (role && !ALLOWED_STAFF_ROLES.includes(role.toUpperCase())) {
      throw new ForbiddenException(
        'Apenas membros da equipe (Garçom, Gerente, Admin) têm permissão para cancelar pedidos.',
        { status: 403, code: 'E_FORBIDDEN' }
      )
    }

    const normalizedStatus = this.normalizeStatus(order.status)
    if (normalizedStatus !== 'PENDING') {
      throw new OrderException(
        'Apenas pedidos pendentes podem ser cancelados. Pedidos em preparo ou entregues não podem ser cancelados.',
        { status: 422, code: 'E_CANNOT_CANCEL_ORDER' }
      )
    }

    const cancellationStatus =
      order.status === 'ENVIADO' || order.status === 'EM_PREPARO' ? 'CANCELADO' : 'CANCELLED'

    order.status = cancellationStatus
    order.cancellationReason = options?.reason || null
    order.cancelledByUserId = options?.cancelledByUserId || options?.staffUser?.id || null

    await order.save()
    await order.load('items')
    return order
  }

  /**
   * Normaliza os sinônimos de status (EN / PT) para máquina de estados consistente
   */
  private normalizeStatus(
    status: OrderStatus
  ): 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' {
    switch (status) {
      case 'ENVIADO':
      case 'PENDING':
        return 'PENDING'
      case 'EM_PREPARO':
      case 'PREPARING':
        return 'PREPARING'
      case 'PRONTO':
      case 'READY':
        return 'READY'
      case 'ENTREGUE':
      case 'DELIVERED':
        return 'DELIVERED'
      case 'CANCELADO':
      case 'CANCELLED':
        return 'CANCELLED'
      default:
        return 'PENDING'
    }
  }
}

export default OrderEngineService
