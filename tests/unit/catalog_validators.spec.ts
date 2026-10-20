import { test } from '@japa/runner'
import { upsertCategoryValidator } from '#validators/category_validator'
import { upsertProductValidator, updateAvailabilityValidator } from '#validators/product_validator'
import Category from '#models/category'
import db from '@adonisjs/lucid/services/db'

test.group('Catalog Validators', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('products').delete()
    await db.from('categories').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('valida payload correto para categoria', async ({ assert }) => {
    const validData = {
      name: 'Entradas',
      emoji: '🥗',
      sortOrder: 1,
      isActive: true,
    }

    const output = await upsertCategoryValidator.validate(validData)
    assert.equal(output.name, 'Entradas')
    assert.equal(output.emoji, '🥗')
    assert.equal(output.sortOrder, 1)
  })

  test('rejeita categoria com nome muito curto', async ({ assert }) => {
    const invalidData = {
      name: 'A',
    }

    await assert.rejects(async () => {
      await upsertCategoryValidator.validate(invalidData)
    })
  })

  test('valida e sanitiza produto com categoria existente', async ({ assert }) => {
    const category = await Category.create({
      name: 'Bebidas',
      slug: 'bebidas',
      isActive: true,
    })

    const validData = {
      categoryId: category.id,
      name: 'Suco de Laranja',
      price: 12.5,
      isAvailable: true,
      tags: ['Natural', 'Sem Açúcar'],
    }

    const output = await upsertProductValidator.validate(validData)
    assert.equal(output.name, 'Suco de Laranja')
    assert.equal(output.price, 12.5)
    assert.deepEqual(output.tags, ['Natural', 'Sem Açúcar'])
  })

  test('rejeita produto com categoria inexistente ou preço inválido', async ({ assert }) => {
    const invalidCategory = {
      categoryId: 999999,
      name: 'Item Inválido',
      price: 15,
    }

    await assert.rejects(async () => {
      await upsertProductValidator.validate(invalidCategory)
    })

    const invalidPrice = {
      categoryId: 1,
      name: 'Item Grátis',
      price: 0,
    }

    await assert.rejects(async () => {
      await upsertProductValidator.validate(invalidPrice)
    })
  })

  test('valida toggle de disponibilidade', async ({ assert }) => {
    const output = await updateAvailabilityValidator.validate({ isAvailable: false })
    assert.isFalse(output.isAvailable)
  })
})
