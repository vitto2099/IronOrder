import React, { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import StaffLayout from '../../../layouts/staff_layout'
import type { Category, Product } from '../../../types'
import AvailabilitySwitch from '../../../components/admin/catalog/availability_switch'
import CategoryFormModal from '../../../components/admin/catalog/category_form_modal'
import ProductFormModal from '../../../components/admin/catalog/product_form_modal'

interface CatalogIndexProps {
  categories: Category[]
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const CatalogIndex: React.FC<CatalogIndexProps> = ({ categories }) => {
  const [search, setSearch] = useState('')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [defaultCatIdForProduct, setDefaultCatIdForProduct] = useState<number | undefined>()

  // Filtragem em tempo real
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories

    const term = search.toLowerCase()
    return categories
      .map((cat) => {
        const matchesCategory = cat.name.toLowerCase().includes(term)
        const filteredProducts = (cat.products || []).filter(
          (prod) =>
            prod.name.toLowerCase().includes(term) ||
            (prod.description && prod.description.toLowerCase().includes(term))
        )

        if (matchesCategory || filteredProducts.length > 0) {
          return {
            ...cat,
            products: matchesCategory ? cat.products : filteredProducts,
          }
        }
        return null
      })
      .filter(Boolean) as Category[]
  }, [categories, search])

  function handleOpenNewProduct(catId?: number) {
    setEditingProduct(null)
    setDefaultCatIdForProduct(catId)
    setProductModalOpen(true)
  }

  function handleEditProduct(prod: Product) {
    setEditingProduct(prod)
    setProductModalOpen(true)
  }

  function handleDeleteProduct(prod: Product) {
    if (confirm(`Tem certeza que deseja excluir o produto "${prod.name}"?`)) {
      router.delete(`/admin/catalog/products/${prod.id}`, {
        preserveScroll: true,
      })
    }
  }

  function handleOpenNewCategory() {
    setEditingCategory(null)
    setCategoryModalOpen(true)
  }

  function handleEditCategory(cat: Category) {
    setEditingCategory(cat)
    setCategoryModalOpen(true)
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Catálogo & Cardápio</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gerencie as categorias, itens comercializáveis e disponibilidade em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenNewCategory}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm"
            >
              <span>+</span> Nova Categoria
            </button>
            <button
              type="button"
              onClick={() => handleOpenNewProduct()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-sm"
            >
              <span>+</span> Novo Produto
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos por nome ou ingrediente..."
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 pl-11 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black shadow-sm"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" />
          </svg>
        </div>

        {/* Categories & Products list */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-gray-500 text-sm">Nenhum item ou categoria encontrado.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Category Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.emoji || '🍽️'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-gray-900">{category.name}</h2>
                        {!category.isActive && (
                          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Inativa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Ordem: {category.sortOrder} · {category.products?.length || 0} produto(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenNewProduct(category.id)}
                      className="text-xs font-medium text-gray-600 hover:text-black px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition"
                    >
                      + Item
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                      className="text-xs font-medium text-gray-600 hover:text-black px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition"
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {/* Products Table / Rows */}
                {!category.products || category.products.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    Nenhum produto cadastrado nesta categoria.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {category.products.map((prod) => (
                      <div
                        key={prod.id}
                        className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          !prod.isAvailable ? 'bg-gray-50/50 opacity-70' : 'hover:bg-gray-50/40'
                        }`}
                      >
                        {/* Info & Thumbnail */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback se a imagem falhar
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">Sem foto</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                                {prod.name}
                              </h3>
                              {prod.tags &&
                                prod.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                            {prod.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                {prod.description}
                              </p>
                            )}
                            <p className="text-sm font-bold text-gray-900 mt-1.5">
                              {formatPrice(prod.price)}
                            </p>
                          </div>
                        </div>

                        {/* Actions & Availability Switch */}
                        <div className="flex items-center gap-4 sm:justify-end flex-shrink-0">
                          <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
                            <span className="text-xs text-gray-500 hidden md:inline">
                              {prod.isAvailable ? 'Disponível' : 'Pausado'}
                            </span>
                            <AvailabilitySwitch
                              productId={prod.id}
                              isAvailable={prod.isAvailable}
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(prod)}
                              className="text-xs font-medium text-gray-700 hover:text-black px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modais */}
        <CategoryFormModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          category={editingCategory}
        />

        <ProductFormModal
          isOpen={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          categories={categories}
          product={editingProduct}
          defaultCategoryId={defaultCatIdForProduct}
        />
      </div>
    </StaffLayout>
  )
}

export default CatalogIndex
