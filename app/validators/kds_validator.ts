import vine from '@vinejs/vine'

export const updateKdsOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum([
      'ENVIADO',
      'EM_PREPARO',
      'PRONTO',
      'ENTREGUE',
      'CANCELADO',
      'PENDING',
      'PREPARING',
      'READY',
      'DELIVERED',
      'CANCELLED',
    ] as const),
    reason: vine.string().maxLength(255).optional(),
  })
)
