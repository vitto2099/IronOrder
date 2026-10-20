import vine from '@vinejs/vine'

export const createTableValidator = vine.compile(
  vine.object({
    number: vine.number().positive().withoutDecimals().optional(),
    capacity: vine.number().min(1).max(50).optional(),
    isBatch: vine.boolean().optional(),
    startNumber: vine.number().positive().withoutDecimals().optional(),
    endNumber: vine.number().positive().withoutDecimals().optional(),
  })
)
