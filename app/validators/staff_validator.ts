import vine from '@vinejs/vine'

export const createStaffValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(3),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const match = await db.from('users').where('email', value).first()
        return !match
      }),
    password: vine.string().minLength(8),
    role: vine.enum(['ADMIN', 'GERENTE', 'GARCOM', 'CAIXA', 'COZINHA'] as const),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    password: vine.string().minLength(8),
  })
)
