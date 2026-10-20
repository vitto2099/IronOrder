import vine from '@vinejs/vine'

export const upsertCategoryValidator = vine.create({
  id: vine.number().positive().optional(),
  name: vine.string().trim().minLength(2).maxLength(100),
  slug: vine.string().trim().maxLength(120).optional(),
  emoji: vine.string().trim().maxLength(10).nullable().optional(),
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})
