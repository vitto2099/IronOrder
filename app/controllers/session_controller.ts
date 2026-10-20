import User from '#models/user'
import { loginValidator } from '#validators/user'
import { RoleNavigationService } from '#services/role_navigation_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ auth, inertia, response }: HttpContext) {
    if (await auth.check()) {
      return response.redirect(RoleNavigationService.getHomeRoute(auth.user!.role))
    }
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    await auth.use('web').login(user)
    return response.redirect(RoleNavigationService.getHomeRoute(user.role))
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
