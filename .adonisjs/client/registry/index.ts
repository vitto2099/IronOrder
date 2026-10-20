/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'admin.catalog.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/catalog',
    tokens: [{"old":"/admin/catalog","type":0,"val":"admin","end":""},{"old":"/admin/catalog","type":0,"val":"catalog","end":""}],
    types: placeholder as Registry['admin.catalog.index']['types'],
  },
  'admin.catalog.categories.store': {
    methods: ["POST"],
    pattern: '/admin/catalog/categories',
    tokens: [{"old":"/admin/catalog/categories","type":0,"val":"admin","end":""},{"old":"/admin/catalog/categories","type":0,"val":"catalog","end":""},{"old":"/admin/catalog/categories","type":0,"val":"categories","end":""}],
    types: placeholder as Registry['admin.catalog.categories.store']['types'],
  },
  'admin.catalog.categories.update': {
    methods: ["PUT"],
    pattern: '/admin/catalog/categories/:id',
    tokens: [{"old":"/admin/catalog/categories/:id","type":0,"val":"admin","end":""},{"old":"/admin/catalog/categories/:id","type":0,"val":"catalog","end":""},{"old":"/admin/catalog/categories/:id","type":0,"val":"categories","end":""},{"old":"/admin/catalog/categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.catalog.categories.update']['types'],
  },
  'admin.catalog.products.store': {
    methods: ["POST"],
    pattern: '/admin/catalog/products',
    tokens: [{"old":"/admin/catalog/products","type":0,"val":"admin","end":""},{"old":"/admin/catalog/products","type":0,"val":"catalog","end":""},{"old":"/admin/catalog/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['admin.catalog.products.store']['types'],
  },
  'admin.catalog.products.update': {
    methods: ["PUT"],
    pattern: '/admin/catalog/products/:id',
    tokens: [{"old":"/admin/catalog/products/:id","type":0,"val":"admin","end":""},{"old":"/admin/catalog/products/:id","type":0,"val":"catalog","end":""},{"old":"/admin/catalog/products/:id","type":0,"val":"products","end":""},{"old":"/admin/catalog/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.catalog.products.update']['types'],
  },
  'admin.catalog.products.toggle': {
    methods: ["PATCH"],
    pattern: '/admin/catalog/products/:id/availability',
    tokens: [{"old":"/admin/catalog/products/:id/availability","type":0,"val":"admin","end":""},{"old":"/admin/catalog/products/:id/availability","type":0,"val":"catalog","end":""},{"old":"/admin/catalog/products/:id/availability","type":0,"val":"products","end":""},{"old":"/admin/catalog/products/:id/availability","type":1,"val":"id","end":""},{"old":"/admin/catalog/products/:id/availability","type":0,"val":"availability","end":""}],
    types: placeholder as Registry['admin.catalog.products.toggle']['types'],
  },
  'admin.catalog.products.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/catalog/products/:id',
    tokens: [{"old":"/admin/catalog/products/:id","type":0,"val":"admin","end":""},{"old":"/admin/catalog/products/:id","type":0,"val":"catalog","end":""},{"old":"/admin/catalog/products/:id","type":0,"val":"products","end":""},{"old":"/admin/catalog/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.catalog.products.destroy']['types'],
  },
  'admin.tables.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/tables',
    tokens: [{"old":"/admin/tables","type":0,"val":"admin","end":""},{"old":"/admin/tables","type":0,"val":"tables","end":""}],
    types: placeholder as Registry['admin.tables.index']['types'],
  },
  'admin.tables.store': {
    methods: ["POST"],
    pattern: '/admin/tables',
    tokens: [{"old":"/admin/tables","type":0,"val":"admin","end":""},{"old":"/admin/tables","type":0,"val":"tables","end":""}],
    types: placeholder as Registry['admin.tables.store']['types'],
  },
  'admin.tables.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/tables/:id',
    tokens: [{"old":"/admin/tables/:id","type":0,"val":"admin","end":""},{"old":"/admin/tables/:id","type":0,"val":"tables","end":""},{"old":"/admin/tables/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.tables.destroy']['types'],
  },
  'admin.tables.print': {
    methods: ["GET","HEAD"],
    pattern: '/admin/tables/print',
    tokens: [{"old":"/admin/tables/print","type":0,"val":"admin","end":""},{"old":"/admin/tables/print","type":0,"val":"tables","end":""},{"old":"/admin/tables/print","type":0,"val":"print","end":""}],
    types: placeholder as Registry['admin.tables.print']['types'],
  },
  'admin.staff.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/staff',
    tokens: [{"old":"/admin/staff","type":0,"val":"admin","end":""},{"old":"/admin/staff","type":0,"val":"staff","end":""}],
    types: placeholder as Registry['admin.staff.index']['types'],
  },
  'admin.staff.store': {
    methods: ["POST"],
    pattern: '/admin/staff',
    tokens: [{"old":"/admin/staff","type":0,"val":"admin","end":""},{"old":"/admin/staff","type":0,"val":"staff","end":""}],
    types: placeholder as Registry['admin.staff.store']['types'],
  },
  'admin.staff.status': {
    methods: ["PATCH"],
    pattern: '/admin/staff/:id/status',
    tokens: [{"old":"/admin/staff/:id/status","type":0,"val":"admin","end":""},{"old":"/admin/staff/:id/status","type":0,"val":"staff","end":""},{"old":"/admin/staff/:id/status","type":1,"val":"id","end":""},{"old":"/admin/staff/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['admin.staff.status']['types'],
  },
  'admin.staff.password': {
    methods: ["PATCH"],
    pattern: '/admin/staff/:id/reset-password',
    tokens: [{"old":"/admin/staff/:id/reset-password","type":0,"val":"admin","end":""},{"old":"/admin/staff/:id/reset-password","type":0,"val":"staff","end":""},{"old":"/admin/staff/:id/reset-password","type":1,"val":"id","end":""},{"old":"/admin/staff/:id/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['admin.staff.password']['types'],
  },
  'client.welcome': {
    methods: ["GET","HEAD"],
    pattern: '/m/:tableNumber',
    tokens: [{"old":"/m/:tableNumber","type":0,"val":"m","end":""},{"old":"/m/:tableNumber","type":1,"val":"tableNumber","end":""}],
    types: placeholder as Registry['client.welcome']['types'],
  },
  'client.join': {
    methods: ["POST"],
    pattern: '/m/:tableNumber/join',
    tokens: [{"old":"/m/:tableNumber/join","type":0,"val":"m","end":""},{"old":"/m/:tableNumber/join","type":1,"val":"tableNumber","end":""},{"old":"/m/:tableNumber/join","type":0,"val":"join","end":""}],
    types: placeholder as Registry['client.join']['types'],
  },
  'client.menu.index': {
    methods: ["GET","HEAD"],
    pattern: '/m/:tableNumber/menu',
    tokens: [{"old":"/m/:tableNumber/menu","type":0,"val":"m","end":""},{"old":"/m/:tableNumber/menu","type":1,"val":"tableNumber","end":""},{"old":"/m/:tableNumber/menu","type":0,"val":"menu","end":""}],
    types: placeholder as Registry['client.menu.index']['types'],
  },
  'client.order.store': {
    methods: ["POST"],
    pattern: '/m/:tableNumber/orders',
    tokens: [{"old":"/m/:tableNumber/orders","type":0,"val":"m","end":""},{"old":"/m/:tableNumber/orders","type":1,"val":"tableNumber","end":""},{"old":"/m/:tableNumber/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['client.order.store']['types'],
  },
  'client.tab.statement': {
    methods: ["GET","HEAD"],
    pattern: '/m/:tableNumber/tab',
    tokens: [{"old":"/m/:tableNumber/tab","type":0,"val":"m","end":""},{"old":"/m/:tableNumber/tab","type":1,"val":"tableNumber","end":""},{"old":"/m/:tableNumber/tab","type":0,"val":"tab","end":""}],
    types: placeholder as Registry['client.tab.statement']['types'],
  },
  'client.statement': {
    methods: ["GET","HEAD"],
    pattern: '/m/:tableNumber/statement',
    tokens: [{"old":"/m/:tableNumber/statement","type":0,"val":"m","end":""},{"old":"/m/:tableNumber/statement","type":1,"val":"tableNumber","end":""},{"old":"/m/:tableNumber/statement","type":0,"val":"statement","end":""}],
    types: placeholder as Registry['client.statement']['types'],
  },
  'client.tab.requestBill': {
    methods: ["POST"],
    pattern: '/m/:tableNumber/request-bill',
    tokens: [{"old":"/m/:tableNumber/request-bill","type":0,"val":"m","end":""},{"old":"/m/:tableNumber/request-bill","type":1,"val":"tableNumber","end":""},{"old":"/m/:tableNumber/request-bill","type":0,"val":"request-bill","end":""}],
    types: placeholder as Registry['client.tab.requestBill']['types'],
  },
  'staff.kds.index': {
    methods: ["GET","HEAD"],
    pattern: '/kds',
    tokens: [{"old":"/kds","type":0,"val":"kds","end":""}],
    types: placeholder as Registry['staff.kds.index']['types'],
  },
  'staff.kds.updateStatus': {
    methods: ["PATCH"],
    pattern: '/kds/orders/:id/status',
    tokens: [{"old":"/kds/orders/:id/status","type":0,"val":"kds","end":""},{"old":"/kds/orders/:id/status","type":0,"val":"orders","end":""},{"old":"/kds/orders/:id/status","type":1,"val":"id","end":""},{"old":"/kds/orders/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['staff.kds.updateStatus']['types'],
  },
  'staff.tables.index': {
    methods: ["GET","HEAD"],
    pattern: '/staff/tables',
    tokens: [{"old":"/staff/tables","type":0,"val":"staff","end":""},{"old":"/staff/tables","type":0,"val":"tables","end":""}],
    types: placeholder as Registry['staff.tables.index']['types'],
  },
  'staff.tables.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/tables/:id',
    tokens: [{"old":"/staff/tables/:id","type":0,"val":"staff","end":""},{"old":"/staff/tables/:id","type":0,"val":"tables","end":""},{"old":"/staff/tables/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['staff.tables.show']['types'],
  },
  'staff.tables.manualOrder': {
    methods: ["POST"],
    pattern: '/staff/tables/:id/orders',
    tokens: [{"old":"/staff/tables/:id/orders","type":0,"val":"staff","end":""},{"old":"/staff/tables/:id/orders","type":0,"val":"tables","end":""},{"old":"/staff/tables/:id/orders","type":1,"val":"id","end":""},{"old":"/staff/tables/:id/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['staff.tables.manualOrder']['types'],
  },
  'staff.tables.deliver': {
    methods: ["PATCH"],
    pattern: '/staff/tables/orders/:orderId/deliver',
    tokens: [{"old":"/staff/tables/orders/:orderId/deliver","type":0,"val":"staff","end":""},{"old":"/staff/tables/orders/:orderId/deliver","type":0,"val":"tables","end":""},{"old":"/staff/tables/orders/:orderId/deliver","type":0,"val":"orders","end":""},{"old":"/staff/tables/orders/:orderId/deliver","type":1,"val":"orderId","end":""},{"old":"/staff/tables/orders/:orderId/deliver","type":0,"val":"deliver","end":""}],
    types: placeholder as Registry['staff.tables.deliver']['types'],
  },
  'staff.tables.cancel': {
    methods: ["POST"],
    pattern: '/staff/tables/orders/:orderId/cancel',
    tokens: [{"old":"/staff/tables/orders/:orderId/cancel","type":0,"val":"staff","end":""},{"old":"/staff/tables/orders/:orderId/cancel","type":0,"val":"tables","end":""},{"old":"/staff/tables/orders/:orderId/cancel","type":0,"val":"orders","end":""},{"old":"/staff/tables/orders/:orderId/cancel","type":1,"val":"orderId","end":""},{"old":"/staff/tables/orders/:orderId/cancel","type":0,"val":"cancel","end":""}],
    types: placeholder as Registry['staff.tables.cancel']['types'],
  },
  'staff.tables.payMember': {
    methods: ["POST"],
    pattern: '/staff/tables/:id/members/:memberId/pay',
    tokens: [{"old":"/staff/tables/:id/members/:memberId/pay","type":0,"val":"staff","end":""},{"old":"/staff/tables/:id/members/:memberId/pay","type":0,"val":"tables","end":""},{"old":"/staff/tables/:id/members/:memberId/pay","type":1,"val":"id","end":""},{"old":"/staff/tables/:id/members/:memberId/pay","type":0,"val":"members","end":""},{"old":"/staff/tables/:id/members/:memberId/pay","type":1,"val":"memberId","end":""},{"old":"/staff/tables/:id/members/:memberId/pay","type":0,"val":"pay","end":""}],
    types: placeholder as Registry['staff.tables.payMember']['types'],
  },
  'staff.tables.payAllAndRelease': {
    methods: ["POST"],
    pattern: '/staff/tables/:id/pay-all-and-release',
    tokens: [{"old":"/staff/tables/:id/pay-all-and-release","type":0,"val":"staff","end":""},{"old":"/staff/tables/:id/pay-all-and-release","type":0,"val":"tables","end":""},{"old":"/staff/tables/:id/pay-all-and-release","type":1,"val":"id","end":""},{"old":"/staff/tables/:id/pay-all-and-release","type":0,"val":"pay-all-and-release","end":""}],
    types: placeholder as Registry['staff.tables.payAllAndRelease']['types'],
  },
  'staff.tables.release': {
    methods: ["POST"],
    pattern: '/staff/tables/:id/release',
    tokens: [{"old":"/staff/tables/:id/release","type":0,"val":"staff","end":""},{"old":"/staff/tables/:id/release","type":0,"val":"tables","end":""},{"old":"/staff/tables/:id/release","type":1,"val":"id","end":""},{"old":"/staff/tables/:id/release","type":0,"val":"release","end":""}],
    types: placeholder as Registry['staff.tables.release']['types'],
  },
  'staff.hub.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/hub',
    tokens: [{"old":"/hub","type":0,"val":"hub","end":""}],
    types: placeholder as Registry['staff.hub.redirect']['types'],
  },
  'admin.hub': {
    methods: ["GET","HEAD"],
    pattern: '/admin/hub',
    tokens: [{"old":"/admin/hub","type":0,"val":"admin","end":""},{"old":"/admin/hub","type":0,"val":"hub","end":""}],
    types: placeholder as Registry['admin.hub']['types'],
  },
  'manager.hub': {
    methods: ["GET","HEAD"],
    pattern: '/manager/hub',
    tokens: [{"old":"/manager/hub","type":0,"val":"manager","end":""},{"old":"/manager/hub","type":0,"val":"hub","end":""}],
    types: placeholder as Registry['manager.hub']['types'],
  },
  'cashier.hub': {
    methods: ["GET","HEAD"],
    pattern: '/cashier/hub',
    tokens: [{"old":"/cashier/hub","type":0,"val":"cashier","end":""},{"old":"/cashier/hub","type":0,"val":"hub","end":""}],
    types: placeholder as Registry['cashier.hub']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
