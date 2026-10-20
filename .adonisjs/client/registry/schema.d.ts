/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'new_account.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
    }
  }
  'new_account.store': {
    methods: ["POST"]
    pattern: '/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'admin.catalog.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/catalog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['index']>>>
    }
  }
  'admin.catalog.categories.store': {
    methods: ["POST"]
    pattern: '/admin/catalog/categories'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/category_validator').upsertCategoryValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/category_validator').upsertCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['storeCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['storeCategory']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalog.categories.update': {
    methods: ["PUT"]
    pattern: '/admin/catalog/categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/category_validator').upsertCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/category_validator').upsertCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['updateCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['updateCategory']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalog.products.store': {
    methods: ["POST"]
    pattern: '/admin/catalog/products'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_validator').upsertProductValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/product_validator').upsertProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['storeProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['storeProduct']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalog.products.update': {
    methods: ["PUT"]
    pattern: '/admin/catalog/products/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_validator').upsertProductValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/product_validator').upsertProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['updateProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['updateProduct']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalog.products.toggle': {
    methods: ["PATCH"]
    pattern: '/admin/catalog/products/:id/availability'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_validator').updateAvailabilityValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/product_validator').updateAvailabilityValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['toggleAvailability']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['toggleAvailability']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalog.products.destroy': {
    methods: ["DELETE"]
    pattern: '/admin/catalog/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['destroyProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalog_admin_controller').default['destroyProduct']>>>
    }
  }
  'admin.tables.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/tables'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['index']>>>
    }
  }
  'admin.tables.store': {
    methods: ["POST"]
    pattern: '/admin/tables'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/table_validator').createTableValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/table_validator').createTableValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.tables.destroy': {
    methods: ["DELETE"]
    pattern: '/admin/tables/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['destroy']>>>
    }
  }
  'admin.tables.print': {
    methods: ["GET","HEAD"]
    pattern: '/admin/tables/print'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['printLabels']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/tables_admin_controller').default['printLabels']>>>
    }
  }
  'admin.staff.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/staff'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['index']>>>
    }
  }
  'admin.staff.store': {
    methods: ["POST"]
    pattern: '/admin/staff'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/staff_validator').createStaffValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/staff_validator').createStaffValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.staff.status': {
    methods: ["PATCH"]
    pattern: '/admin/staff/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['toggleStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['toggleStatus']>>>
    }
  }
  'admin.staff.password': {
    methods: ["PATCH"]
    pattern: '/admin/staff/:id/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/staff_validator').resetPasswordValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/staff_validator').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['resetPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/staff_admin_controller').default['resetPassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'client.welcome': {
    methods: ["GET","HEAD"]
    pattern: '/m/:tableNumber'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { tableNumber: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/session_controller').default['welcome']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/session_controller').default['welcome']>>>
    }
  }
  'client.join': {
    methods: ["POST"]
    pattern: '/m/:tableNumber/join'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/client_session').joinTableValidator)>>
      paramsTuple: [ParamValue]
      params: { tableNumber: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/client_session').joinTableValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/session_controller').default['join']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/session_controller').default['join']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'client.menu.index': {
    methods: ["GET","HEAD"]
    pattern: '/m/:tableNumber/menu'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { tableNumber: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/menu_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/menu_controller').default['index']>>>
    }
  }
  'client.order.store': {
    methods: ["POST"]
    pattern: '/m/:tableNumber/orders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_validator').batchOrderValidator)>>
      paramsTuple: [ParamValue]
      params: { tableNumber: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_validator').batchOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/order_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/order_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'client.tab.statement': {
    methods: ["GET","HEAD"]
    pattern: '/m/:tableNumber/tab'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { tableNumber: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/tab_controller').default['statement']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/tab_controller').default['statement']>>>
    }
  }
  'client.statement': {
    methods: ["GET","HEAD"]
    pattern: '/m/:tableNumber/statement'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { tableNumber: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/tab_controller').default['statement']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/tab_controller').default['statement']>>>
    }
  }
  'client.tab.requestBill': {
    methods: ["POST"]
    pattern: '/m/:tableNumber/request-bill'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { tableNumber: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/tab_controller').default['requestBill']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/tab_controller').default['requestBill']>>>
    }
  }
  'staff.kds.index': {
    methods: ["GET","HEAD"]
    pattern: '/kds'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/kds_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/kds_controller').default['index']>>>
    }
  }
  'staff.kds.updateStatus': {
    methods: ["PATCH"]
    pattern: '/kds/orders/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kds_validator').updateKdsOrderStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/kds_validator').updateKdsOrderStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/kds_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/kds_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.tables.index': {
    methods: ["GET","HEAD"]
    pattern: '/staff/tables'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['index']>>>
    }
  }
  'staff.tables.show': {
    methods: ["GET","HEAD"]
    pattern: '/staff/tables/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['show']>>>
    }
  }
  'staff.tables.manualOrder': {
    methods: ["POST"]
    pattern: '/staff/tables/:id/orders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/table_grid_validator').manualOrderValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/table_grid_validator').manualOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['manualOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['manualOrder']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.tables.deliver': {
    methods: ["PATCH"]
    pattern: '/staff/tables/orders/:orderId/deliver'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orderId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['markDelivered']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['markDelivered']>>>
    }
  }
  'staff.tables.cancel': {
    methods: ["POST"]
    pattern: '/staff/tables/orders/:orderId/cancel'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/table_grid_validator').cancelOrderValidator)>>
      paramsTuple: [ParamValue]
      params: { orderId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/table_grid_validator').cancelOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['cancelOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['cancelOrder']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.tables.payMember': {
    methods: ["POST"]
    pattern: '/staff/tables/:id/members/:memberId/pay'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; memberId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['payMember']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['payMember']>>>
    }
  }
  'staff.tables.payAllAndRelease': {
    methods: ["POST"]
    pattern: '/staff/tables/:id/pay-all-and-release'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['payAllAndRelease']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['payAllAndRelease']>>>
    }
  }
  'staff.tables.release': {
    methods: ["POST"]
    pattern: '/staff/tables/:id/release'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['release']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/table_grid_controller').default['release']>>>
    }
  }
  'staff.hub.redirect': {
    methods: ["GET","HEAD"]
    pattern: '/hub'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['redirect']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['redirect']>>>
    }
  }
  'admin.hub': {
    methods: ["GET","HEAD"]
    pattern: '/admin/hub'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['adminHub']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['adminHub']>>>
    }
  }
  'manager.hub': {
    methods: ["GET","HEAD"]
    pattern: '/manager/hub'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['managerHub']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['managerHub']>>>
    }
  }
  'cashier.hub': {
    methods: ["GET","HEAD"]
    pattern: '/cashier/hub'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['cashierHub']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/hub_controller').default['cashierHub']>>>
    }
  }
}
