import type { FormEvent } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { StaffMember } from '../../../types'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  staff: StaffMember | null
}

export default function ResetPasswordModal({ isOpen, onClose, staff }: ResetPasswordModalProps) {
  if (!isOpen || !staff) return null

  return <ResetPasswordModalContent key={staff.id} staff={staff} onClose={onClose} />
}

function ResetPasswordModalContent({
  staff,
  onClose,
}: {
  staff: StaffMember
  onClose: () => void
}) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    router.patch(
      `/admin/staff/${staff.id}/reset-password`,
      { password },
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
          <div>
            <h2 className="text-lg font-bold text-gray-900">Redefinir Senha</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Colaborador: {staff.fullName || staff.email}
            </p>
          </div>
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
              Nova Senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a nova senha (mínimo 8 caracteres)"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
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
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
