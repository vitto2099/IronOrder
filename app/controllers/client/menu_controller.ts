import type { HttpContext } from '@adonisjs/core/http'
import Table from '#models/table'
import { CatalogService } from '#services/catalog_service'

export default class ClientMenuController {
  async index({ params, request, response, inertia, tabMember }: HttpContext) {
    const tableNumber = Number(params.tableNumber)
    const table = await Table.findBy('number', tableNumber)

    if (!table) {
      return response.status(404).json({ error: 'Mesa não encontrada' })
    }

    const catalogService = new CatalogService()
    const categories = await catalogService.getCatalogTree({ onlyAvailable: true })

    const member = tabMember
      ? {
          id: tabMember.id,
          alias: tabMember.alias,
        }
      : { id: 0, alias: 'Visitante' }

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    const payload = {
      tableNumber,
      member,
      tabMember: member,
      categories: categories.map((c) => c.serialize()) as any,
      tableStatus: table.status,
    }

    if (isJson) {
      return response.json(payload)
    }

    return (inertia as any).render('client/menu', payload)
  }
}
