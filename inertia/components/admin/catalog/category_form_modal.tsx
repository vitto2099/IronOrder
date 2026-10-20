import type { FormEvent } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { Category } from '~/types'

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category?: Category | null
}

export default function CategoryFormModal({ isOpen, onClose, category }: CategoryFormModalProps) {
  if (!isOpen) return null

  return (
    <CategoryFormModalContent key={category?.id ?? 'new'} onClose={onClose} category={category} />
  )
}

function CategoryFormModalContent({
  onClose,
  category,
}: {
  onClose: () => void
  category?: Category | null
}) {
  const [name, setName] = useState(category?.name || '')
  const [emoji, setEmoji] = useState(category?.emoji || '')
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 0)
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const payload = {
      name,
      emoji: emoji || null,
      sortOrder: Number(sortOrder),
      isActive,
    }

    if (category?.id) {
      router.put(`/admin/catalog/categories/${category.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setLoading(false)
          onClose()
        },
        onError: (errs) => {
          setLoading(false)
          setErrors(errs as Record<string, string>)
        },
      })
    } else {
      router.post('/admin/catalog/categories', payload, {
        preserveScroll: true,
        onSuccess: () => {
          setLoading(false)
          onClose()
        },
        onError: (errs) => {
          setLoading(false)
          setErrors(errs as Record<string, string>)
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
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
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entradas, Pratos Principais"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Emoji
              </label>
              <input
                type="text"
                maxLength={10}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="Ex: 🥗, 🍽️"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm text-center text-lg"
              />
              {errors.emoji && <p className="text-xs text-red-600 mt-1">{errors.emoji}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Ordem de Exibição
              </label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
              />
              {errors.sortOrder && <p className="text-xs text-red-600 mt-1">{errors.sortOrder}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="category_is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-black focus:ring-black h-4 w-4"
            />
            <label htmlFor="category_is_active" className="text-sm font-medium text-gray-700">
              Categoria Ativa no Cardápio
            </label>
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
              {loading ? 'Salvando...' : category ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
