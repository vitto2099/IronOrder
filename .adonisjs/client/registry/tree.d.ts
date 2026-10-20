/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  admin: {
    catalog: {
      index: typeof routes['admin.catalog.index']
      categories: {
        store: typeof routes['admin.catalog.categories.store']
        update: typeof routes['admin.catalog.categories.update']
      }
      products: {
        store: typeof routes['admin.catalog.products.store']
        update: typeof routes['admin.catalog.products.update']
        toggle: typeof routes['admin.catalog.products.toggle']
        destroy: typeof routes['admin.catalog.products.destroy']
      }
    }
    tables: {
      index: typeof routes['admin.tables.index']
      store: typeof routes['admin.tables.store']
      destroy: typeof routes['admin.tables.destroy']
      print: typeof routes['admin.tables.print']
    }
    staff: {
      index: typeof routes['admin.staff.index']
      store: typeof routes['admin.staff.store']
      status: typeof routes['admin.staff.status']
      password: typeof routes['admin.staff.password']
    }
    hub: typeof routes['admin.hub']
  }
  client: {
    welcome: typeof routes['client.welcome']
    join: typeof routes['client.join']
    menu: {
      index: typeof routes['client.menu.index']
    }
    order: {
      store: typeof routes['client.order.store']
    }
    tab: {
      statement: typeof routes['client.tab.statement']
      requestBill: typeof routes['client.tab.requestBill']
    }
    statement: typeof routes['client.statement']
  }
  staff: {
    kds: {
      index: typeof routes['staff.kds.index']
      updateStatus: typeof routes['staff.kds.updateStatus']
    }
    tables: {
      index: typeof routes['staff.tables.index']
      show: typeof routes['staff.tables.show']
      manualOrder: typeof routes['staff.tables.manualOrder']
      deliver: typeof routes['staff.tables.deliver']
      cancel: typeof routes['staff.tables.cancel']
      payMember: typeof routes['staff.tables.payMember']
      payAllAndRelease: typeof routes['staff.tables.payAllAndRelease']
      release: typeof routes['staff.tables.release']
    }
    hub: {
      redirect: typeof routes['staff.hub.redirect']
    }
  }
  manager: {
    hub: typeof routes['manager.hub']
  }
  cashier: {
    hub: typeof routes['cashier.hub']
  }
}
