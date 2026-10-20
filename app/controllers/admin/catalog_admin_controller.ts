import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { CatalogService } from '#services/catalog_service'
import { upsertCategoryValidator } from '#validators/category_validator'
import { upsertProductValidator, updateAvailabilityValidator } from '#validators/product_validator'

@inject()
export default class CatalogAdminController {
  constructor(protected catalogService: CatalogService) {}

  private isJsonRequest(request: HttpContext['request']): boolean {
    return (
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))
    )
  }

  /**
   * Renderiza a listagem completa do catálogo para administração
   */
  async index({ inertia }: HttpContext) {
    const categories = await this.catalogService.getCatalogTree({ onlyAvailable: false })
    return (inertia as any).render('admin/catalog/index', {
      categories: categories.map((c) => c.serialize()),
    })
  }

  /**
   * Criação de nova categoria
   */
  async storeCategory({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(upsertCategoryValidator)
    const category = await this.catalogService.upsertCategory(payload)

    session?.flash('notification', {
      type: 'success',
      message: `Categoria "${category.name}" criada com sucesso.`,
    })

    if (this.isJsonRequest(request)) {
      return response.status(201).json(category)
    }

    return response.redirect().toPath('/admin/catalog')
  }

  /**
   * Atualização de categoria existente
   */
  async updateCategory({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(upsertCategoryValidator)
    const category = await this.catalogService.upsertCategory({
      ...payload,
      id: Number(params.id),
    })

    session?.flash('notification', {
      type: 'success',
      message: `Categoria "${category.name}" atualizada com sucesso.`,
    })

    if (this.isJsonRequest(request)) {
      return response.json(category)
    }

    return response.redirect().toPath('/admin/catalog')
  }

  /**
   * Criação de novo produto
   */
  async storeProduct({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(upsertProductValidator)
    const product = await this.catalogService.upsertProduct(payload)

    session?.flash('notification', {
      type: 'success',
      message: `Produto "${product.name}" criado com sucesso.`,
    })

    if (this.isJsonRequest(request)) {
      return response.status(201).json(product)
    }

    return response.redirect().toPath('/admin/catalog')
  }

  /**
   * Atualização de produto existente
   */
  async updateProduct({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(upsertProductValidator)
    const product = await this.catalogService.upsertProduct({
      ...payload,
      id: Number(params.id),
    })

    session?.flash('notification', {
      type: 'success',
      message: `Produto "${product.name}" atualizado com sucesso.`,
    })

    if (this.isJsonRequest(request)) {
      return response.json(product)
    }

    return response.redirect().toPath('/admin/catalog')
  }

  /**
   * Toggle rápido ou atualização de disponibilidade de um produto
   */
  async toggleAvailability({ params, request, response, session }: HttpContext) {
    let isAvailable: boolean

    const body = request.body()
    if (body && typeof body.isAvailable === 'boolean') {
      const payload = await request.validateUsing(updateAvailabilityValidator)
      isAvailable = payload.isAvailable
    } else {
      const product = await this.catalogService.toggleAvailability(Number(params.id))
      isAvailable = product.isAvailable
    }

    const updatedProduct = await this.catalogService.updateProductAvailability(
      Number(params.id),
      isAvailable
    )

    session?.flash('notification', {
      type: 'success',
      message: `Disponibilidade de "${updatedProduct.name}" alterada para ${isAvailable ? 'Disponível' : 'Indisponível'}.`,
    })

    if (this.isJsonRequest(request)) {
      return response.json(updatedProduct)
    }

    return response.redirect().back()
  }

  /**
   * Exclusão segura de produto
   */
  async destroyProduct({ params, request, response, session }: HttpContext) {
    const result = await this.catalogService.deleteProduct(Number(params.id))

    session?.flash('notification', {
      type: 'success',
      message: result.soft
        ? 'Produto arquivado (possui histórico em pedidos).'
        : 'Produto excluído permanentemente.',
    })

    if (this.isJsonRequest(request)) {
      return response.json(result)
    }

    return response.redirect().back()
  }
}
