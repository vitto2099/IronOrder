import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import Table from '#models/table'
import { createTableValidator } from '#validators/table_validator'
import QRCode from 'qrcode'

export default class TablesAdminController {
  /**
   * Lista todas as mesas
   */
  async index({ inertia, request, response }: HttpContext) {
    const tables = await Table.query().orderBy('number', 'asc')

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.json({ tables })
    }

    return (inertia as any).render('admin/tables/index', {
      tables: tables.map((t) => t.serialize()) as any,
    })
  }

  /**
   * Criação de mesa individual ou em lote
   */
  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createTableValidator)

    if (payload.isBatch) {
      const start = payload.startNumber ?? 1
      const end = payload.endNumber ?? start
      const capacity = payload.capacity ?? 4

      if (start > end) {
        session.flash('notification', {
          type: 'error',
          message: 'Número inicial não pode ser maior que o final',
        })
        return response.badRequest({ error: 'Intervalo inválido' })
      }

      for (let num = start; num <= end; num++) {
        const exists = await Table.findBy('number', num)
        if (!exists) {
          await Table.create({
            number: num,
            capacity,
            status: 'LIVRE',
          })
        }
      }

      session.flash('notification', {
        type: 'success',
        message: `Mesas de ${start} a ${end} cadastradas com sucesso.`,
      })
      return response.redirect().toRoute('admin.tables.index')
    }

    if (!payload.number) {
      return response.badRequest({ error: 'Número da mesa é obrigatório' })
    }

    const existing = await Table.findBy('number', payload.number)
    if (existing) {
      return response.status(422).json({
        errors: [{ field: 'number', message: `Mesa ${payload.number} já está cadastrada.` }],
      })
    }

    await Table.create({
      number: payload.number,
      capacity: payload.capacity ?? 4,
      status: 'LIVRE',
    })

    session.flash('notification', {
      type: 'success',
      message: `Mesa ${payload.number} criada com sucesso.`,
    })

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.status(201).json({ success: true })
    }

    return response.redirect().toRoute('admin.tables.index')
  }

  /**
   * Exclui mesa apenas se estiver LIVRE
   */
  async destroy({ params, response, session, request }: HttpContext) {
    const table = await Table.findOrFail(params.id)

    if (table.status !== 'LIVRE') {
      const message = `A Mesa ${table.number} está ${table.status} e não pode ser excluída.`
      session.flash('notification', { type: 'error', message })
      return response.badRequest({ error: message })
    }

    await table.delete()

    session.flash('notification', {
      type: 'success',
      message: `Mesa ${table.number} removida com sucesso.`,
    })

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.json({ success: true })
    }

    return response.redirect().toRoute('admin.tables.index')
  }

  /**
   * Gera QR codes e página diagramada para impressão A4
   */
  async printLabels({ inertia, request, response }: HttpContext) {
    const tables = await Table.query().orderBy('number', 'asc')
    const appUrl = env.get('APP_URL') || 'http://localhost:3333'

    const tablesWithQr = await Promise.all(
      tables.map(async (table) => {
        const url = `${appUrl}/m/${table.number}`
        const qrCodeDataUrl = await QRCode.toDataURL(url, {
          margin: 1,
          width: 300,
          errorCorrectionLevel: 'M',
        })
        return {
          id: table.id,
          number: table.number,
          capacity: table.capacity,
          status: table.status,
          url,
          qrCodeDataUrl,
        }
      })
    )

    const isJson =
      request.accepts(['html', 'json']) === 'json' ||
      Boolean(request.header('accept')?.includes('application/json'))

    if (isJson) {
      return response.json({ tables: tablesWithQr })
    }

    return (inertia as any).render('admin/tables/print', {
      tables: tablesWithQr,
    })
  }
}
