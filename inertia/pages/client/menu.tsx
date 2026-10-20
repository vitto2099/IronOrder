import type { FC } from 'react'
import { useState, useMemo, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'

export interface MenuItem {
  id: number
  categoryId: number
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  tags?: string[] | null
  isAvailable: boolean
}

export interface MenuCategory {
  id: number
  name: string
  slug: string
  emoji?: string | null
  sortOrder: number
  products: MenuItem[]
}

export interface CartItem {
  item: MenuItem
  quantity: number
  notes?: string
}

interface MenuProps {
  tableNumber: number
  member?: {
    id: number
    alias: string
  }
  tabMember?: {
    id: number
    alias: string
  }
  categories: MenuCategory[]
  tableStatus?: string
}

function formatPrice(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0)
}

const ClientMenu: FC<MenuProps> = ({
  tableNumber,
  member,
  tabMember,
  categories = [],
  tableStatus,
}) => {
  const currentMember = tabMember || member
  const { flash } = usePage<{ flash?: { notification?: { type: string; message: string } } }>()
    .props

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalNotes, setModalNotes] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bloqueio de novos pedidos se conta foi pedida
  const isBlocked = tableStatus === 'CONTA_PEDIDA' || tableStatus === 'BILL_REQUESTED'

  // Impede scroll do fundo quando modal aberto
  useEffect(() => {
    if (selectedItem || cartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [selectedItem, cartOpen])

  // Filtragem de categorias e pratos
  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase()

    return categories
      .map((cat) => {
        if (
          activeCategory !== 'ALL' &&
          String(cat.id) !== activeCategory &&
          cat.slug !== activeCategory
        ) {
          return null
        }

        const filteredProducts = (cat.products || []).filter((p) => {
          if (!p.isAvailable) return false
          if (!term) return true
          return (
            p.name.toLowerCase().includes(term) ||
            (p.description && p.description.toLowerCase().includes(term))
          )
        })

        if (filteredProducts.length === 0) return null

        return {
          ...cat,
          products: filteredProducts,
        }
      })
      .filter(Boolean) as MenuCategory[]
  }, [categories, activeCategory, search])

  // Contadores do carrinho
  const cartCount = useMemo(() => {
    return cart.reduce((acc, ci) => acc + ci.quantity, 0)
  }, [cart])

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0)
  }, [cart])

  function handleOpenItem(item: MenuItem) {
    setSelectedItem(item)
    setModalQuantity(1)
    setModalNotes('')
  }

  function handleAddToCartFromModal() {
    if (!selectedItem) return

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.item.id === selectedItem.id && ci.notes === modalNotes.trim()
      )

      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx].quantity += modalQuantity
        return updated
      }

      return [
        ...prev,
        {
          item: selectedItem,
          quantity: modalQuantity,
          notes: modalNotes.trim() || undefined,
        },
      ]
    })

    setSelectedItem(null)
  }

  function handleQuickAdd(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id && !ci.notes)
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id && !ci.notes ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  function handleDecrementCartItem(index: number) {
    setCart((prev) => {
      const target = prev[index]
      if (!target) return prev

      if (target.quantity <= 1) {
        return prev.filter((_, idx) => idx !== index)
      }

      return prev.map((ci, idx) => (idx === index ? { ...ci, quantity: ci.quantity - 1 } : ci))
    })
  }

  function handleIncrementCartItem(index: number) {
    setCart((prev) =>
      prev.map((ci, idx) => (idx === index ? { ...ci, quantity: ci.quantity + 1 } : ci))
    )
  }

  function handleSubmitOrder() {
    if (cart.length === 0 || isSubmitting || isBlocked) return

    setIsSubmitting(true)

    const payload = {
      items: cart.map((ci) => ({
        productId: ci.item.id,
        quantity: ci.quantity,
        notes: ci.notes,
      })),
    }

    router.post(`/m/${tableNumber}/orders`, payload, {
      onSuccess: () => {
        setCart([])
        setCartOpen(false)
        setIsSubmitting(false)
      },
      onError: () => {
        setIsSubmitting(false)
      },
    })
  }

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto flex flex-col bg-[#F6F6F6] text-gray-900 font-sans shadow-xl">
      {/* Topo / Header */}
      <header className="bg-white px-5 pt-6 pb-4 flex-shrink-0 border-b border-gray-100 sticky top-0 z-20 shadow-xs">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-950">
              Cardápio - Mesa {tableNumber}
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Atendimento Digital</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Mesa {tableNumber}
            </span>
            <Link
              href={`/m/${tableNumber}/tab`}
              className="text-xs font-bold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
            >
              Extrato
            </Link>
          </div>
        </div>

        {currentMember && (
          <p className="text-xs text-gray-600 font-medium">
            Conectado como: <strong className="text-black font-bold">{currentMember.alias}</strong>{' '}
            👋
          </p>
        )}
      </header>

      {/* Banner de Notificação */}
      {flash?.notification && (
        <div
          className={`mx-4 mt-4 p-3.5 rounded-2xl text-xs font-semibold shadow-xs ${
            flash.notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {flash.notification.message}
        </div>
      )}

      {/* Alerta de Mesa em Fechamento */}
      {isBlocked && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-amber-800 font-bold text-xs mb-0.5">⚠️ Mesa em Fechamento</div>
          <p className="text-[11px] text-amber-700">
            Novos pedidos estão temporariamente pausados.
          </p>
        </div>
      )}

      {/* Barra de Busca */}
      <div className="bg-white px-5 py-3 flex-shrink-0 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar no cardápio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F6F6F6] text-black placeholder-gray-400 text-sm pl-9 pr-8 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-black"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Carrossel de Categorias */}
      <div className="bg-white flex-shrink-0 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto px-5 py-3 scroll-smooth no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === 'ALL'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ✦ Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(String(cat.id))}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === String(cat.id) || activeCategory === cat.slug
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.emoji ? `${cat.emoji} ` : ''}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Listagem de Pratos por Categoria */}
      <main className="flex-1 overflow-y-auto pb-32 p-4 space-y-6">
        {filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <span className="text-3xl block mb-2">🍽️</span>
            <p className="text-sm font-semibold text-gray-700">Nenhum item encontrado</p>
            <p className="text-xs text-gray-400 mt-1">Tente outra busca ou categoria.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-gray-500 flex items-center gap-1.5">
                {cat.emoji && <span>{cat.emoji}</span>}
                <span>{cat.name}</span>
              </h2>

              <div className="space-y-3">
                {cat.products.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-gray-300 transition"
                  >
                    <div className="flex-1 min-w-0">
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mb-1">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="text-sm font-bold text-gray-900 leading-snug">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <span className="text-sm font-black text-gray-950 mt-2 block">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickAdd(item)
                      }}
                      className="w-9 h-9 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center font-bold text-base shadow-sm transition flex-shrink-0"
                      title="Adicionar rápido"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Barra Flutuante do Carrinho */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-30 pointer-events-none">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="pointer-events-auto w-full bg-black hover:bg-gray-900 text-white flex items-center justify-between px-5 py-4 rounded-2xl shadow-xl transition"
          >
            <div className="flex items-center gap-3">
              <span className="bg-amber-400 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
              <span className="text-sm font-bold">Ver pedido</span>
            </div>
            <span className="text-sm font-black text-amber-300">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* ItemModal (Modal de Detalhe e Personalização do Prato) */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative bg-white rounded-t-3xl overflow-hidden flex flex-col max-h-[90%] max-w-md w-full mx-auto p-6 space-y-4 animate-in slide-in-from-bottom duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-950">{selectedItem.name}</h2>
                <span className="text-base font-black text-amber-600 block mt-0.5">
                  {formatPrice(selectedItem.price)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {selectedItem.description && (
              <p className="text-xs text-gray-600 leading-relaxed">{selectedItem.description}</p>
            )}

            <div>
              <label
                htmlFor="modalNotes"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Observações para a cozinha
              </label>
              <textarea
                id="modalNotes"
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Ex: Sem cebola, molho à parte, bem passado..."
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm shadow-xs"
                >
                  −
                </button>
                <span className="text-sm font-black w-4 text-center">{modalQuantity}</span>
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => q + 1)}
                  className="w-6 h-6 rounded-full bg-black text-white font-bold flex items-center justify-center text-sm shadow-xs"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCartFromModal}
                className="flex-1 py-3 px-4 rounded-xl bg-black hover:bg-gray-900 text-white font-black text-sm shadow transition flex items-center justify-between"
              >
                <span>Adicionar ao pedido</span>
                <span>{formatPrice(selectedItem.price * modalQuantity)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CartModal (Drawer do Carrinho de Pedidos) */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="relative bg-white rounded-t-3xl overflow-hidden flex flex-col max-h-[85%] max-w-md w-full mx-auto p-6 space-y-4 animate-in slide-in-from-bottom duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-950">Seu Pedido</h2>
                <span className="text-xs text-gray-500">Mesa {tableNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-60 divide-y divide-gray-100">
              {cart.map((ci, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">{ci.item.name}</h4>
                    {ci.notes && (
                      <p className="text-[11px] text-amber-700 font-medium italic mt-0.5">
                        Obs: {ci.notes}
                      </p>
                    )}
                    <span className="text-xs font-semibold text-gray-600 block mt-1">
                      {formatPrice(ci.item.price * ci.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecrementCartItem(idx)}
                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 font-bold flex items-center justify-center text-xs"
                    >
                      −
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{ci.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleIncrementCartItem(idx)}
                      className="w-6 h-6 rounded-full bg-black text-white font-bold flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <div className="flex items-center justify-between text-sm font-black text-gray-900">
                <span>Total do Pedido:</span>
                <span className="text-lg text-amber-600">{formatPrice(cartTotal)}</span>
              </div>

              <button
                type="button"
                disabled={isSubmitting || isBlocked || cart.length === 0}
                onClick={handleSubmitOrder}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-sm shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Enviando para a cozinha...' : 'Enviar pedido para a cozinha 🍳'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientMenu
