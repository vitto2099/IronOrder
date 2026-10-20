import type { FC } from 'react'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import StaffLayout from '~/layouts/staff_layout'

interface AdminHubProps {
  stats: {
    totalTables: number
    occupiedTables: number
    freeTables: number
    pendingOrdersCount: number
    activeStaffCount: number
    openTabsCount: number
  }
}

const AdminHub: FC<AdminHubProps> = ({ stats }) => {
  const { user } = usePage<any>().props
  const userName = user?.fullName || user?.email || 'Administrador'

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
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-amber-400 text-black font-bold text-xs uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                ADMIN
              </span>
              <span className="text-gray-400 text-xs capitalize">{currentDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Olá, {userName}</h1>
            <p className="text-gray-300 text-sm mt-1">
              Painel Geral de Controle do QR-Order. Monitore operações e gerencie recursos em tempo
              real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/staff/tables"
              className="px-4 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition shadow-sm flex items-center gap-2"
            >
              <span>🍽️</span>
              <span>Abrir Salão</span>
            </Link>
            <Link
              href="/kds"
              className="px-4 py-2.5 bg-amber-500 text-black rounded-xl font-bold text-sm hover:bg-amber-400 transition shadow-sm flex items-center gap-2"
            >
              <span>🍳</span>
              <span>Ver Cozinha (KDS)</span>
            </Link>
          </div>
        </div>

        {/* Resumo de Indicadores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mesas do Salão
              </span>
              <span className="text-xl">🪑</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats?.occupiedTables ?? 0}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                / {stats?.totalTables ?? 0} ocupadas ({stats?.freeTables ?? 0} livres)
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Fila da Cozinha
              </span>
              <span className="text-xl">🍳</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600">
                {stats?.pendingOrdersCount ?? 0}
              </span>
              <span className="text-xs text-gray-500 font-medium">pedidos em preparo</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Comandas Abertas
              </span>
              <span className="text-xl">🧾</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-600">
                {stats?.openTabsCount ?? 0}
              </span>
              <span className="text-xs text-gray-500 font-medium">ativas no salão</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Staff Ativo
              </span>
              <span className="text-xl">👥</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">
                {stats?.activeStaffCount ?? 0}
              </span>
              <span className="text-xs text-gray-500 font-medium">colaboradores</span>
            </div>
          </div>
        </div>

        {/* Bento Grid com Cards de Navegação Rápida */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Módulos Administrativos & Operacionais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card Staff */}
            <Link
              href="/admin/staff"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  👥
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Equipe & Colaboradores
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Cadastre garçons, cozinheiros, gerentes e caixas. Redefina senhas e controle
                  permissões de acesso.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
                <span>Gerenciar equipe</span>
                <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Card Mesas */}
            <Link
              href="/admin/tables"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  🪑
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Mesas & Impressão QR Code
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Configure as mesas físicas do salão, gere novos tokens de segurança e imprima as
                  folhas A4 com QR Codes.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Gerenciar mesas</span>
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
                  Catálogo & Cardápio
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Gerencie categorias, pratos, bebidas, preços e alterne a disponibilidade de itens
                  em tempo real.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Editar catálogo</span>
                <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Card Operação Salão */}
            <Link
              href="/staff/tables"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  🍽️
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Salão & Garçons
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Grid operacional em tempo real: status das mesas, lançamento manual, baixa de
                  pratos e liberação.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Acessar salão</span>
                <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Card KDS Cozinha */}
            <Link
              href="/kds"
              className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  🍳
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                  Display KDS Cozinha
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Kanban de produção cronológico: avance pratos de ENVIADO para EM PREPARO e PRONTO
                  em um toque.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-rose-600 group-hover:translate-x-1 transition-transform">
                <span>Abrir KDS</span>
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
                  Controle de Caixa
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Conferência rápida de comandas fechando, extratos de consumo consolidados e
                  liquidação de contas.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-semibold text-teal-600 group-hover:translate-x-1 transition-transform">
                <span>Acessar caixa</span>
                <span className="ml-1">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </StaffLayout>
  )
}

export default AdminHub
