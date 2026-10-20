import User from '#models/user'
import { signupValidator } from '#validators/user'
import { RoleNavigationService } from '#services/role_navigation_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ auth, inertia, response }: HttpContext) {
    if (await auth.check()) {
      return response.redirect(RoleNavigationService.getHomeRoute(auth.user!.role))
    }
    return inertia.render('auth/signup', {})
  }

  async store({ request, response, auth }: HttpContext) {
    const { passwordConfirmation, ...payload } = await request.validateUsing(signupValidator)
    const user = await User.create({ ...payload })

    await auth.use('web').login(user)
    return response.redirect(RoleNavigationService.getHomeRoute(user.role))
  }
}
