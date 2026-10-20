import { type FC, useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'

export interface KdsOrderItem {
  id: number
  orderId: number
  productId: number | null
  nameSnapshot: string
  unitPrice: number
  quantity: number
  notes?: string | null
  subtotal: number
}

export interface KdsOrder {
  id: number
  tabId: number
  tabMemberId: number
  status: 'ENVIADO' | 'EM_PREPARO' | 'PRONTO' | 'PENDING' | 'PREPARING' | 'READY' | string
  createdAt: string
  tableNumber: number | null
  memberAlias: string
  items: KdsOrderItem[]
}

interface KdsProps {
  orders: KdsOrder[]
}

const KdsIndex: FC<KdsProps> = ({ orders = [] }) => {
  const [filter, setFilter] = useState<'ALL' | 'KITCHEN' | 'BAR'>('ALL')
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now())
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)

  // Atualiza relógio local a cada 10 segundos para manter os timers dos cards vivos e precisos
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000)
    return () => clearInterval(clockInterval)
  }, [])

  // Polling automático a cada 7 segundos (ADR-002)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      router.reload({
        only: ['orders'],
      })
    }, 7000)

    return () => clearInterval(pollInterval)
  }, [])

  // Calcula minutos decorridos desde a criação do pedido
  const getElapsedMinutes = (createdAtStr: string): number => {
    const createdTime = new Date(createdAtStr).getTime()
    const diffMs = currentTime - createdTime
    return Math.max(0, Math.floor(diffMs / 60000))
  }

  // Formata hora do pedido HH:mm
  const formatTime = (createdAtStr: string): string => {
    try {
      const d = new Date(createdAtStr)
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '--:--'
    }
  }

  // Transição de status em 1 clique
  const handleTransition = (orderId: number, nextStatus: string) => {
    setUpdatingOrderId(orderId)
    router.patch(
      `/kds/orders/${orderId}/status`,
      { status: nextStatus },
      {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setUpdatingOrderId(null),
      }
    )
  }

  // Separação em colunas Kanban
  const newOrders = useMemo(
    () => orders.filter((o) => o.status === 'ENVIADO' || o.status === 'PENDING'),
    [orders]
  )
  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === 'EM_PREPARO' || o.status === 'PREPARING'),
    [orders]
  )
  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === 'PRONTO' || o.status === 'READY'),
    [orders]
  )

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Header KDS de Alto Contraste */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <h1 className="text-xl font-black uppercase tracking-wider text-neutral-100">
              KDS - Cozinha & Bar
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ao vivo
          </span>
        </div>

        {/* Contadores Operacionais */}
        <div className="flex items-center gap-6 text-sm font-semibold">
          <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-amber-400">📥 Na Fila:</span>
            <span className="text-white text-base font-bold">{newOrders.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-blue-400">🍳 Em Preparo:</span>
            <span className="text-white text-base font-bold">{preparingOrders.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-emerald-400">🔔 Prontos:</span>
            <span className="text-white text-base font-bold">{readyOrders.length}</span>
          </div>
        </div>

        {/* Filtro Setorial */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded transition ${
              filter === 'ALL'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilter('KITCHEN')}
            className={`px-3 py-1.5 rounded transition ${
              filter === 'KITCHEN'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Cozinha
          </button>
          <button
            type="button"
            onClick={() => setFilter('BAR')}
            className={`px-3 py-1.5 rounded transition ${
              filter === 'BAR'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Bar
          </button>
        </div>
      </header>

      {/* Grid Kanban das 3 Colunas */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-x-auto">
        {/* Coluna 1: Novos Pedidos (ENVIADO) */}
        <section className="flex flex-col bg-neutral-900/60 rounded-xl border border-amber-500/30 overflow-hidden shadow-lg">
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black text-lg">📥</span>
              <h2 className="font-bold text-amber-300 uppercase tracking-wide text-sm">
                Novos Pedidos
              </h2>
            </div>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500/40">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {newOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-neutral-500 text-sm italic">
                Nenhum pedido na fila de espera
              </div>
            ) : (
              newOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={getElapsedMinutes(order.createdAt)}
                  orderTime={formatTime(order.createdAt)}
                  isUpdating={updatingOrderId === order.id}
                  actionLabel="Iniciar Preparo 🍳"
                  actionColor="bg-amber-500 hover:bg-amber-400 text-black font-extrabold"
                  onAction={() => handleTransition(order.id, 'EM_PREPARO')}
                />
              ))
            )}
          </div>
        </section>

        {/* Coluna 2: Em Preparo (EM_PREPARO) */}
        <section className="flex flex-col bg-neutral-900/60 rounded-xl border border-blue-500/30 overflow-hidden shadow-lg">
          <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-black text-lg">🍳</span>
              <h2 className="font-bold text-blue-300 uppercase tracking-wide text-sm">
                Em Preparo
              </h2>
            </div>
            <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-500/40">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {preparingOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-neutral-500 text-sm italic">
                Nenhum prato em confecção no momento
              </div>
            ) : (
              preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={getElapsedMinutes(order.createdAt)}
                  orderTime={formatTime(order.createdAt)}
                  isUpdating={updatingOrderId === order.id}
                  actionLabel="Marcar Pronto 🔔"
                  actionColor="bg-blue-500 hover:bg-blue-400 text-white font-extrabold"
                  onAction={() => handleTransition(order.id, 'PRONTO')}
                />
              ))
            )}
          </div>
        </section>

        {/* Coluna 3: Prontos para Retirada (PRONTO) */}
        <section className="flex flex-col bg-neutral-900/60 rounded-xl border border-emerald-500/30 overflow-hidden shadow-lg">
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-black text-lg">🔔</span>
              <h2 className="font-bold text-emerald-300 uppercase tracking-wide text-sm">
                Prontos (Aguardando Garçom)
              </h2>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/40">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {readyOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-neutral-500 text-sm italic">
                Nenhum prato pronto aguardando retirada
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={getElapsedMinutes(order.createdAt)}
                  orderTime={formatTime(order.createdAt)}
                  isUpdating={updatingOrderId === order.id}
                  actionLabel="Confirmar Entrega 🚀"
                  actionColor="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold"
                  onAction={() => handleTransition(order.id, 'ENTREGUE')}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

