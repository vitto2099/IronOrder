import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { UserRole } from '#models/user'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: UserRole[]) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({ message: 'Não autenticado' })
    }

    if (!allowedRoles.includes(user.role)) {
      return ctx.response.forbidden({ message: 'Acesso negado para o seu perfil' })
    }

    return next()
  }
}
