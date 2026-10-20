import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import TabMember from '#models/tab_member'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    tabMember?: TabMember
  }
}

export interface ClientSessionPayload {
  memberId: number
  sessionToken: string
  tableNumber: number
}

export default class ClientSessionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const sessionData = ctx.request.encryptedCookie('tab_session') as
      ClientSessionPayload | undefined

    const targetTableNumber = ctx.params.tableNumber || sessionData?.tableNumber || ''
    const fallbackPath = targetTableNumber ? `/m/${targetTableNumber}` : '/'

    const wantsJson =
      ctx.request.header('accept') === 'application/json' ||
      (ctx.request.ajax() && !ctx.request.header('accept')?.includes('text/html'))

    if (!sessionData || !sessionData.memberId || !sessionData.sessionToken) {
      ctx.response.clearCookie('tab_session')

      if (wantsJson) {
        return ctx.response.status(401).json({ error: 'Sessão não autorizada ou ausente.' })
      }

      ctx.session?.flash('notification', {
        type: 'error',
        message: 'Sessão não identificada. Informe seu nome para continuar.',
      })
      return ctx.response.redirect().toPath(fallbackPath)
    }

    // Busca membro e valida vínculo com comanda
    const member = await TabMember.query()
      .where('id', sessionData.memberId)
      .where('session_token', sessionData.sessionToken)
      .preload('tab')
      .first()

    if (!member || !member.tab) {
      ctx.response.clearCookie('tab_session')
      ctx.session?.flash('notification', {
        type: 'error',
        message: 'Esta sessão é inválida ou expirou.',
      })
      return ctx.response.redirect().toPath(fallbackPath)
    }

    // Verifica se a comanda individual do membro já foi quitada
    if (member.status === 'PAID') {
      ctx.response.clearCookie('tab_session')
      ctx.session?.flash('notification', {
        type: 'info',
        message: 'Sua comanda foi quitada com sucesso. Obrigado pela preferência!',
      })
      return ctx.response.redirect().toPath(fallbackPath)
    }

    // Verifica se a comanda geral ainda está aberta
    if (member.tab.status === 'FECHADA' || (member.tab.status as string) === 'CLOSED') {
      ctx.response.clearCookie('tab_session')
      ctx.session?.flash('notification', {
        type: 'warning',
        message: 'Esta sessão foi finalizada pelo caixa.',
      })
      return ctx.response.redirect().toPath(fallbackPath)
    }

    // Sessão válida: anexa o membro ao contexto HTTP
    ctx.tabMember = member

    return await next()
  }
}
