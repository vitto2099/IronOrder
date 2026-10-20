import vine from '@vinejs/vine'

/**
 * Validador para entrada de cliente na mesa via Zero-Auth
 */
export const joinTableValidator = vine.compile(
  vine.object({
    alias: vine.string().trim().minLength(2).maxLength(30),
  })
)
