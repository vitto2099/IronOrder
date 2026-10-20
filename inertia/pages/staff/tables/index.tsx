import React, { useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'
import StaffLayout from '~/layouts/staff_layout'

export interface TableItem {
  id: number
  number: number
  capacity: number
  status: 'LIVRE' | 'OCUPADA' | 'CONTA_PEDIDA' | string
  hasReadyOrders: boolean
  readyOrdersCount: number
  membersCount: number
  totalAmount: number
  activeTabId: number | null
  openedAt: string | null
}

export interface SalonMetrics {
  totalTables: number
  freeTables: number
  occupiedTables: number
  billRequestedTables: number
  totalReadyDishes: number
}

interface TableGridProps {
  tables: TableItem[]
  metrics: SalonMetrics
}

interface OrderItemDetail {
  id: number
  orderId: number
  productId: number | null
  nameSnapshot: string
  unitPrice: number
  quantity: number
  notes?: string | null
  subtotal: number
}

interface OrderDetail {
  id: number
  tabId: number
  tabMemberId: number
  status: string
  createdAt: string
  memberAlias: string
  items: OrderItemDetail[]
}

interface TableDetailData {
  table: {
    id: number
    number: number
    capacity: number
    status: string
  }
  tab: {
    tabId: number
    tableNumber: number
    status: string
    total: number
    activeMembersCount?: number
    paidMembersCount?: number
    hasPendingOrders?: boolean
    members: {
      id: number
      alias: string
      status: 'OPEN' | 'BILL_REQUESTED' | 'PAID' | string
      subtotal: number
      itemsCount: number
      hasPendingOrders: boolean
      paidAt: string | null
    }[]
  } | null
  members: { id: number; alias: string }[]
  orders: OrderDetail[]
}

export default function TableGridIndex({ tables = [], metrics }: TableGridProps) {
  const [filter, setFilter] = useState<'ALL' | 'OCUPADA' | 'CONTA_PEDIDA' | 'LIVRE' | 'READY'>(
    'ALL'
  )
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [tableDetail, setTableDetail] = useState<TableDetailData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Modais
  const [manualOrderModalOpen, setManualOrderModalOpen] = useState(false)
  const [manualAlias, setManualAlias] = useState('')
  const [manualProductId, setManualProductId] = useState<number | ''>('')
  const [manualQuantity, setManualQuantity] = useState(1)
  const [manualNotes, setManualNotes] = useState('')

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Polling automático no grid a cada 5 segundos (ADR-002)
  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({
        only: ['tables', 'metrics'],
        preserveScroll: true,
        preserveState: true,
      } as any)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Carrega detalhes da mesa ao selecionar
  useEffect(() => {
    if (!selectedTableId) return
    let active = true
    fetch(`/staff/tables/${selectedTableId}`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setTableDetail(data)
          setLoadingDetail(false)
        }
      })
      .catch(() => {
        if (active) setLoadingDetail(false)
      })
    return () => {
      active = false
    }
  }, [selectedTableId])

  // Recarrega detalhes da mesa atual
  const refreshDetail = () => {
    if (!selectedTableId) return
    fetch(`/staff/tables/${selectedTableId}`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => setTableDetail(data))
  }

  // Filtragem rápida de mesas
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (filter === 'ALL') return true
      if (filter === 'READY') return t.hasReadyOrders
      return t.status === filter
    })
  }, [tables, filter])

  // Formatação de moeda BRL
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  // Ação: Baixa de entrega de prato pronto
  const handleDeliver = (orderId: number) => {
    router.patch(
      `/staff/tables/orders/${orderId}/deliver`,
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          refreshDetail()
        },
      }
    )
  }

  // Ação: Confirmação de cancelamento
  const handleConfirmCancel = () => {
    if (!cancellingOrderId) return
    router.post(
      `/staff/tables/orders/${cancellingOrderId}/cancel`,
      { reason: cancelReason },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setCancelModalOpen(false)
          setCancellingOrderId(null)
          setCancelReason('')
          refreshDetail()
        },
      }
    )
  }

  // Ação: Lançar pedido manual
  const handleSendManualOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTableId || !manualProductId) return

    router.post(
      `/staff/tables/${selectedTableId}/orders`,
      {
        alias: manualAlias.trim() || 'BALCÃO',
        items: [
          {
            productId: Number(manualProductId),
            quantity: Number(manualQuantity) || 1,
            notes: manualNotes.trim() || undefined,
          },
        ],
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setManualOrderModalOpen(false)
          setManualAlias('')
          setManualProductId('')
          setManualQuantity(1)
          setManualNotes('')
          refreshDetail()
        },
      }
    )
  }

  // Ação: Quitar comanda de membro individual (RN-MEMBER.4)
  const handlePayMember = (memberId: number, alias: string, hasPending: boolean) => {
    if (hasPending) {
      alert(
        `Atenção: O cliente ${alias} possui pedidos ainda em preparo ou a caminho na cozinha. Conclua a entrega ou cancele o pedido antes de liquidar a conta.`
      )
      return
    }

    if (
      !confirm(
        `Confirmar recebimento e liquidar a conta de ${alias}? Apenas a sessão deste cliente será encerrada.`
      )
    )
      return

    if (!selectedTableId) return

    router.post(
      `/staff/tables/${selectedTableId}/members/${memberId}/pay`,
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          refreshDetail()
        },
      }
    )
  }

  // Ação: Liquidar todos e liberar mesa em lote (RN-MEMBER.5)
  const handlePayAllAndRelease = (tableId: number) => {
    if (!confirm('Deseja liquidar todas as comandas e liberar esta mesa agora?')) return

    router.post(
      `/staff/tables/${tableId}/pay-all-and-release`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedTableId(null)
          setTableDetail(null)
        },
      }
    )
  }

  // Ação: Liberar mesa e fechar comanda
  const handleReleaseTable = (tableId: number) => {
    if (!confirm('Deseja confirmar a liquidação presencial e liberar esta mesa?')) return

    router.post(
      `/staff/tables/${tableId}/release`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedTableId(null)
          setTableDetail(null)
        },
      }
    )
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Cabeçalho da Operação do Salão */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>🍽️</span> Painel do Salão & Mesas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitore o status das mesas em tempo real, realize baixas de entrega e atenda chamados
              de conta.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronização Ao Vivo (5s)
          </div>
        </div>

        {/* Barra de Métricas do Salão */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">
              Total de Mesas
            </span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">
              {metrics?.totalTables ?? tables.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
              Livres
            </span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              {metrics?.freeTables ?? tables.filter((t) => t.status === 'LIVRE').length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/40 shadow-sm">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
              Ocupadas
            </span>
            <span className="text-2xl font-black text-blue-800 mt-1 block">
              {metrics?.occupiedTables ?? tables.filter((t) => t.status === 'OCUPADA').length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              Contas Pedidas ⚠️
            </span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">
              {metrics?.billRequestedTables ??
                tables.filter((t) => t.status === 'CONTA_PEDIDA').length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/60 shadow-sm">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
              Prontos p/ Entrega 🔔
            </span>
            <span className="text-2xl font-black text-rose-900 mt-1 block">
              {metrics?.totalReadyDishes ??
                tables.reduce((acc, t) => acc + (t.readyOrdersCount || 0), 0)}
            </span>
          </div>
        </div>

        {/* Barra de Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'ALL'
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Todas ({tables.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'READY'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            🔔 Prontos p/ Entrega ({tables.filter((t) => t.hasReadyOrders).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('CONTA_PEDIDA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'CONTA_PEDIDA'
                ? 'bg-amber-500 text-black'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
            }`}
          >
            ⚠️ Pediram Conta ({tables.filter((t) => t.status === 'CONTA_PEDIDA').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('OCUPADA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'OCUPADA'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            Ocupadas ({tables.filter((t) => t.status === 'OCUPADA').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('LIVRE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'LIVRE'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            Livres ({tables.filter((t) => t.status === 'LIVRE').length})
          </button>
        </div>

        {/* Grid Visual de Mesas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const isFree = table.status === 'LIVRE'
            const isBillRequested =
              table.status === 'CONTA_PEDIDA' || (table.status as string) === 'BILL_REQUESTED'
            const isOccupied = table.status === 'OCUPADA'

            let cardBorder = 'border-gray-200 bg-white hover:border-gray-400'
            let statusBadge = (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                LIVRE
              </span>
            )

            if (isBillRequested) {
              cardBorder =
                'border-2 border-amber-500 bg-amber-50/50 shadow-md animate-pulse hover:border-amber-600'
              statusBadge = (
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-black">
                  PEDIU CONTA ⚠️
                </span>
              )
            } else if (isOccupied) {
              cardBorder = table.hasReadyOrders
                ? 'border-2 border-rose-500 bg-rose-50/40 shadow hover:border-rose-600'
                : 'border-2 border-blue-400 bg-blue-50/30 shadow-sm hover:border-blue-500'
              statusBadge = (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  OCUPADA
                </span>
              )
            }

            return (
              <div
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`rounded-2xl p-4 cursor-pointer transition flex flex-col justify-between min-h-[160px] ${cardBorder}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-xl font-black text-gray-900 block leading-tight">
                        MESA {String(table.number).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {table.capacity} lugares
                      </span>
                    </div>
                    {statusBadge}
                  </div>

                  {/* Indicador de Pratos Prontos */}
                  {table.hasReadyOrders && (
                    <div className="mt-2.5 px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-black flex items-center justify-center gap-1 shadow-sm">
                      <span>🔔</span> {table.readyOrdersCount} pronto
                      {table.readyOrdersCount > 1 ? 's' : ''}!
                    </div>
                  )}

                  {/* Informações da Comanda */}
                  {!isFree && (
                    <div className="mt-3 text-xs space-y-1">
                      <div className="text-gray-600 flex items-center justify-between">
                        <span>Clientes:</span>
                        <strong className="text-gray-900">{table.membersCount}</strong>
                      </div>
                      <div className="text-gray-600 flex items-center justify-between">
                        <span>Consumo:</span>
                        <strong className="text-emerald-700 font-bold">
                          {formatMoney(table.totalAmount)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-gray-100/80 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  {isFree ? (
                    <span className="text-emerald-700 font-semibold">+ Abrir Mesa</span>
                  ) : (
                    <span className="text-blue-700 font-semibold">Ver Extrato →</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal / Drawer de Detalhes da Mesa */}
        {selectedTableId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Header do Drawer */}
              <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <span>
                      MESA {tableDetail ? String(tableDetail.table.number).padStart(2, '0') : ''}
                    </span>
                    {tableDetail?.table.status === 'CONTA_PEDIDA' && (
                      <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">
                        CONTA SOLICITADA ⚠️
                      </span>
                    )}
                  </h2>
                  <span className="text-xs text-gray-400">
                    Capacidade: {tableDetail?.table.capacity} lugares • Status:{' '}
                    {tableDetail?.table.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTableId(null)}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Corpo do Drawer */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingDetail ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Carregando detalhes da mesa...
                  </div>
                ) : !tableDetail ? (
                  <div className="text-sm text-gray-500">Mesa não encontrada.</div>
                ) : (
                  <>
                    {/* Resumo Financeiro da Comanda */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                          Total da Mesa
                        </span>
                        <span className="text-2xl font-black text-gray-900 mt-0.5 block">
                          {formatMoney(tableDetail.tab?.total || 0)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">Participantes</span>
                        <span className="text-sm font-bold text-gray-800">
                          {tableDetail.members.length} alias
                          {tableDetail.members.length > 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Comandas Individuais por Cliente */}
                    {tableDetail.tab?.members && tableDetail.tab.members.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Clientes na Comanda ({tableDetail.tab.members.length})
                          </h3>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {tableDetail.tab.paidMembersCount || 0} quitada(s) •{' '}
                            {tableDetail.tab.activeMembersCount || 0} ativa(s)
                          </span>
                        </div>

                        <div className="space-y-2">
                          {tableDetail.tab.members.map((m) => {
                            const isPaid = m.status === 'PAID'
                            const isBillReq = m.status === 'BILL_REQUESTED'

                            return (
                              <div
                                key={m.id}
                                className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isPaid
                                    ? 'bg-gray-50 border-gray-200 opacity-85'
                                    : isBillReq
                                      ? 'bg-amber-50/70 border-amber-300'
                                      : 'bg-white border-gray-200 shadow-xs'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-gray-900">
                                      👤 {m.alias}
                                    </span>
                                    {isPaid ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                        PAGO ✅
                                      </span>
                                    ) : isBillReq ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300 animate-pulse">
                                        CONTA PEDIDA 🔔
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        CONSUMINDO 🟢
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                                    <span>
                                      Consumo: <strong>{formatMoney(m.subtotal)}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>{m.itemsCount} item(s)</span>
                                  </div>

                                  {m.hasPendingOrders && (
                                    <div className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                                      <span>🍳</span> Possui itens em preparo na cozinha
                                    </div>
                                  )}
                                </div>

                                {!isPaid && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePayMember(m.id, m.alias, m.hasPendingOrders)
                                    }
                                    className={`px-3 py-2 text-xs font-black rounded-lg transition shadow-xs flex items-center justify-center gap-1 ${
                                      m.hasPendingOrders
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                                  >
                                    <span>💳</span> Liquidar ({formatMoney(m.subtotal)})
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Lista de Pedidos Realizados */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          Pedidos ({tableDetail.orders.length})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setManualOrderModalOpen(true)}
                          className="px-3 py-1 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
                        >
                          + Lançar Pedido
                        </button>
                      </div>

                      {tableDetail.orders.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          Nenhum pedido lançado nesta mesa ainda.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tableDetail.orders.map((ord) => {
                            const isReady = ord.status === 'PRONTO'
                            return (
                              <div
                                key={ord.id}
                                className={`p-4 rounded-xl border transition ${
                                  isReady
                                    ? 'border-rose-400 bg-rose-50/50 shadow-sm'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                                  <div className="text-xs">
                                    <span className="font-bold text-gray-800">
                                      Pedido #{ord.id}
                                    </span>{' '}
                                    • <span className="text-gray-500">{ord.memberAlias}</span>
                                  </div>
                                  <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                      ord.status === 'PRONTO'
                                        ? 'bg-rose-600 text-white'
                                        : ord.status === 'EM_PREPARO'
                                          ? 'bg-blue-100 text-blue-800'
                                          : ord.status === 'ENTREGUE'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : ord.status === 'CANCELADO'
                                              ? 'bg-gray-200 text-gray-600 line-through'
                                              : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {ord.status}
                                  </span>
                                </div>

                                {/* Itens do pedido */}
                                <div className="space-y-1 text-sm">
                                  {ord.items.map((i) => (
                                    <div key={i.id} className="flex items-center justify-between">
                                      <span>
                                        <strong className="text-black font-extrabold">
                                          {i.quantity}x
                                        </strong>{' '}
                                        {i.nameSnapshot}
                                        {i.notes && (
                                          <span className="block text-xs text-amber-700 italic">
                                            ⚠️ {i.notes}
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-xs font-semibold text-gray-600">
                                        {formatMoney(i.subtotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Botões de Ação do Garçom */}
                                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                  {isReady && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeliver(ord.id)}
                                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow transition"
                                    >
                                      Entregue na Mesa ✅
                                    </button>
                                  )}

                                  {ord.status !== 'ENTREGUE' && ord.status !== 'CANCELADO' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancellingOrderId(ord.id)
                                        setCancelModalOpen(true)
                                      }}
                                      className="py-1.5 px-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md font-semibold transition"
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Rodapé de Ações da Mesa */}
              {tableDetail && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setManualOrderModalOpen(true)}
                    className="w-full sm:flex-1 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-sm font-bold rounded-xl transition"
                  >
                    + Lançar Pedido
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        tableDetail.tab &&
                        tableDetail.tab.activeMembersCount &&
                        tableDetail.tab.activeMembersCount > 0
                      ) {
                        handlePayAllAndRelease(tableDetail.table.id)
                      } else {
                        handleReleaseTable(tableDetail.table.id)
                      }
                    }}
                    disabled={Boolean(tableDetail.tab?.hasPendingOrders)}
                    className={`w-full sm:flex-1 py-3 px-4 text-white text-sm font-black rounded-xl shadow transition flex items-center justify-center gap-1.5 ${
                      tableDetail.tab?.hasPendingOrders
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    title={
                      tableDetail.tab?.hasPendingOrders
                        ? 'Há pedidos em preparo ou a caminho na cozinha'
                        : 'Confirmar liquidação e liberar mesa'
                    }
                  >
                    Liberar Mesa & Fechar 🏁
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Lançamento Manual de Pedido */}
        {manualOrderModalOpen && selectedTableId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900">
                  Lançar Pedido • Mesa {tableDetail?.table.number}
                </h3>
                <button
                  type="button"
                  onClick={() => setManualOrderModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendManualOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cliente / Alias:
                  </label>
                  <input
                    type="text"
                    value={manualAlias}
                    onChange={(e) => setManualAlias(e.target.value)}
                    placeholder="Ex: BALCÃO, JOÃO ou mesa inteira"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código / ID do Produto:
                  </label>
                  <input
                    type="number"
                    required
                    value={manualProductId}
                    onChange={(e) =>
                      setManualProductId(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="Ex: 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Quantidade:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Observações:
                    </label>
                    <input
                      type="text"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Ex: Sem gelo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setManualOrderModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition"
                  >
                    Confirmar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Cancelamento */}
        {cancelModalOpen && cancellingOrderId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-gray-900">
                Cancelar Pedido #{cancellingOrderId}
              </h3>
              <p className="text-xs text-gray-500">
                Por favor, informe a justificativa do cancelamento (obrigatório para auditoria de
                staff):
              </p>

              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Cliente desistiu ou item indisponível na cozinha..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-hidden"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-5 py-2 text-sm bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  )
}
