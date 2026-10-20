import React, { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import StaffLayout from '../../../layouts/staff_layout'
import type { StaffMember, UserRole } from '../../../types'
import StaffFormModal from '../../../components/admin/staff/staff_form_modal'
import ResetPasswordModal from '../../../components/admin/staff/reset_password_modal'

interface StaffIndexProps {
  staff: StaffMember[]
}

const StaffIndex: React.FC<StaffIndexProps> = ({ staff }) => {
  const { user: currentUser } = usePage<any>().props
  const [search, setSearch] = useState('')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staff
    const term = search.toLowerCase()
    return staff.filter(
      (u) =>
        (u.fullName && u.fullName.toLowerCase().includes(term)) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
    )
  }, [staff, search])

  function handleToggleStatus(member: StaffMember) {
    if (currentUser && currentUser.id === member.id) {
      alert('Você não pode desativar o seu próprio usuário administrador.')
      return
    }

    setTogglingId(member.id)
    router.patch(
      `/admin/staff/${member.id}/status`,
      {},
      {
        preserveScroll: true,
        onFinish: () => setTogglingId(null),
      }
    )
  }

  function handleOpenReset(member: StaffMember) {
    setSelectedStaff(member)
    setResetModalOpen(true)
  }

  function getRoleBadge(role: UserRole) {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            Administrador
          </span>
        )
      case 'GERENTE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Gerente
          </span>
        )
      case 'GARCOM':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Garçom
          </span>
        )
      case 'COZINHA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            Cozinha
          </span>
        )
      case 'CAIXA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            Caixa
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {role}
          </span>
        )
    }
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Equipe & Colaboradores
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerenciamento de acessos, papéis operacionais (RBAC) e credenciais de colaboradores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFormModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <span>+</span>
            <span>Novo Colaborador</span>
          </button>
        </div>

        {/* Barra de Busca e Estatísticas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou papel..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 font-medium">
            <span>
              Total de Usuários: <strong className="text-black">{staff.length}</strong>
            </span>
            <span>
              Ativos:{' '}
              <strong className="text-green-600">{staff.filter((u) => u.isActive).length}</strong>
            </span>
            <span>
              Inativos:{' '}
              <strong className="text-gray-400">{staff.filter((u) => !u.isActive).length}</strong>
            </span>
          </div>
        </div>

        {/* Tabela de Colaboradores */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Colaborador</th>
                  <th className="px-6 py-4">Papel (RBAC)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Data de Cadastro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          {member.fullName || 'Sem nome informado'}
                        </div>
                        <div className="text-xs text-gray-400">{member.email}</div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(member)}
                          disabled={togglingId === member.id || currentUser?.id === member.id}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                            member.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                          title={
                            currentUser?.id === member.id
                              ? 'Não é permitido desativar sua própria conta'
                              : 'Clique para alternar status'
                          }
                        >
                          {member.isActive ? '● Ativo' : '○ Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenReset(member)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                        >
                          Redefinir Senha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modais */}
        <StaffFormModal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} />
        <ResetPasswordModal
          isOpen={resetModalOpen}
          staff={selectedStaff}
          onClose={() => {
            setResetModalOpen(false)
            setSelectedStaff(null)
          }}
        />
      </div>
    </StaffLayout>
  )
}

export default StaffIndex
