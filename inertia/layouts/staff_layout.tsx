import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { Toaster, toast } from 'sonner'

export default function StaffLayout({ children }: PropsWithChildren) {
  const { flash, user } = usePage<any>().props

  useEffect(() => {
    if (flash?.notification) {
      if (flash.notification.type === 'error') {
        toast.error(flash.notification.message)
      } else {
        toast.success(flash.notification.message)
      }
    }
  }, [flash])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header Staff */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/hub" className="flex items-center gap-2 font-bold text-lg text-black">
              <span className="bg-black text-white px-2 py-0.5 rounded-lg text-sm">M+</span>
              <span>Painel Staff</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
              <Link
                href="/hub"
                className="px-3 py-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition"
              >
                Início
              </Link>
              <Link
                href="/admin/catalog"
                className="px-3 py-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition"
              >
                Cardápio & Catálogo
              </Link>
              <Link
                href="/staff/tables"
                className="px-3 py-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition"
              >
                Salão & Mesas
              </Link>
              <Link
                href="/kds"
                className="px-3 py-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition"
              >
                KDS Cozinha
              </Link>
              <Link
                href="/admin/tables"
                className="px-3 py-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition"
              >
                Mesas & QR Codes
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin/staff"
                  className="px-3 py-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition"
                >
                  Equipe / Staff
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {user.role}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {user.fullName || user.email}
                </span>
                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  className="text-xs text-red-600 hover:text-red-800 ml-2 font-medium"
                >
                  Sair
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <Toaster position="top-right" richColors />
    </div>
  )
}
