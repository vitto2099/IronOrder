import type { FC, FormEvent } from 'react'
import { useForm, usePage } from '@inertiajs/react'

interface WelcomeProps {
  tableNumber: number
  tableStatus: string
  isBlocked: boolean
}

const Welcome: FC<WelcomeProps> = ({ tableNumber, isBlocked }) => {
  const { flash } = usePage<{ flash?: { notification?: { type: string; message: string } } }>()
    .props

  const { data, setData, post, processing, errors } = useForm({
    alias: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isBlocked || processing) return

    post(`/m/${tableNumber}/join`)
  }

  return (
    <main className="min-h-screen bg-[#F6F6F6] text-gray-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Topo / Marca */}
      <header className="w-full max-w-md mx-auto pt-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-2xl shadow-md mb-2">
          M+
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-800">QR-Order</h1>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
          Atendimento Digital
        </p>
      </header>

      {/* Card Principal */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 my-auto">
        {/* Identificação da Mesa */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 font-extrabold text-sm tracking-wide border border-amber-200/60">
            Mesa {tableNumber}
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-3">Boas-vindas!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Faça seus pedidos e acompanhe sua comanda diretamente do seu celular.
          </p>
        </div>

        {/* Notificação Flash */}
        {flash?.notification && (
          <div
            className={`p-3.5 rounded-xl text-sm font-medium mb-5 ${
              flash.notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-100'
                : 'bg-amber-50 text-amber-800 border border-amber-100'
            }`}
          >
            {flash.notification.message}
          </div>
        )}

        {/* Alerta de Mesa Bloqueada / Conta Pedida */}
        {isBlocked ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <div className="text-amber-700 font-semibold text-sm mb-1">⚠️ Mesa em Fechamento</div>
            <p className="text-xs text-amber-600 leading-relaxed">
              Esta mesa está em processo de fechamento de conta. Peça ao garçom caso deseje reabrir
              para novos pedidos.
            </p>
          </div>
        ) : (
          /* Formulário Zero-Auth */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="alias"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
              >
                Como quer ser chamado na comanda?
              </label>
              <input
                id="alias"
                type="text"
                value={data.alias}
                onChange={(e) => setData('alias', e.target.value)}
                placeholder="Ex: Carlos, Ana..."
                maxLength={30}
                autoFocus
                disabled={processing}
                className={`w-full px-4 py-3.5 rounded-xl border text-base font-medium transition focus:outline-none focus:ring-2 ${
                  errors.alias
                    ? 'border-red-400 focus:ring-red-200 text-red-900 bg-red-50/30'
                    : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200/50 bg-gray-50/50'
                }`}
              />
              {errors.alias && (
                <p className="text-xs text-red-600 font-medium mt-1.5">{errors.alias}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-1.5">
                Não precisa de senha ou cadastro. Usamos seu nome apenas para separar seu consumo.
              </p>
            </div>

            <button
              type="submit"
              disabled={processing || !data.alias.trim()}
              className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-white font-bold text-base shadow-sm transition flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Entrando na Mesa...</span>
                </>
              ) : (
                <span>Ver Cardápio & Fazer Pedido</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Rodapé */}
      <footer className="w-full max-w-md mx-auto text-center pb-4 text-xs text-gray-400 font-medium">
        Zero-Auth • Sem senhas, rápido e seguro
      </footer>
    </main>
  )
}

export default Welcome
