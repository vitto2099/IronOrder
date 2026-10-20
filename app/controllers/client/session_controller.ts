import type { HttpContext } from '@adonisjs/core/http'
import Table from '#models/table'
import TabMember from '#models/tab_member'
import TabSessionService from '#services/tab_session_service'
import { joinTableValidator } from '#validators/client_session'

export default class ClientSessionController {
  protected tabSessionService = new TabSessionService()

  /**
   * Tela de entrada (boas-vindas) do cliente na mesa via QR Code.
   * Se já possuir sessão válida e comanda aberta, redireciona diretamente ao menu.
   */
  async welcome({ params, request, response, inertia }: HttpContext) {
    const table = await Table.findBy('number', params.tableNumber)

    if (!table) {
      return response.status(404).send('Mesa não encontrada.')
    }

    // Verifica se já possui sessão ativa nesta mesa
    const sessionData = request.encryptedCookie('tab_session')
    if (sessionData && Number(sessionData.tableNumber) === Number(table.number)) {
      const member = await TabMember.query()
        .where('id', sessionData.memberId)
        .where('session_token', sessionData.sessionToken)
        .preload('tab')
        .first()

      if (member && (member.tab.status === 'OPEN' || member.tab.status === 'ABERTA')) {
        return response.redirect().toPath(`/m/${table.number}/menu`)
      }
    }

    const isBlocked =
      table.status === 'CONTA_PEDIDA' || (table.status as string) === 'BILL_REQUESTED'

    return (inertia as any).render('client/welcome', {
      tableNumber: table.number,
      tableStatus: table.status,
      isBlocked,
    })
  }

  /**
   * Processa a entrada do cliente informando o apelido (Zero-Auth).
   * Vincula à comanda ativa e emite o cookie seguro 'tab_session'.
   */
  async join({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(joinTableValidator)

    const table = await Table.findBy('number', params.tableNumber)
    if (!table) {
      return response.status(404).send('Mesa não encontrada.')
    }

    if (table.status === 'CONTA_PEDIDA' || (table.status as string) === 'BILL_REQUESTED') {
      session?.flash('notification', {
        type: 'error',
        message:
          'Esta mesa está em processo de fechamento. Peça ao garçom para liberar novos pedidos.',
      })
      return response.redirect().back()
    }

    const result = await this.tabSessionService.bindAliasToTable(table.id, payload.alias)

    response.encryptedCookie(
      'tab_session',
      {
        memberId: result.member.id,
        sessionToken: result.member.sessionToken,
        tableNumber: table.number,
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: '12h',
      }
    )

    return response.redirect().toPath(`/m/${table.number}/menu`)
  }

  /**
   * Endpoint protegido do cardápio mobile da mesa.
   */
  async menu({ params, inertia, tabMember }: HttpContext) {
    return (inertia as any).render('client/menu', {
      tableNumber: Number(params.tableNumber),
      tabMember: tabMember?.serialize(),
    })
  }
}
