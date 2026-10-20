import type { FormEvent } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { UserRole } from '../../../types'

interface StaffFormModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StaffFormModal({ isOpen, onClose }: StaffFormModalProps) {
  if (!isOpen) return null

  return <StaffFormModalContent onClose={onClose} />
}

function StaffFormModalContent({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('GARCOM')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    router.post(
      '/admin/staff',
      {
        fullName,
        email,
        password,
        role,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setLoading(false)
          onClose()
        },
        onError: (errs) => {
          setLoading(false)
          setErrors(errs as Record<string, string>)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Novo Colaborador</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              E-mail de Acesso
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@restaurante.com"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Senha Inicial
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Papel / Função (RBAC)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm bg-white"
            >
              <option value="GARCOM">Garçom (Atendimento no Salão)</option>
              <option value="COZINHA">Cozinha (KDS Kanban)</option>
              <option value="CAIXA">Caixa (Fechamento e Pagamentos)</option>
              <option value="GERENTE">Gerente (Gestão Operacional)</option>
              <option value="ADMIN">Administrador (Acesso Total)</option>
            </select>
            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
