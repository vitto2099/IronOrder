import { useState } from 'react'
import { router } from '@inertiajs/react'

interface AvailabilitySwitchProps {
  productId: number
  isAvailable: boolean
}

export default function AvailabilitySwitch({ productId, isAvailable }: AvailabilitySwitchProps) {
  const [loading, setLoading] = useState(false)

  function handleToggle() {
    if (loading) return
    setLoading(true)

    router.patch(
      `/admin/catalog/products/${productId}/availability`,
      { isAvailable: !isAvailable },
      {
        preserveScroll: true,
        onFinish: () => setLoading(false),
      }
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAvailable}
      disabled={loading}
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
        isAvailable ? 'bg-emerald-600' : 'bg-gray-300'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isAvailable ? 'Disponível (clique para pausar)' : 'Indisponível (clique para ativar)'}
    >
      <span className="sr-only">Disponibilidade do produto</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isAvailable ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
