import React from 'react'
import type { TableWithQr } from '../../../types'

interface TablesPrintProps {
  tables: TableWithQr[]
}

const TablesPrint: React.FC<TablesPrintProps> = ({ tables }) => {
  return (
    <div className="min-h-screen bg-gray-100 print:bg-white text-gray-900 font-sans antialiased p-4 print:p-0">
      {/* Barra Superior de Ações (Oculta na Impressão) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Impressão de Etiquetas A4 ({tables.length} {tables.length === 1 ? 'mesa' : 'mesas'})
          </h1>
          <p className="text-xs text-gray-500">
            Diagramado para padrão folha A4 com linhas de corte pontilhadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin/tables"
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            ← Voltar para Mesas
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-xl shadow transition flex items-center gap-2"
          >
            <span>🖨️</span>
            <span>Imprimir Folhas A4</span>
          </button>
        </div>
      </div>

      {/* Grade de Impressão A4 */}
      <div className="max-w-[210mm] mx-auto bg-white p-4 print:p-0 print:m-0 print:max-w-none shadow-md print:shadow-none">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2 gap-4 print:gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-between text-center bg-white print:break-inside-avoid min-h-[300px]"
            >
              {/* Logo / Header da Mesa */}
              <div className="w-full border-b border-gray-100 pb-3">
                <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-widest text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-black" />
                  <span>Mesa+ Cardápio Digital</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black tracking-tight text-black">
                    MESA {table.number}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="my-4 p-2 bg-white rounded-xl shadow-inner border border-gray-100">
                <img
                  src={table.qrCodeDataUrl}
                  alt={`QR Code da Mesa ${table.number}`}
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>

              {/* Instruções */}
              <div className="w-full pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  Aponte a câmera do seu celular para ver o cardápio e fazer seu pedido.
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-1 break-all">{table.url}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estilos Específicos para Impressão */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}

export default TablesPrint
