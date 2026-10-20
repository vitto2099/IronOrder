/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router
  .get('/', async ({ auth, response, inertia }) => {
    if (await auth.check()) {
      const { RoleNavigationService } = await import('#services/role_navigation_service')
      return response.redirect(RoleNavigationService.getHomeRoute(auth.user!.role))
    }
    return inertia.render('home', {})
  })
  .as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

const CatalogAdminController = () => import('#controllers/admin/catalog_admin_controller')

router
  .group(() => {
    router.get('/catalog', [CatalogAdminController, 'index']).as('admin.catalog.index')
    router
      .post('/catalog/categories', [CatalogAdminController, 'storeCategory'])
      .as('admin.catalog.categories.store')
    router
      .put('/catalog/categories/:id', [CatalogAdminController, 'updateCategory'])
      .as('admin.catalog.categories.update')
    router
      .post('/catalog/products', [CatalogAdminController, 'storeProduct'])
      .as('admin.catalog.products.store')
    router
      .put('/catalog/products/:id', [CatalogAdminController, 'updateProduct'])
      .as('admin.catalog.products.update')
    router
      .patch('/catalog/products/:id/availability', [CatalogAdminController, 'toggleAvailability'])
      .as('admin.catalog.products.toggle')
    router
      .delete('/catalog/products/:id', [CatalogAdminController, 'destroyProduct'])
      .as('admin.catalog.products.destroy')
  })
  .prefix('/admin')
  .use(middleware.auth())
  .use(middleware.role(['ADMIN', 'GERENTE']))

const TablesAdminController = () => import('#controllers/admin/tables_admin_controller')
const StaffAdminController = () => import('#controllers/admin/staff_admin_controller')

router
  .group(() => {
    // Gestão de Mesas
    router.get('/tables', [TablesAdminController, 'index']).as('admin.tables.index')
    router.post('/tables', [TablesAdminController, 'store']).as('admin.tables.store')
    router.delete('/tables/:id', [TablesAdminController, 'destroy']).as('admin.tables.destroy')
    router.get('/tables/print', [TablesAdminController, 'printLabels']).as('admin.tables.print')

    // Gestão de Staff (Colaboradores)
    router.get('/staff', [StaffAdminController, 'index']).as('admin.staff.index')
    router.post('/staff', [StaffAdminController, 'store']).as('admin.staff.store')
    router
      .patch('/staff/:id/status', [StaffAdminController, 'toggleStatus'])
      .as('admin.staff.status')
    router
      .patch('/staff/:id/reset-password', [StaffAdminController, 'resetPassword'])
      .as('admin.staff.password')
  })
  .prefix('/admin')
  .use(middleware.auth())
  .use(middleware.role(['ADMIN']))

const ClientSessionController = () => import('#controllers/client/session_controller')
const ClientTabController = () => import('#controllers/client/tab_controller')
const ClientMenuController = () => import('#controllers/client/menu_controller')
const ClientOrderController = () => import('#controllers/client/order_controller')

router.get('/m/:tableNumber', [ClientSessionController, 'welcome']).as('client.welcome')
router.post('/m/:tableNumber/join', [ClientSessionController, 'join']).as('client.join')

router
  .group(() => {
    router.get('/m/:tableNumber/menu', [ClientMenuController, 'index']).as('client.menu.index')
    router.post('/m/:tableNumber/orders', [ClientOrderController, 'store']).as('client.order.store')
    router.get('/m/:tableNumber/tab', [ClientTabController, 'statement']).as('client.tab.statement')
    router
      .get('/m/:tableNumber/statement', [ClientTabController, 'statement'])
      .as('client.statement')
    router
      .post('/m/:tableNumber/request-bill', [ClientTabController, 'requestBill'])
      .as('client.tab.requestBill')
  })
  .use(middleware.clientSession())

const KdsController = () => import('#controllers/staff/kds_controller')

router
  .group(() => {
    router.get('/kds', [KdsController, 'index']).as('staff.kds.index')
    router
      .patch('/kds/orders/:id/status', [KdsController, 'updateStatus'])
      .as('staff.kds.updateStatus')
  })
  .use([middleware.auth(), middleware.role(['COZINHA', 'GERENTE', 'ADMIN'])])

const TableGridController = () => import('#controllers/staff/table_grid_controller')

router
  .group(() => {
    router.get('/tables', [TableGridController, 'index']).as('staff.tables.index')
    router.get('/tables/:id', [TableGridController, 'show']).as('staff.tables.show')
    router
      .post('/tables/:id/orders', [TableGridController, 'manualOrder'])
      .as('staff.tables.manualOrder')
    router
      .patch('/tables/orders/:orderId/deliver', [TableGridController, 'markDelivered'])
      .as('staff.tables.deliver')
    router
      .post('/tables/orders/:orderId/cancel', [TableGridController, 'cancelOrder'])
      .as('staff.tables.cancel')
    router
      .post('/tables/:id/members/:memberId/pay', [TableGridController, 'payMember'])
      .as('staff.tables.payMember')
    router
      .post('/tables/:id/pay-all-and-release', [TableGridController, 'payAllAndRelease'])
      .as('staff.tables.payAllAndRelease')
    router.post('/tables/:id/release', [TableGridController, 'release']).as('staff.tables.release')
  })
  .prefix('/staff')
  .use([middleware.auth(), middleware.role(['GARCOM', 'GERENTE', 'ADMIN'])])

const HubController = () => import('#controllers/staff/hub_controller')

// Resolvedor universal de Hub
router.get('/hub', [HubController, 'redirect']).use(middleware.auth()).as('staff.hub.redirect')

// Hubs específicos protegidos por RBAC
router
  .group(() => {
    router.get('/hub', [HubController, 'adminHub']).as('admin.hub')
  })
  .prefix('/admin')
  .use([middleware.auth(), middleware.role(['ADMIN'])])

router
  .group(() => {
    router.get('/hub', [HubController, 'managerHub']).as('manager.hub')
  })
  .prefix('/manager')
  .use([middleware.auth(), middleware.role(['GERENTE', 'ADMIN'])])

router
  .group(() => {
    router.get('/hub', [HubController, 'cashierHub']).as('cashier.hub')
  })
  .prefix('/cashier')
  .use([middleware.auth(), middleware.role(['CAIXA', 'GERENTE', 'ADMIN'])])

// Alias /staff/kds direcionando para o KDS
router.get('/staff/kds', ({ response }) => response.redirect('/kds'))
