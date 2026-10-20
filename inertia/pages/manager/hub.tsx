import type { FC } from 'react'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import StaffLayout from '~/layouts/staff_layout'

interface ManagerHubProps {
  stats: {
    totalTables: number
    occupiedTables: number
    freeTables: number
    pendingOrdersCount: number
    openTabsCount: number
  }
}

const ManagerHub: FC<ManagerHubProps> = ({ stats }) => {
  const { user } = usePage<any>().props
  const userName = user?.fullName || user?.email || 'Gerente'

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <StaffLayout>
      <div className="space-y-8">
        {/* Header de Boas-vindas */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-400 text-black font-bold text-xs uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                GERÊNCIA
              </span>
              <span className="text-indigo-200 text-xs capitalize">{currentDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Olá, {userName}</h1>
            <p className="text-indigo-100 text-sm mt-1">
              Hub de Operações em Tempo Real. Supervisione o salão, o fluxo da cozinha e o cardápio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/staff/tables"
              className="px-4 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition shadow-sm flex items-center gap-2"
            >
              <span>🍽️</span>
              <span>Monitorar Salão</span>
            </Link>
            <Link
              href="/kds"
              className="px-4 py-2.5 bg-amber-400 text-black rounded-xl font-bold text-sm hover:bg-amber-300 transition shadow-sm flex items-center gap-2"
            >
              <span>🍳</span>
              <span>Fila KDS</span>
            </Link>
          </div>
        </div>

        {/* Resumo de Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ocupação do Salão
              </span>
              <span className="text-xl">🪑</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats?.occupiedTables ?? 0}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                / {stats?.totalTables ?? 0} mesas ocupadas ({stats?.freeTables ?? 0} livres)
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pedidos em Fila (KDS)
              </span>
              <span className="text-xl">🍳</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600">
                {stats?.pendingOrdersCount ?? 0}
              </span>
              <span className="text-xs text-gray-500 font-medium">aguardando ou preparando</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Comandas Ativas
              </span>
              <span className="text-xl">🧾</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-600">
                {stats?.openTabsCount ?? 0}
              </span>
              <span className="text-xs text-gray-500 font-medium">em consumo no salão</span>
            </div>
          </div>
        </div>

        {/* Cards de Navegação Rápida da Operação */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Supervisão de Turno</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card Salão */}
            <Link
              href="/staff/tables"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  🍽️
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Monitor de Mesas
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Acompanhe status em tempo real, pedidos das mesas, tempo de permanência e
                  liberação.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Ir para salão</span>
                <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Card KDS */}
            <Link
              href="/kds"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  🍳
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Fila do KDS Cozinha
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Visualize o ritmo dos pedidos, tempo de preparo de cada comanda e garanta
                  agilidade.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-rose-600 group-hover:translate-x-1 transition-transform">
                <span>Ver produção</span>
                <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Card Cardápio */}
            <Link
              href="/admin/catalog"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  📋
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Disponibilidade do Cardápio
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Pause pratos esgotados com 1 clique ou reative itens reabastecidos para os
                  clientes.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Ajustar itens</span>
                <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Card Caixa */}
            <Link
              href="/cashier/hub"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  💳
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Caixa & Fechamento
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Monitore contas solicitadas pelos clientes e auxilie na liquidação do salão.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-teal-600 group-hover:translate-x-1 transition-transform">
                <span>Ver caixa</span>
                <span className="ml-1">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </StaffLayout>
  )
}

export default ManagerHub
