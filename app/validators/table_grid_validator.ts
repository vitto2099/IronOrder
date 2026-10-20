import vine from '@vinejs/vine'

export const manualOrderValidator = vine.compile(
  vine.object({
    alias: vine.string().trim().minLength(1).maxLength(60).optional(),
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

export const cancelOrderValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().maxLength(255).optional(),
  })
)
