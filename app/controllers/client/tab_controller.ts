import type { HttpContext } from '@adonisjs/core/http'
import Table from '#models/table'
import TabSessionService from '#services/tab_session_service'

export default class ClientTabController {
  protected tabSessionService = new TabSessionService()

  /**
   * Renderiza a visualização do Extrato da Comanda com divisão de consumo por membro (TASK-09).
   */
  async statement({ params, inertia, tabMember, request, response }: HttpContext) {
    const table = await Table.findByOrFail('number', params.tableNumber)

    const statement = await this.tabSessionService.getTabStatement(table.id, tabMember?.id)

    const isJson =
      request.header('accept') === 'application/json' ||
      (request.ajax() && !request.header('accept')?.includes('text/html'))

    if (isJson) {
      return response.json(statement)
    }

    return (inertia as any).render('client/statement', {
      ...statement,
      myAlias: tabMember?.alias,
      myMemberId: tabMember?.id,
    })
  }

  /**
   * Solicita o fechamento da conta pelo cliente (transiciona comanda individual para BILL_REQUESTED).
   */
  async requestBill({ params, response, session, request, tabMember }: HttpContext) {
    const table = await Table.findByOrFail('number', params.tableNumber)

    if (tabMember) {
      if (tabMember.status === 'BILL_REQUESTED') {
        session?.flash('notification', {
          type: 'info',
          message: 'Sua conta já foi solicitada. O garçom está a caminho!',
        })
        return response.redirect().back()
      }

      const { member, table: updatedTable } = await this.tabSessionService.requestMemberBill(
        tabMember.id
      )

      session?.flash('notification', {
        type: 'success',
        message: 'Conta solicitada com sucesso! Um garçom virá até sua mesa.',
      })

      const isJson =
        request.header('accept') === 'application/json' ||
        (request.ajax() && !request.header('accept')?.includes('text/html'))

      if (isJson) {
        return response.json({
          message: 'Conta solicitada com sucesso!',
          memberStatus: member.status,
          tableStatus: updatedTable.status,
        })
      }

      return response.redirect().back()
    }

    if (table.status === 'CONTA_PEDIDA' || (table.status as string) === 'BILL_REQUESTED') {
      session?.flash('notification', {
        type: 'info',
        message: 'A conta já foi solicitada. O garçom está a caminho!',
      })
      return response.redirect().back()
    }

    await this.tabSessionService.requestBill(table.id)

    session?.flash('notification', {
      type: 'success',
      message: 'Conta solicitada com sucesso! Um garçom virá até sua mesa.',
    })

    const isJson =
      request.header('accept') === 'application/json' ||
      (request.ajax() && !request.header('accept')?.includes('text/html'))

    if (isJson) {
      return response.json({
        message: 'Conta solicitada com sucesso!',
        tableStatus: 'CONTA_PEDIDA',
      })
    }

    return response.redirect().back()
  }
}
