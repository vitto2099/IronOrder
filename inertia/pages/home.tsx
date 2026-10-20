import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'

export default function Home() {
  return (
    <>
      <Head title="Bem-vindo ao Qr-order" />
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 text-3xl font-bold shadow-inner">
            🍽️
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Bem-vindo ao Qr-order
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Sistema inteligente de pedidos por QR Code, gestão de salão e operação em tempo real.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
            >
              Acessar Painel do Colaborador
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
