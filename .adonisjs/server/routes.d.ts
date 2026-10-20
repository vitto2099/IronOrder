import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.catalog.index': { paramsTuple?: []; params?: {} }
    'admin.catalog.categories.store': { paramsTuple?: []; params?: {} }
    'admin.catalog.categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.catalog.products.store': { paramsTuple?: []; params?: {} }
    'admin.catalog.products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.catalog.products.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.catalog.products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.tables.index': { paramsTuple?: []; params?: {} }
    'admin.tables.store': { paramsTuple?: []; params?: {} }
    'admin.tables.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.tables.print': { paramsTuple?: []; params?: {} }
    'admin.staff.index': { paramsTuple?: []; params?: {} }
    'admin.staff.store': { paramsTuple?: []; params?: {} }
    'admin.staff.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.staff.password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.welcome': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.join': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.menu.index': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.order.store': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.tab.statement': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.statement': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.tab.requestBill': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'staff.kds.index': { paramsTuple?: []; params?: {} }
    'staff.kds.updateStatus': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.tables.index': { paramsTuple?: []; params?: {} }
    'staff.tables.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.tables.manualOrder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.tables.deliver': { paramsTuple: [ParamValue]; params: {'orderId': ParamValue} }
    'staff.tables.cancel': { paramsTuple: [ParamValue]; params: {'orderId': ParamValue} }
    'staff.tables.payMember': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'staff.tables.payAllAndRelease': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.tables.release': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.hub.redirect': { paramsTuple?: []; params?: {} }
    'admin.hub': { paramsTuple?: []; params?: {} }
    'manager.hub': { paramsTuple?: []; params?: {} }
    'cashier.hub': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'admin.catalog.index': { paramsTuple?: []; params?: {} }
    'admin.tables.index': { paramsTuple?: []; params?: {} }
    'admin.tables.print': { paramsTuple?: []; params?: {} }
    'admin.staff.index': { paramsTuple?: []; params?: {} }
    'client.welcome': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.menu.index': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.tab.statement': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.statement': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'staff.kds.index': { paramsTuple?: []; params?: {} }
    'staff.tables.index': { paramsTuple?: []; params?: {} }
    'staff.tables.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.hub.redirect': { paramsTuple?: []; params?: {} }
    'admin.hub': { paramsTuple?: []; params?: {} }
    'manager.hub': { paramsTuple?: []; params?: {} }
    'cashier.hub': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'admin.catalog.index': { paramsTuple?: []; params?: {} }
    'admin.tables.index': { paramsTuple?: []; params?: {} }
    'admin.tables.print': { paramsTuple?: []; params?: {} }
    'admin.staff.index': { paramsTuple?: []; params?: {} }
    'client.welcome': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.menu.index': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.tab.statement': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.statement': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'staff.kds.index': { paramsTuple?: []; params?: {} }
    'staff.tables.index': { paramsTuple?: []; params?: {} }
    'staff.tables.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.hub.redirect': { paramsTuple?: []; params?: {} }
    'admin.hub': { paramsTuple?: []; params?: {} }
    'manager.hub': { paramsTuple?: []; params?: {} }
    'cashier.hub': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.catalog.categories.store': { paramsTuple?: []; params?: {} }
    'admin.catalog.products.store': { paramsTuple?: []; params?: {} }
    'admin.tables.store': { paramsTuple?: []; params?: {} }
    'admin.staff.store': { paramsTuple?: []; params?: {} }
    'client.join': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.order.store': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'client.tab.requestBill': { paramsTuple: [ParamValue]; params: {'tableNumber': ParamValue} }
    'staff.tables.manualOrder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.tables.cancel': { paramsTuple: [ParamValue]; params: {'orderId': ParamValue} }
    'staff.tables.payMember': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'staff.tables.payAllAndRelease': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.tables.release': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'admin.catalog.categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.catalog.products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'admin.catalog.products.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.staff.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.staff.password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.kds.updateStatus': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.tables.deliver': { paramsTuple: [ParamValue]; params: {'orderId': ParamValue} }
  }
  DELETE: {
    'admin.catalog.products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.tables.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}