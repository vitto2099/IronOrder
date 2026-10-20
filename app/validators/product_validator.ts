import vine from '@vinejs/vine'

export const upsertProductValidator = vine.create({
  id: vine.number().positive().optional(),
  categoryId: vine.number().exists({ table: 'categories', column: 'id' }),
  name: vine.string().trim().minLength(2).maxLength(150),
  slug: vine.string().trim().maxLength(180).optional(),
  description: vine.string().trim().nullable().optional(),
  price: vine.number().min(0.01),
  imageUrl: vine.string().trim().maxLength(500).nullable().optional(),
  isAvailable: vine.boolean().optional(),
  tags: vine.array(vine.string().trim()).nullable().optional(),
})

export const updateAvailabilityValidator = vine.create({
  isAvailable: vine.boolean(),
})
