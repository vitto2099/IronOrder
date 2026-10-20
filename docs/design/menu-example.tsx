import { useState, useRef, useEffect } from 'react'

type Category = {
  id: string
  label: string
  emoji: string
}

type MenuItem = {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  image: string
  tags?: string[]
}

type CartItem = {
  item: MenuItem
  quantity: number
}

const CATEGORIES: Category[] = [
  { id: 'all', label: 'Todos', emoji: '✦' },
  { id: 'entradas', label: 'Entradas', emoji: '🥗' },
  { id: 'principais', label: 'Principais', emoji: '🍽' },
  { id: 'sobremesas', label: 'Sobremesas', emoji: '🍫' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🍷' },
]

const MENU: MenuItem[] = [
  {
    id: 'e1',
    categoryId: 'entradas',
    name: 'Bruschetta ao Azeite',
    description:
      'Pão artesanal grelhado com tomate concassé, manjericão fresco e azeite extravirgem siciliano.',
    price: 32,
    image:
      'https://images.unsplash.com/photo-1594978583693-8dfdfc93f052?w=600&h=400&fit=crop&auto=format',
    tags: ['Vegano'],
  },
  {
    id: 'e2',
    categoryId: 'entradas',
    name: 'Tartare de Atum',
    description:
      'Atum bluefin marinado em shoyu cítrico, caviar de limão e crocante de arroz negro.',
    price: 68,
    image:
      'https://images.unsplash.com/photo-1660230687259-ab2821e7480c?w=600&h=400&fit=crop&auto=format',
    tags: ['Sem Glúten'],
  },
  {
    id: 'e3',
    categoryId: 'entradas',
    name: 'Ostras Frescas',
    description:
      'Seis ostras da costa catarinense com granita de pepino e mignonette de champagne.',
    price: 89,
    image:
      'https://images.unsplash.com/photo-1779918262062-76030c8cbbff?w=600&h=400&fit=crop&auto=format',
    tags: ['Sem Glúten', 'Mar'],
  },
  {
    id: 'p1',
    categoryId: 'principais',
    name: 'Filé ao Molho Trufado',
    description:
      'Corte prime de 280g, molho de trufa negra, purê de raiz-forte e aspargos grelhados.',
    price: 148,
    image:
      'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=600&h=400&fit=crop&auto=format',
    tags: ['Sem Glúten', 'Premium'],
  },
  {
    id: 'p2',
    categoryId: 'principais',
    name: 'Frango ao Risoto Verde',
    description:
      'Frango empanado crocante sobre risoto de ervas, espinafre e molho de limão siciliano.',
    price: 92,
    image:
      'https://images.unsplash.com/photo-1784203648814-48943de470c1?w=600&h=400&fit=crop&auto=format',
  },
  {
    id: 'p3',
    categoryId: 'principais',
    name: 'Robalo com Aspargos',
    description: 'Filé de robalo pele crocante, caldo de alho-poró, brotos e espuma de limão thai.',
    price: 118,
    image:
      'https://images.unsplash.com/photo-1782821961510-aa2b6baed210?w=600&h=400&fit=crop&auto=format',
    tags: ['Sem Glúten', 'Peixe'],
  },
  {
    id: 'p4',
    categoryId: 'principais',
    name: 'Aspargos com Molho Verde',
    description:
      'Aspargos brancos e verdes grelhados com pesto de pistache, ovo 63°C e parmesão envelhecido.',
    price: 78,
    image:
      'https://images.unsplash.com/photo-1777897466887-9533bf582828?w=600&h=400&fit=crop&auto=format',
    tags: ['Vegetariano'],
  },
  {
    id: 's1',
    categoryId: 'sobremesas',
    name: 'Bolo de Chocolate',
    description: 'Bolo úmido de chocolate 70% com ganache morna e sorvete de baunilha bourbon.',
    price: 42,
    image:
      'https://images.unsplash.com/photo-1682596044365-eb5c3bc51555?w=600&h=400&fit=crop&auto=format',
  },
  {
    id: 's2',
    categoryId: 'sobremesas',
    name: 'Tarte de Maçã',
    description: 'Tarte fina com maçã caramelizada, creme de amêndoa e sorvete de canela.',
    price: 38,
    image:
      'https://images.unsplash.com/photo-1643733645069-76bac4462103?w=600&h=400&fit=crop&auto=format',
  },
  {
    id: 'b1',
    categoryId: 'bebidas',
    name: 'Negroni Clássico',
    description: 'Gin London Dry, Campari e vermute rosso, servido com casca de laranja flamejada.',
    price: 36,
    image:
      'https://images.unsplash.com/photo-1500217052183-bc01eee1a74e?w=600&h=400&fit=crop&auto=format',
  },
  {
    id: 'b2',
    categoryId: 'bebidas',
    name: 'Spritz Rosé',
    description: 'Aperol, prosecco brut, espumante rosé e limão siciliano com fatia de toranja.',
    price: 28,
    image:
      'https://images.unsplash.com/photo-1605270012917-bf157c5a9541?w=600&h=400&fit=crop&auto=format',
  },
  {
    id: 'b3',
    categoryId: 'bebidas',
    name: 'Martini Dry',
    description:
      'Gin premium com vermute seco, azeitona recheada de limão e twist de limão siciliano.',
    price: 38,
    image:
      'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?w=600&h=400&fit=crop&auto=format',
  },
]

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  const filtered = MENU.filter((item) => {
    const matchCat = activeCategory === 'all' || item.categoryId === activeCategory
    const matchSearch =
      search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = CATEGORIES.filter((c) => c.id !== 'all')
    .map((cat) => ({
      category: cat,
      items: filtered.filter((i) => i.categoryId === cat.id),
    }))
    .filter((g) => g.items.length > 0)

  const cartTotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0)
  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0)

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id)
      if (existing)
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      return [...prev, { item, quantity: 1 }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === itemId)
      if (!existing) return prev
      if (existing.quantity === 1) return prev.filter((ci) => ci.item.id !== itemId)
      return prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci))
    })
  }

  function getQty(itemId: string) {
    return cart.find((ci) => ci.item.id === itemId)?.quantity ?? 0
  }

  useEffect(() => {
    if (selectedItem || cartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [selectedItem, cartOpen])

  return (
    <div className="relative h-full w-full max-w-md mx-auto flex flex-col bg-[#F6F6F6] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight leading-tight text-black">Mesa+</h1>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5 tracking-wide uppercase font-medium">
              Restaurante Bê
            </p>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest font-medium">
              Mesa
            </div>
            <div className="text-[22px] font-bold text-black leading-tight">12</div>
          </div>
        </div>
        <p className="text-[13px] text-[#6B6B6B]">
          Olá, <span className="text-black font-medium">Lucas</span> 👋
        </p>
      </div>

      {/* Search */}
      <div className="bg-white px-5 pb-4 flex-shrink-0">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar no cardápio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F6F6F6] text-black placeholder-[#6B6B6B] text-[14px] pl-10 pr-4 py-3 rounded-xl outline-none font-normal"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white flex-shrink-0 border-b border-[#E8E8E8]">
        <div ref={catRef} className="flex gap-2 overflow-x-auto px-5 pb-4 scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                activeCategory === cat.id ? 'bg-black text-white' : 'bg-[#F6F6F6] text-[#6B6B6B]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu list */}
      <div className="flex-1 overflow-y-auto pb-28">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 text-center px-8">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-[15px] font-medium text-black">Nenhum item encontrado</p>
            <p className="text-[13px] text-[#6B6B6B] mt-1">Tente outro termo ou categoria</p>
          </div>
        )}

        {grouped.map(({ category, items }) => (
          <div key={category.id}>
            <div className="px-5 pt-7 pb-3">
              <h2 className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[#6B6B6B]">
                {category.label}
              </h2>
            </div>
            <div className="flex flex-col gap-0">
              {items.map((item, idx) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  qty={getQty(item.id)}
                  onOpen={() => setSelectedItem(item)}
                  onAdd={() => addToCart(item)}
                  isLast={idx === items.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-gradient-to-t from-[#F6F6F6] via-[#F6F6F6] to-transparent pointer-events-none">
          <button
            onClick={() => setCartOpen(true)}
            className="pointer-events-auto w-full bg-black text-white flex items-center justify-between px-5 py-4 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white text-black text-[12px] font-bold w-6 h-6 rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
              <span className="text-[15px] font-semibold">Ver pedido</span>
            </div>
            <span className="text-[15px] font-semibold">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Product detail modal */}
      {selectedItem && (
        <ProductModal
          item={selectedItem}
          qty={getQty(selectedItem.id)}
          onClose={() => setSelectedItem(null)}
          onAdd={() => addToCart(selectedItem)}
          onRemove={() => removeFromCart(selectedItem.id)}
        />
      )}

      {/* Cart modal */}
      {cartOpen && (
        <CartModal
          cart={cart}
          onClose={() => setCartOpen(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
          total={cartTotal}
        />
      )}
    </div>
  )
}

function MenuCard({
  item,
  qty,
  onOpen,
  onAdd,
  isLast,
}: {
  item: MenuItem
  qty: number
  onOpen: () => void
  onAdd: () => void
  isLast: boolean
}) {
  return (
    <div className={`bg-white mx-0 ${!isLast ? 'border-b border-[#F0F0F0]' : ''}`}>
      <button
        onClick={onOpen}
        className="w-full flex items-start gap-4 px-5 py-4 text-left active:bg-[#F6F6F6] transition-colors"
      >
        <div className="flex-1 min-w-0 pt-0.5">
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1.5 mb-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6B6B] bg-[#F0F0F0] px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-[15px] font-semibold text-black leading-snug">{item.name}</p>
          <p className="text-[13px] text-[#6B6B6B] mt-1 leading-snug line-clamp-2">
            {item.description}
          </p>
          <p className="text-[15px] font-bold text-black mt-2">{formatPrice(item.price)}</p>
        </div>
        <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-[#F0F0F0]">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-black text-white rounded-full flex items-center justify-center shadow-md"
          >
            {qty > 0 ? (
              <span className="text-[12px] font-bold">{qty}</span>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        </div>
      </button>
    </div>
  )
}

function ProductModal({
  item,
  qty,
  onClose,
  onAdd,
  onRemove,
}: {
  item: MenuItem
  qty: number
  onClose: () => void
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl overflow-hidden flex flex-col max-h-[90%]">
        <div className="relative w-full h-64 bg-[#F0F0F0] flex-shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1.5 mb-3">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6B6B] bg-[#F0F0F0] px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-[22px] font-bold text-black leading-tight">{item.name}</h2>
          <p className="text-[15px] text-[#6B6B6B] mt-2 leading-relaxed">{item.description}</p>
          <p className="text-[22px] font-bold text-black mt-4">{formatPrice(item.price)}</p>
        </div>

        <div className="px-5 pb-10 pt-3 bg-white border-t border-[#F0F0F0] flex-shrink-0">
          {qty === 0 ? (
            <button
              onClick={onAdd}
              className="w-full bg-black text-white py-4 rounded-2xl text-[15px] font-semibold"
            >
              Adicionar ao pedido
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 bg-[#F6F6F6] rounded-2xl px-5 py-3">
                <button
                  onClick={onRemove}
                  className="text-black text-xl font-light w-7 h-7 flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-[17px] font-bold text-black min-w-[20px] text-center">
                  {qty}
                </span>
                <button
                  onClick={onAdd}
                  className="text-black text-xl font-light w-7 h-7 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <div className="flex-1 bg-black text-white py-4 rounded-2xl text-[15px] font-semibold text-center">
                {formatPrice(item.price * qty)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CartModal({
  cart,
  onClose,
  onAdd,
  onRemove,
  total,
}: {
  cart: CartItem[]
  onClose: () => void
  onAdd: (item: MenuItem) => void
  onRemove: (id: string) => void
  total: number
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl overflow-hidden flex flex-col max-h-[85%]">
        <div className="px-5 pt-6 pb-4 border-b border-[#F0F0F0] flex-shrink-0 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-black">Seu pedido</h2>
          <button onClick={onClose} className="text-[#6B6B6B]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-2">
          {cart.map(({ item, quantity }) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-4 border-b border-[#F0F0F0] last:border-0"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F0F0F0] flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-black leading-snug">{item.name}</p>
                <p className="text-[13px] text-[#6B6B6B] mt-0.5">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onRemove(item.id)}
                  className="w-7 h-7 rounded-full bg-[#F0F0F0] flex items-center justify-center text-black text-base font-light"
                >
                  −
                </button>
                <span className="text-[14px] font-bold text-black w-5 text-center">{quantity}</span>
                <button
                  onClick={() => onAdd(item)}
                  className="w-7 h-7 rounded-full bg-black flex items-center justify-center"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pt-4 pb-10 border-t border-[#F0F0F0] flex-shrink-0 bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-[#6B6B6B]">Total do pedido</span>
            <span className="text-[18px] font-bold text-black">{formatPrice(total)}</span>
          </div>
          <button className="w-full bg-black text-white py-4 rounded-2xl text-[15px] font-semibold">
            Enviar pedido para a cozinha
          </button>
          <p className="text-[11px] text-[#6B6B6B] text-center mt-3">
            Mesa 12 · Lucas · Restaurante Bê
          </p>
        </div>
      </div>
    </div>
  )
}
