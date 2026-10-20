import type { HttpContext } from '@adonisjs/core/http'
import Table from '#models/table'
import Order from '#models/order'
import Tab from '#models/tab'
import User from '#models/user'
import { RoleNavigationService } from '#services/role_navigation_service'

export default class HubController {
  /**
   * Resolvedor universal de Hub
   */
  async redirect({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.redirect(RoleNavigationService.getHomeRoute(user.role))
  }

  /**
   * Hub do Administrador Geral
   */
  async adminHub({ inertia }: HttpContext) {
    const [tables, pendingOrders, staffMembers, openTabs] = await Promise.all([
      Table.all(),
      Order.query().whereIn('status', [
        'ENVIADO',
        'EM_PREPARO',
        'PENDENTE',
        'PENDING',
        'PREPARING',
      ]),
      User.query().where('isActive', true),
      Tab.query().whereIn('status', ['ABERTA', 'OPEN', 'BILL_REQUESTED']),
    ])

    const totalTables = tables.length
    const occupiedTables = tables.filter((t) => t.status !== 'LIVRE').length
    const freeTables = tables.filter((t) => t.status === 'LIVRE').length

    return (inertia as any).render('admin/hub', {
      stats: {
        totalTables,
        occupiedTables,
        freeTables,
        pendingOrdersCount: pendingOrders.length,
        activeStaffCount: staffMembers.length,
        openTabsCount: openTabs.length,
      },
    })
  }

  /**
   * Hub do Gerente
   */
  async managerHub({ inertia }: HttpContext) {
    const [tables, pendingOrders, openTabs] = await Promise.all([
      Table.all(),
      Order.query().whereIn('status', [
        'ENVIADO',
        'EM_PREPARO',
        'PENDENTE',
        'PENDING',
        'PREPARING',
      ]),
      Tab.query().whereIn('status', ['ABERTA', 'OPEN', 'BILL_REQUESTED']),
    ])

    return (inertia as any).render('manager/hub', {
      stats: {
        totalTables: tables.length,
        occupiedTables: tables.filter((t) => t.status !== 'LIVRE').length,
        freeTables: tables.filter((t) => t.status === 'LIVRE').length,
        pendingOrdersCount: pendingOrders.length,
        openTabsCount: openTabs.length,
      },
    })
  }

  /**
   * Hub / Painel do Caixa
   */
  async cashierHub({ inertia }: HttpContext) {
    const tabsAwaitingPayment = await Tab.query()
      .whereIn('status', ['ABERTA', 'OPEN', 'BILL_REQUESTED'])
      .preload('table')
      .preload('members')
      .preload('orders', (orderQuery) => {
        orderQuery.whereNotIn('status', ['CANCELADO', 'CANCELLED']).preload('items')
      })
      .orderBy('openedAt', 'asc')

    return (inertia as any).render('cashier/hub', {
      tabs: tabsAwaitingPayment,
    })
  }
}
