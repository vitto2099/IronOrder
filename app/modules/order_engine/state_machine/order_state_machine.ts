import { Exception } from '@adonisjs/core/exceptions'
import type Order from '#models/order'
import type { OrderStatus } from '#models/order'

export class InvalidStateTransitionException extends Exception {
  static status = 422
  static code = 'E_INVALID_STATE_TRANSITION'
}

export class ForbiddenException extends Exception {
  static status = 403
  static code = 'E_FORBIDDEN'
}

export interface StaffContext {
  id: number
  role: string
  fullName?: string | null
}

export interface TransitionOptions {
  reason?: string
}

const ALLOWED_STAFF_CANCELLATION_ROLES = ['ADMIN', 'GERENTE', 'GARCOM']

export class OrderStateMachine {
  private readonly transitions: Record<string, string[]> = {
    ENVIADO: ['EM_PREPARO', 'CANCELADO'],
    EM_PREPARO: ['PRONTO', 'CANCELADO'],
    PRONTO: ['ENTREGUE', 'CANCELADO'],
    ENTREGUE: [],
    CANCELADO: [],
    PENDING: ['PREPARING', 'CANCELLED', 'EM_PREPARO', 'CANCELADO'],
    PREPARING: ['READY', 'CANCELLED', 'PRONTO', 'CANCELADO'],
    READY: ['DELIVERED', 'CANCELLED', 'ENTREGUE', 'CANCELADO'],
    DELIVERED: [],
    CANCELLED: [],
  }

  /**
   * Retorna os estados permitidos a partir do status atual
   */
  getAllowedTransitions(currentStatus: OrderStatus): string[] {
    return this.transitions[currentStatus] || []
  }

  /**
   * Verifica se a transição entre dois estados é permitida
   */
  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTargets = this.getAllowedTransitions(from)
    return validTargets.includes(to)
  }

  /**
   * Executa a transição de estado da ordem respeitando a máquina de estados e RBAC de cancelamento
   */
  async transition(
    order: Order,
    newStatus: OrderStatus,
    userContext?: StaffContext | null,
    options?: TransitionOptions
  ): Promise<Order> {
    if (!this.canTransition(order.status, newStatus)) {
      throw new InvalidStateTransitionException(
        `Transição inválida de status: impossível mover pedido #${order.id} de '${order.status}' para '${newStatus}'.`,
        { status: 422 }
      )
    }

    // Cancelamento exige permissão restrita de Staff (ADMIN, GERENTE, GARCOM)
    if (newStatus === 'CANCELADO' || newStatus === 'CANCELLED') {
      const role = userContext?.role?.toUpperCase()
      if (!role || !ALLOWED_STAFF_CANCELLATION_ROLES.includes(role)) {
        throw new ForbiddenException(
          'Apenas membros da equipe com perfil ADMIN, GERENTE ou GARCOM podem cancelar pedidos.',
          { status: 403 }
        )
      }

      order.cancellationReason = options?.reason || null
      order.cancelledByUserId = userContext?.id || null
    }

    order.status = newStatus
    await order.save()

    return order
  }
}

export default OrderStateMachine
