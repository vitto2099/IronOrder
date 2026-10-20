import React, { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import StaffLayout from '../../../layouts/staff_layout'
import type { Table } from '../../../types'
import TableFormModal from '../../../components/admin/tables/table_form_modal'

interface TablesIndexProps {
  tables: Table[]
}

const TablesIndex: React.FC<TablesIndexProps> = ({ tables }) => {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filteredTables = useMemo(() => {
    if (!search.trim()) return tables
    return tables.filter((t) => String(t.number).includes(search.trim()))
  }, [tables, search])

  function handleDelete(table: Table) {
    if (table.status !== 'LIVRE') {
      alert(`A Mesa ${table.number} está ocupada e não pode ser excluída.`)
      return
    }

    if (!confirm(`Deseja realmente excluir a Mesa ${table.number}?`)) {
      return
    }

    setDeletingId(table.id)
    router.delete(`/admin/tables/${table.id}`, {
      preserveScroll: true,
      onFinish: () => setDeletingId(null),
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'LIVRE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            Livre
          </span>
        )
      case 'OCUPADA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Ocupada
          </span>
        )
      case 'CONTA_PEDIDA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Conta Pedida
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestão de Mesas</h1>
            <p className="text-sm text-gray-500 mt-1">
              Controle de infraestrutura física, capacidade e impressão de QR Codes para
              atendimento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/admin/tables/print"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-black text-gray-800 text-sm font-semibold rounded-xl shadow-sm transition hover:shadow"
            >
              <span>🖨️</span>
              <span>Imprimir Etiquetas A4</span>
            </a>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <span>+</span>
              <span>Cadastrar Mesa</span>
            </button>
          </div>
        </div>

        {/* Barra de Busca e Estatísticas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número da mesa..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 font-medium">
            <span>
              Total de Mesas: <strong className="text-black">{tables.length}</strong>
            </span>
            <span>
              Livres:{' '}
              <strong className="text-green-600">
                {tables.filter((t) => t.status === 'LIVRE').length}
              </strong>
            </span>
            <span>
              Ocupadas:{' '}
              <strong className="text-blue-600">
                {tables.filter((t) => t.status === 'OCUPADA').length}
              </strong>
            </span>
          </div>
        </div>

        {/* Tabela de Mesas */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Mesa</th>
                  <th className="px-6 py-4">Capacidade</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTables.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      Nenhuma mesa encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredTables.map((table) => (
                    <tr key={table.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-bold text-gray-900 text-base">
                        Mesa {table.number}
                      </td>
                      <td className="px-6 py-4 text-gray-700">👥 {table.capacity} lugares</td>
                      <td className="px-6 py-4">{getStatusBadge(table.status)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(table)}
                          disabled={deletingId === table.id || table.status !== 'LIVRE'}
                          title={
                            table.status !== 'LIVRE'
                              ? 'Mesa ocupada não pode ser excluída'
                              : 'Excluir mesa'
                          }
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition disabled:opacity-30 text-red-600 hover:bg-red-50"
                        >
                          {deletingId === table.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Cadastro de Mesas */}
        <TableFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </StaffLayout>
  )
}

export default TablesIndex
