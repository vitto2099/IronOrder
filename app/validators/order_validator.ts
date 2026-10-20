import vine from '@vinejs/vine'

export const batchOrderValidator = vine.compile(
  vine.object({
    tabId: vine.number().positive().optional(),
    tabMemberId: vine.number().positive().optional(),
    items: vine
      .array(
        vine.object({
          productId: vine.number().positive(),
          quantity: vine.number().min(1).max(50),
          notes: vine.string().maxLength(200).optional(),
        })
      )
      .minLength(1),
  })
)

export const updateOrderStatusValidator = vine.compile(
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
  })
)

export const cancelOrderValidator = vine.compile(
  vine.object({
    reason: vine.string().maxLength(255).optional(),
  })
)
