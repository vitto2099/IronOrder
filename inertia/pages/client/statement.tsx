import { useState, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'

interface StatementItem {
  id: number
  name: string
  unitPrice: number
  quantity: number
  subtotal: number
  status: string
  notes?: string | null
  orderId: number
}

interface MemberBreakdown {
  id: number
  alias: string
  status?: string
  subtotal: number
  hasPendingOrders?: boolean
  paidAt?: string | null
  items: StatementItem[]
}

interface StatementProps {
  tableNumber: number
  tableStatus: string
  tableTotal: number
  mySubtotal: number
  myStatus?: 'OPEN' | 'BILL_REQUESTED' | 'PAID' | string
  tabId: number
  myAlias?: string
  myMemberId?: number
  membersBreakdown: MemberBreakdown[]
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val)
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ENVIADO':
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          🟡 Aguardando início
        </span>
      )
    case 'EM_PREPARO':
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          🍳 Na cozinha
        </span>
      )
    case 'PRONTO':
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
          🔔 Pronto / A caminho
        </span>
      )
    case 'ENTREGUE':
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          ✅ Entregue
        </span>
      )
    case 'CANCELADO':
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
          ❌ Cancelado
        </span>
      )
    default:
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-700">
          {status}
        </span>
      )
  }
}

export default function Statement({
  tableNumber,
  tableStatus,
  tableTotal,
  mySubtotal,
  myStatus,
  myAlias,
  myMemberId,
  membersBreakdown,
}: StatementProps) {
  const { flash } = usePage<{ flash?: { notification?: { type: string; message: string } } }>()
    .props
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [expandedMembers, setExpandedMembers] = useState<Record<number, boolean>>({})

  const myBreakdown = membersBreakdown.find((m) => m.id === myMemberId || m.alias === myAlias)
  const otherMembers = membersBreakdown.filter((m) => m.id !== myMemberId && m.alias !== myAlias)

  const isTableBillRequested = tableStatus === 'CONTA_PEDIDA' || tableStatus === 'BILL_REQUESTED'
  const isMyBillRequested =
    myStatus === 'BILL_REQUESTED' ||
    myBreakdown?.status === 'BILL_REQUESTED' ||
    isTableBillRequested
  const isMyPaid = myStatus === 'PAID' || myBreakdown?.status === 'PAID'

  // Polling automático a cada 6 segundos para acompanhar produção e status de conta sem reload manual
  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({
        only: ['tableTotal', 'mySubtotal', 'membersBreakdown', 'tableStatus', 'myStatus'],
      } as any)
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  const toggleMemberExpand = (memberId: number) => {
    setExpandedMembers((prev) => ({ ...prev, [memberId]: !prev[memberId] }))
  }

  const handleConfirmRequestBill = () => {
    setIsRequesting(true)
    router.post(
      `/m/${tableNumber}/request-bill`,
      {},
      {
        onFinish: () => {
          setIsRequesting(false)
          setShowConfirmModal(false)
        },
      }
    )
  }

  return (
    <div className="max-w-md mx-auto bg-[#F6F6F6] min-h-screen pb-28 font-sans">
      {/* Topo / Navegação */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={() => router.visit(`/m/${tableNumber}/menu`)}
          className="text-xs font-bold text-gray-700 hover:text-amber-600 flex items-center gap-1.5 transition py-1 px-2 rounded-lg hover:bg-gray-50"
        >
          <span>←</span>
          <span>Voltar ao Cardápio</span>
        </button>
        <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
          Mesa {tableNumber}
        </span>
      </header>

      <main className="p-4 space-y-4">
        {/* Notificação Flash */}
        {flash?.notification && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold shadow-xs ${
              flash.notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : flash.notification.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {flash.notification.message}
          </div>
        )}

        {/* Banner de Comanda Individual */}
        {isMyPaid ? (
          <div className="bg-purple-600 text-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-black text-sm">Comanda Paga e Encerrada!</h3>
              <p className="text-xs text-purple-100 mt-0.5 leading-relaxed">
                O pagamento da sua parte foi confirmado. Obrigado pela visita!
              </p>
            </div>
          </div>
        ) : isMyBillRequested ? (
          <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <h3 className="font-black text-sm">Conta Solicitada!</h3>
              <p className="text-xs text-amber-50 mt-0.5 leading-relaxed">
                O garçom foi notificado e virá à sua mesa para receber o pagamento da sua comanda (
                {formatCurrency(mySubtotal)}). Seus amigos continuam na mesa normalmente.
              </p>
            </div>
          </div>
        ) : null}

        {/* Card Resumo Financeiro */}
        <section className="bg-gray-900 text-white rounded-3xl p-6 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Resumo Financeiro da Mesa
          </span>

          <div className="mt-4 flex items-end justify-between border-b border-gray-800 pb-4">
            <div>
              <span className="text-xs text-gray-400 font-medium block">Total Geral da Mesa</span>
              <span className="text-2xl font-black tracking-tight text-white mt-0.5 block">
                {formatCurrency(tableTotal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-amber-400 font-bold block">
                Sua Parte ({myAlias || 'Você'})
              </span>
              <span className="text-2xl font-black tracking-tight text-amber-400 mt-0.5 block">
                {formatCurrency(mySubtotal)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>{membersBreakdown.length} participante(s) na mesa</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado
            </span>
          </div>
        </section>

        {/* Seção Seu Consumo */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-gray-900">Seu Consumo</h2>
              <span className="text-xs text-gray-500 font-medium">
                Itens associados ao seu nome ({myAlias || 'Você'})
              </span>
            </div>
            <span className="text-sm font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl">
              {formatCurrency(mySubtotal)}
            </span>
          </div>

          {!myBreakdown || myBreakdown.items.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400 font-medium">
              Você ainda não enviou nenhum pedido para a cozinha.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myBreakdown.items.map((item) => {
                const isCancelled = item.status === 'CANCELADO'
                return (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.quantity}x
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            isCancelled ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-gray-500 mt-0.5 italic">Obs: {item.notes}</p>
                      )}
                      <div className="mt-1.5">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    <span
                      className={`text-sm font-black ${
                        isCancelled ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Seção Outros Membros da Mesa */}
        {otherMembers.length > 0 && (
          <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <h2 className="text-base font-black text-gray-900 mb-1">Amigos na Mesa</h2>
            <p className="text-xs text-gray-500 font-medium mb-4">
              Acompanhe o consumo de cada um para facilitar a divisão
            </p>

            <div className="space-y-2">
              {otherMembers.map((member) => {
                const isExpanded = Boolean(expandedMembers[member.id])
                return (
                  <div
                    key={member.id}
                    className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMemberExpand(member.id)}
                      className="w-full p-3.5 flex items-center justify-between text-left hover:bg-gray-100/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
                          {member.alias.charAt(0)}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{member.alias}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">
                          {formatCurrency(member.subtotal)}
                        </span>
                        <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 border-t border-gray-100 bg-white divide-y divide-gray-50">
                        {member.items.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">Sem pedidos lançados.</p>
                        ) : (
                          member.items.map((it) => (
                            <div
                              key={it.id}
                              className="py-2 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">{it.quantity}x</span>
                                <span
                                  className={
                                    it.status === 'CANCELADO'
                                      ? 'line-through text-gray-400'
                                      : 'text-gray-700 font-medium'
                                  }
                                >
                                  {it.name}
                                </span>
                              </div>
                              <span
                                className={
                                  it.status === 'CANCELADO'
                                    ? 'line-through text-gray-400'
                                    : 'text-gray-900 font-bold'
                                }
                              >
                                {formatCurrency(it.subtotal)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* Ação Fixa Inferior: Pedir a Conta */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          {isMyPaid ? (
            <button
              disabled
              className="w-full py-4 px-6 rounded-2xl bg-purple-100 text-purple-800 font-bold text-base flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span>✅</span>
              <span>Sua Comanda Foi Quitada!</span>
            </button>
          ) : isMyBillRequested ? (
            <button
              disabled
              className="w-full py-4 px-6 rounded-2xl bg-amber-100 text-amber-800 font-bold text-base flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span>🔔</span>
              <span>Aguardando o Garçom...</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-4 px-6 rounded-2xl bg-gray-900 hover:bg-black active:bg-gray-800 text-white font-black text-base shadow-md transition flex items-center justify-center gap-2"
            >
              <span>💳</span>
              <span>Pedir a Conta (Fechar Mesa)</span>
            </button>
          )}
        </div>
      </footer>

      {/* Modal de Confirmação para Pedir a Conta */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 text-2xl flex items-center justify-center mx-auto">
                🧾
              </div>
              <h3 className="text-lg font-black text-gray-900">Pedir a Conta?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ao confirmar, o garçom trará a maquininha para receber a sua comanda (
                {formatCurrency(mySubtotal)}). Seus amigos continuam na mesa.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">
                Total Acumulado
              </span>
              <span className="text-xl font-black text-emerald-700">
                {formatCurrency(mySubtotal)}
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isRequesting}
                onClick={handleConfirmRequestBill}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {isRequesting ? 'Notificando garçom...' : 'Sim, Chamar Garçom'}
              </button>
              <button
                type="button"
                disabled={isRequesting}
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 px-4 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold text-xs transition"
              >
                Continuar Pedindo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