interface OrderCardProps {
  order: KdsOrder
  elapsedMinutes: number
  orderTime: string
  isUpdating: boolean
  actionLabel: string
  actionColor: string
  onAction: () => void
}

function OrderCard({
  order,
  elapsedMinutes,
  orderTime,
  isUpdating,
  actionLabel,
  actionColor,
  onAction,
}: OrderCardProps) {
  // Alerta de tempo decorrido
  let timerBadgeColor = 'bg-neutral-800 text-emerald-400 border-neutral-700'
  if (elapsedMinutes >= 10 && elapsedMinutes < 20) {
    timerBadgeColor = 'bg-amber-950 text-amber-300 border-amber-700 font-bold'
  } else if (elapsedMinutes >= 20) {
    timerBadgeColor = 'bg-rose-950 text-rose-300 border-rose-600 font-extrabold animate-pulse'
  }

  return (
    <article className="bg-neutral-800/90 rounded-xl p-4 border border-neutral-700/80 shadow-md flex flex-col justify-between gap-4 transition hover:border-neutral-600">
      {/* Topo do Card: Mesa + Tempo decorrido + Alias */}
      <div>
        <div className="flex items-start justify-between gap-2 border-b border-neutral-700/60 pb-3">
          <div>
            <span className="text-xl font-black tracking-wide text-white block">
              {order.tableNumber ? `MESA ${String(order.tableNumber).padStart(2, '0')}` : 'BALCÃO'}
            </span>
            <span className="text-xs text-neutral-400 font-medium">
              Por: <strong className="text-neutral-200">{order.memberAlias}</strong>
            </span>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${timerBadgeColor}`}
            >
              ⏱ {elapsedMinutes} min
            </span>
            <span className="block text-[11px] text-neutral-400 mt-1 font-mono">{orderTime}</span>
          </div>
        </div>

        {/* Lista de Itens do Pedido */}
        <div className="py-3 space-y-2.5">
          {order.items.map((item) => (
            <div key={item.id} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-amber-400 tabular-nums">
                  {item.quantity}x
                </span>
                <span className="font-semibold text-neutral-100 flex-1 leading-snug">
                  {item.nameSnapshot}
                </span>
              </div>

              {/* Destaque Obrigatório de Observação Especial */}
              {item.notes && (
                <div className="mt-1 ml-6 p-2 rounded-md bg-amber-950/60 border border-amber-700/70 text-amber-200 text-xs font-semibold flex items-center gap-1.5 shadow-inner">
                  <span>⚠️</span>
                  <span>{item.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botão de Ação de 1 Toque */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={onAction}
        className={`w-full py-3 px-4 rounded-lg shadow uppercase text-sm tracking-wider transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${actionColor}`}
      >
        {isUpdating ? 'Atualizando...' : actionLabel}
      </button>
    </article>
  )
}

export default KdsIndex
