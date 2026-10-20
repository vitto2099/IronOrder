import type { FormEvent } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'

interface TableFormModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TableFormModal({ isOpen, onClose }: TableFormModalProps) {
  if (!isOpen) return null

  return <TableFormModalContent onClose={onClose} />
}

function TableFormModalContent({ onClose }: { onClose: () => void }) {
  const [isBatch, setIsBatch] = useState(false)
  const [number, setNumber] = useState<number | string>('')
  const [startNumber, setStartNumber] = useState<number | string>('')
  const [endNumber, setEndNumber] = useState<number | string>('')
  const [capacity, setCapacity] = useState<number | string>(4)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const payload = isBatch
      ? {
          isBatch: true,
          startNumber: Number(startNumber),
          endNumber: Number(endNumber),
          capacity: Number(capacity),
        }
      : {
          isBatch: false,
          number: Number(number),
          capacity: Number(capacity),
        }

    router.post('/admin/tables', payload, {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isBatch ? 'Cadastrar Mesas em Lote' : 'Nova Mesa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none"
          >
            ×
          </button>
        </div>

        {/* Alternador de Modo: Individual vs Em Lote */}
        <div className="flex bg-gray-100 p-1 rounded-xl mt-4">
          <button
            type="button"
            onClick={() => setIsBatch(false)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              !isBatch ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            Mesa Individual
          </button>
          <button
            type="button"
            onClick={() => setIsBatch(true)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              isBatch ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            Em Lote (Intervalo)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {!isBatch ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Número da Mesa
              </label>
              <input
                type="number"
                required
                min={1}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Ex: 12"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
              />
              {errors.number && <p className="text-xs text-red-600 mt-1">{errors.number}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Mesa Inicial
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                />
                {errors.startNumber && (
                  <p className="text-xs text-red-600 mt-1">{errors.startNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Mesa Final
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={endNumber}
                  onChange={(e) => setEndNumber(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                />
                {errors.endNumber && (
                  <p className="text-xs text-red-600 mt-1">{errors.endNumber}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Capacidade (Pessoas)
            </label>
            <input
              type="number"
              required
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Ex: 4"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.capacity && <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>}
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
              {loading ? 'Salvando...' : isBatch ? 'Criar Lote' : 'Cadastrar Mesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
