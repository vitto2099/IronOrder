import type { HttpContext } from '@adonisjs/core/http'
import Table from '#models/table'
import { OrderEngineService } from '#services/order_engine_service'
import { batchOrderValidator } from '#validators/order_validator'

export default class ClientOrderController {
  async store({ params, request, response, session, tabMember }: HttpContext) {
    const tableNumber = Number(params.tableNumber)
    const table = await Table.findBy('number', tableNumber)

    if (!table) {
      return response.status(404).json({ error: 'Mesa não encontrada' })
    }

    if (!tabMember || !tabMember.tabId) {
      return response.status(401).json({ error: 'Sessão não identificada.' })
    }

    if (tabMember.status === 'BILL_REQUESTED' || tabMember.status === 'PAID') {
      const message =
        'Você solicitou o encerramento da sua conta. Novos pedidos não são permitidos para esta comanda.'
      session.flash('notification', { type: 'error', message })
      return response.status(422).json({ error: message })
    }

    if (table.status === 'LIVRE') {
      const message = 'Esta mesa não está ativa.'
      session.flash('notification', { type: 'error', message })
      return response.status(422).json({ error: message })
    }

    const payload = await request.validateUsing(batchOrderValidator)

    try {
      const orderEngine = new OrderEngineService()
      const order = await orderEngine.submitBatchOrder({
        tabId: tabMember.tabId,
        tabMemberId: tabMember.id,
        items: payload.items,
      })

      session.flash('notification', {
        type: 'success',
        message: 'Pedido enviado com sucesso para a cozinha!',
      })

      const isJson =
        request.accepts(['html', 'json']) === 'json' ||
        Boolean(request.header('accept')?.includes('application/json'))

      if (isJson) {
        return response.status(201).json({ success: true, order })
      }

      return response.redirect().toPath(`/m/${tableNumber}/statement`)
    } catch (error: any) {
      const status = error.status || 422
      session.flash('notification', {
        type: 'error',
        message: error.message || 'Erro ao processar pedido.',
      })

      const isJson =
        request.accepts(['html', 'json']) === 'json' ||
        Boolean(request.header('accept')?.includes('application/json'))

      if (isJson) {
        return response.status(status).json({ error: error.message })
      }

      return response.redirect().back()
    }
  }
}
