import type { FormEvent } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { Category, Product } from '~/types'

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  product?: Product | null
  defaultCategoryId?: number
}

export default function ProductFormModal({
  isOpen,
  onClose,
  categories,
  product,
  defaultCategoryId,
}: ProductFormModalProps) {
  if (!isOpen) return null

  return (
    <ProductFormModalContent
      key={product?.id ?? `new-${defaultCategoryId ?? 'none'}`}
      onClose={onClose}
      categories={categories}
      product={product}
      defaultCategoryId={defaultCategoryId}
    />
  )
}

function ProductFormModalContent({
  onClose,
  categories,
  product,
  defaultCategoryId,
}: {
  onClose: () => void
  categories: Category[]
  product?: Product | null
  defaultCategoryId?: number
}) {
  const [categoryId, setCategoryId] = useState<number | string>(
    product ? product.categoryId : defaultCategoryId || (categories[0]?.id ?? '')
  )
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState<number | string>(product ? product.price : '')
  const [description, setDescription] = useState(product?.description || '')
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '')
  const [tagsInput, setTagsInput] = useState(product?.tags ? product.tags.join(', ') : '')
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const payload = {
      categoryId: Number(categoryId),
      name,
      price: Number(price),
      description: description || null,
      imageUrl: imageUrl || null,
      tags: parsedTags.length > 0 ? parsedTags : null,
      isAvailable,
    }

    if (product?.id) {
      router.put(`/admin/catalog/products/${product.id}`, payload, {
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
    } else {
      router.post('/admin/catalog/products', payload, {
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Categoria
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm bg-white"
            >
              <option value="" disabled>
                Selecione uma categoria
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? `${c.emoji} ` : ''}
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Nome do Produto / Prato
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bruschetta ao Azeite"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="32.00"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
            {errors.imageUrl && <p className="text-xs text-red-600 mt-1">{errors.imageUrl}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Descrição do Prato
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes principais, preparo..."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Tags / Selos (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Vegano, Sem Glúten, Premium"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="product_is_available"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="rounded text-black focus:ring-black h-4 w-4"
            />
            <label htmlFor="product_is_available" className="text-sm font-medium text-gray-700">
              Produto Disponível para Pedidos
            </label>
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
              {loading ? 'Salvando...' : product ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
