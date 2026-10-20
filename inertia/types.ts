import { type Data } from '@generated/data'
import { type PropsWithChildren } from 'react'
import { type JSONDataTypes } from '@adonisjs/core/types/transformers'

export type InertiaProps<T extends JSONDataTypes = {}> = PropsWithChildren<Data.SharedProps & T>

/**
 * Bridges the server side types into the Inertia client. "usePage().props" is
 * typed from the Inertia middleware share method and "usePage().flash" from
 * its flash method.
 */
declare module '@inertiajs/core' {
  interface InertiaConfig {
    sharedPageProps: Data.SharedProps
    flashDataType: Data.FlashMessages
  }
}

export interface Category {
  id: number
  name: string
  slug: string
  emoji?: string | null
  sortOrder: number
  isActive: boolean
  products?: Product[]
}

export interface Product {
  id: number
  categoryId: number
  name: string
  slug?: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  tags?: string[] | null
}

export type TableStatus = 'LIVRE' | 'OCUPADA' | 'CONTA_PEDIDA'
export type TabStatus = 'ABERTA' | 'FECHADA'

export interface Table {
  id: number
  number: number
  capacity: number
  status: TableStatus
}

export interface TabMemberSummary {
  id: number
  alias: string
  subtotal: number
  itemsCount: number
}

export interface TabSummary {
  tabId: number
  tableNumber: number
  status: TabStatus
  total: number
  members: TabMemberSummary[]
}

export type OrderStatus =
  | 'ENVIADO'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'

export interface OrderItem {
  id: number
  orderId: number
  productId: number | null
  nameSnapshot: string
  unitPrice: number
  quantity: number
  notes?: string | null
  subtotal: number
}

export interface Order {
  id: number
  tabId: number
  tabMemberId: number
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
  memberName?: string
  cancellationReason?: string | null
  cancelledByUserId?: number | null
}

export type UserRole = 'ADMIN' | 'GERENTE' | 'GARCOM' | 'CAIXA' | 'COZINHA'

export interface TableWithQr extends Table {
  url: string
  qrCodeDataUrl: string
}

export interface StaffMember {
  id: number
  fullName: string | null
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
}
