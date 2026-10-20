import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createStaffValidator, resetPasswordValidator } from '#validators/staff_validator'

export default class StaffAdminController {
  /**
   * Lista colaboradores cadastrados
   */
  async index({ inertia, request, response }: HttpContext) {
    const staff = await User.query().orderBy('id', 'asc')

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.json({ staff })
    }

    return (inertia as any).render('admin/staff/index', {
      staff: staff.map((u) => u.serialize()) as any,
    })
  }

  /**
   * Cria novo colaborador
   */
  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createStaffValidator)

    await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      isActive: true,
    })

    session.flash('notification', {
      type: 'success',
      message: `Colaborador ${payload.fullName} cadastrado com sucesso.`,
    })

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.status(201).json({ success: true })
    }

    return response.redirect().toRoute('admin.staff.index')
  }

  /**
   * Alterna status ativo/inativo
   */
  async toggleStatus({ params, auth, response, session, request }: HttpContext) {
    const targetUser = await User.findOrFail(params.id)

    if (auth.user?.id === targetUser.id) {
      const message = 'Você não pode desativar seu próprio usuário administrador.'
      session.flash('notification', { type: 'error', message })
      return response.badRequest({ error: message })
    }

    targetUser.isActive = !targetUser.isActive
    await targetUser.save()

    session.flash('notification', {
      type: 'success',
      message: `Status de ${targetUser.fullName || targetUser.email} alterado para ${targetUser.isActive ? 'Ativo' : 'Inativo'}.`,
    })

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.json({ success: true, isActive: targetUser.isActive })
    }

    return response.redirect().toRoute('admin.staff.index')
  }

  /**
   * Altera a senha do operador
   */
  async resetPassword({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(resetPasswordValidator)
    const targetUser = await User.findOrFail(params.id)

    targetUser.password = payload.password
    await targetUser.save()

    session.flash('notification', {
      type: 'success',
      message: `Senha de ${targetUser.fullName || targetUser.email} redefinida com sucesso.`,
    })

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.json({ success: true })
    }

    return response.redirect().toRoute('admin.staff.index')
  }
}
