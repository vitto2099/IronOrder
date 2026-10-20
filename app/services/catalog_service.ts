import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Category from '#models/category'
import Product from '#models/product'

export interface UpsertCategoryDTO {
  id?: number
  name: string
  slug?: string
  emoji?: string | null
  sortOrder?: number
  isActive?: boolean
}

export interface UpsertProductDTO {
  id?: number
  categoryId: number
  name: string
  slug?: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isAvailable?: boolean
  tags?: string[] | null
}

export interface DeleteProductResult {
  deleted: boolean
  soft: boolean
  product: Product
}

export class CatalogService {
  /**
   * Cria ou edita categoria temática com slug automático
   */
  async upsertCategory(payload: UpsertCategoryDTO): Promise<Category> {
    const slug = payload.slug || string.slug(payload.name).toLowerCase()

    if (payload.id) {
      const category = await Category.findOrFail(payload.id)
      category.merge({
        name: payload.name,
        slug,
        emoji: payload.emoji !== undefined ? payload.emoji : category.emoji,
        sortOrder: payload.sortOrder !== undefined ? payload.sortOrder : category.sortOrder,
        isActive: payload.isActive !== undefined ? payload.isActive : category.isActive,
      })
      await category.save()
      return category
    }

    return await Category.create({
      name: payload.name,
      slug,
      emoji: payload.emoji ?? null,
      sortOrder: payload.sortOrder ?? 0,
      isActive: payload.isActive ?? true,
    })
  }

  /**
   * Cria ou edita produto com validação de unicidade de nome por categoria e slug automático
   */
  async upsertProduct(payload: UpsertProductDTO): Promise<Product> {
    const duplicateQuery = Product.query()
      .where('category_id', payload.categoryId)
      .where('name', payload.name)
      .whereNull('deleted_at')

    if (payload.id) {
      duplicateQuery.whereNot('id', payload.id)
    }

    const duplicate = await duplicateQuery.first()
    if (duplicate) {
      throw new Error(
        `Product "${payload.name}" already exists in category ID ${payload.categoryId}`
      )
    }

    const slug = payload.slug || string.slug(payload.name).toLowerCase()

    if (payload.id) {
      const product = await Product.findOrFail(payload.id)
      product.merge({
        categoryId: payload.categoryId,
        name: payload.name,
        slug,
        description: payload.description !== undefined ? payload.description : product.description,
        price: payload.price !== undefined ? payload.price : product.price,
        imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : product.imageUrl,
        isAvailable: payload.isAvailable !== undefined ? payload.isAvailable : product.isAvailable,
        tags: payload.tags !== undefined ? payload.tags : product.tags,
      })
      await product.save()
      return product
    }

    return await Product.create({
      categoryId: payload.categoryId,
      name: payload.name,
      slug,
      description: payload.description ?? null,
      price: payload.price,
      imageUrl: payload.imageUrl ?? null,
      isAvailable: payload.isAvailable ?? true,
      tags: payload.tags ?? null,
    })
  }

  /**
   * Retorna a árvore hierárquica do catálogo de categorias e seus produtos
   */
  async getCatalogTree(options?: { onlyAvailable?: boolean }): Promise<Category[]> {
    const onlyAvailable = options?.onlyAvailable ?? false

    const query = Category.query().orderBy('sort_order', 'asc')

    if (onlyAvailable) {
      query.withScopes((scopes) => scopes.active())
      query.preload('products', (productQuery) => {
        productQuery.withScopes((scopes) => scopes.available()).orderBy('id', 'asc')
      })
    } else {
      query.preload('products', (productQuery) => {
        productQuery.whereNull('deleted_at').orderBy('id', 'asc')
      })
    }

    return await query.exec()
  }

  /**
   * Atualização atômica do status de disponibilidade de um produto
   */
  async updateProductAvailability(productId: number, isAvailable: boolean): Promise<Product> {
    const product = await Product.findOrFail(productId)
    product.isAvailable = isAvailable
    await product.save()
    return product
  }

  /**
   * Alternância rápida (toggle) de disponibilidade do produto
   */
  async toggleAvailability(productId: number): Promise<Product> {
    const product = await Product.findOrFail(productId)
    product.isAvailable = !product.isAvailable
    await product.save()
    return product
  }

  /**
   * Exclusão segura: se o produto possui pedidos (order_items), aplica soft-delete;
   * caso contrário, realiza exclusão física (hard-delete).
   */
  async deleteProduct(productId: number): Promise<DeleteProductResult> {
    const product = await Product.findOrFail(productId)

    const hasOrderItems = await db.connection().schema.hasTable('order_items')
    let hasOrders = false

    if (hasOrderItems) {
      const orderItem = await db.from('order_items').where('product_id', productId).first()
      hasOrders = Boolean(orderItem)
    }

    if (hasOrders) {
      product.deletedAt = DateTime.now()
      await product.save()
      return { deleted: true, soft: true, product }
    }

    await product.delete()
    return { deleted: true, soft: false, product }
  }
}
