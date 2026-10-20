import { useMemo, type FC } from 'react'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import StaffLayout from '~/layouts/staff_layout'

interface OrderItem {
  id: number
  productId: number | null
  nameSnapshot: string
  unitPrice: number
  quantity: number
}

interface Order {
  id: number
  status: string
  items: OrderItem[]
}

interface TabMember {
  id: number
  alias: string
}

interface Table {
  id: number
  number: number
  status: string
  capacity: number
}

interface TabItem {
  id: number
  tableId: number
  status: string
  openedAt: string
  table?: Table
  members?: TabMember[]
  orders?: Order[]
}

interface CashierHubProps {
  tabs: TabItem[] | any[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const CashierHub: FC<CashierHubProps> = ({ tabs = [] }) => {
  const { user } = usePage<any>().props
  const userName = user?.fullName || user?.email || 'Operador de Caixa'

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Métricas calculadas
  const { billRequestedTabs, regularTabs, totalValueAwaitingPayment } = useMemo(() => {
    let requested: TabItem[] = []
    let regular: TabItem[] = []
    let total = 0

    for (const tab of tabs) {
      const isRequested =
        tab.status === 'BILL_REQUESTED' ||
        tab.table?.status === 'CONTA_PEDIDA' ||
        tab.table?.status === 'BILL_REQUESTED'

      let tabTotal = 0
      for (const order of tab.orders || []) {
        for (const item of order.items || []) {
          tabTotal += Number(item.unitPrice || 0) * (item.quantity || 1)
        }
      }

      total += tabTotal

      if (isRequested) {
        requested.push(tab)
      } else {
        regular.push(tab)
      }
    }

    return {
      billRequestedTabs: requested,
      regularTabs: regular,
      totalValueAwaitingPayment: total,
    }
  }, [tabs])

  return (
    <StaffLayout>
      <div className="space-y-8">
        {/* Header de Boas-vindas */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-gray-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-teal-400 text-black font-bold text-xs uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                CONTROLE DE CAIXA
              </span>
              <span className="text-teal-200 text-xs capitalize">{currentDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Olá, {userName}</h1>
            <p className="text-teal-100 text-sm mt-1">
              Conferência e liquidação de comandas. Feche contas com agilidade e libere as mesas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/staff/tables"
              className="px-4 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition shadow-sm flex items-center gap-2"
            >
              <span>🍽️</span>
              <span>Visão Geral do Salão</span>
            </Link>
          </div>
        </div>

        {/* Resumo de Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border-2 border-amber-300 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Solicitações de Conta
              </span>
              <span className="text-xl">🔔</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600">
                {billRequestedTabs.length}
              </span>
              <span className="text-xs text-amber-700 font-medium">mesas aguardando acerto</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Comandas em Consumo
              </span>
              <span className="text-xl">🧾</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{regularTabs.length}</span>
              <span className="text-xs text-gray-500 font-medium">mesas ativas</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Volume em Aberto no Salão
              </span>
              <span className="text-xl">💰</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">
                {formatCurrency(totalValueAwaitingPayment)}
              </span>
              <span className="text-xs text-gray-500 font-medium">consumo acumulado</span>
            </div>
          </div>
        </div>

        {/* Seção 1: Mesas com CONTA PEDIDA (Prioridade Alta) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-lg font-bold text-gray-900">
                Aguardando Pagamento ({billRequestedTabs.length})
              </h2>
            </div>
          </div>

          {billRequestedTabs.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
              <span className="text-3xl block mb-2">✨</span>
              <p className="font-semibold text-gray-700">
                Nenhuma comanda solicitando fechamento no momento.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Quando um cliente pedir a conta via app, ela aparecerá aqui em destaque.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {billRequestedTabs.map((tab) => {
                let tabTotal = 0
                for (const order of tab.orders || []) {
                  for (const item of order.items || []) {
                    tabTotal += Number(item.unitPrice || 0) * (item.quantity || 1)
                  }
                }

                return (
                  <div
                    key={tab.id}
                    className="bg-amber-50/60 border-2 border-amber-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-sm">
                            {tab.table?.number ?? tab.tableId}
                          </span>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">
                              Mesa {tab.table?.number ?? tab.tableId}
                            </h3>
                            <span className="text-[11px] text-amber-800 font-medium">
                              Comanda #{tab.id}
                            </span>
                          </div>
                        </div>
                        <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide">
                          Conta Pedida
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-amber-200/80 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Membros ({tab.members?.length ?? 0}):</span>
                          <span className="font-medium text-gray-900 truncate max-w-[160px]">
                            {tab.members?.map((m) => m.alias).join(', ') || 'Nenhum'}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Total de pedidos:</span>
                          <span className="font-medium text-gray-900">
                            {tab.orders?.length ?? 0} lançamentos
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-amber-200/60">
                          <span className="font-bold text-gray-700">Subtotal:</span>
                          <span className="text-xl font-black text-amber-900">
                            {formatCurrency(tabTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Link
                        href={`/staff/tables/${tab.table?.id ?? tab.tableId}`}
                        className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Conferir & Finalizar</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Seção 2: Todas as Mesas Abertas */}
        {regularTabs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Outras Comandas em Consumo ({regularTabs.length})
            </h2>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                      <th className="px-6 py-3">Mesa</th>
                      <th className="px-6 py-3">Comanda</th>
                      <th className="px-6 py-3">Clientes</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Consumo Parcial</th>
                      <th className="px-6 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {regularTabs.map((tab) => {
                      let tabTotal = 0
                      for (const order of tab.orders || []) {
                        for (const item of order.items || []) {
                          tabTotal += Number(item.unitPrice || 0) * (item.quantity || 1)
                        }
                      }

                      return (
                        <tr key={tab.id} className="hover:bg-gray-50/80 transition">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            Mesa {tab.table?.number ?? tab.tableId}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">#{tab.id}</td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {tab.members?.map((m) => m.alias).join(', ') || 'Sem membros'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                              Em Consumo
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            {formatCurrency(tabTotal)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              href={`/staff/tables/${tab.table?.id ?? tab.tableId}`}
                              className="text-xs font-semibold text-black hover:underline"
                            >
                              Ver Detalhes →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  )
}

export default CashierHub
