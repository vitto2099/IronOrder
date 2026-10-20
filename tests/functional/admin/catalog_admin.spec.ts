import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'

test.group('Admin Catalog (Functional HTTP)', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    if (await db.connection().schema.hasTable('order_items')) {
      await db.from('order_items').delete()
    }
    await db.from('products').delete()
    await db.from('categories').delete()
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('a) Acesso a /admin/catalog por ADMIN/GERENTE (200 OK) vs GARCOM/anônimo (403/401)', async ({
    client,
    assert,
  }) => {
    // 1. Anônimo (não autenticado) - com accept json deve ser 401, ou sem redirect deve ser 302
    const guestJsonRes = await client.get('/admin/catalog').header('accept', 'application/json')
    assert.equal(guestJsonRes.status(), 401)

    const guestRes = await client.get('/admin/catalog').redirects(0)
    assert.equal(guestRes.status(), 302)

    // 2. Garçom (papel não autorizado)
    const waiter = await User.create({
      email: 'waiter@test.local',
      password: 'password123',
      fullName: 'Garçom Teste',
      role: 'GARCOM',
    })
    const waiterRes = await client.get('/admin/catalog').loginAs(waiter)
    waiterRes.assertStatus(403)

    // 3. Administrador (papel autorizado)
    const admin = await User.create({
      email: 'admin@test.local',
      password: 'password123',
      fullName: 'Admin Teste',
      role: 'ADMIN',
    })
    const adminRes = await client.get('/admin/catalog').loginAs(admin)
    adminRes.assertStatus(200)

    // 4. Gerente (papel autorizado)
    const manager = await User.create({
      email: 'manager@test.local',
      password: 'password123',
      fullName: 'Gerente Teste',
      role: 'GERENTE',
    })
    const managerRes = await client.get('/admin/catalog').loginAs(manager)
    managerRes.assertStatus(200)
  })

  test('b) Criação de categoria e produto via POST /admin/catalog/categories e /admin/catalog/products', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin_store@test.local',
      password: 'password123',
      fullName: 'Admin Store',
      role: 'ADMIN',
    })

    // Criação de categoria
    const catRes = await client
      .post('/admin/catalog/categories')
      .loginAs(admin)
      .withCsrfToken()
      .json({
        name: 'Sobremesas Especiais',
        emoji: '🍰',
        sortOrder: 1,
        isActive: true,
      })

    assert.oneOf(catRes.status(), [200, 201, 302, 303])
    const createdCat = await Category.findBy('slug', 'sobremesas-especiais')
    assert.isNotNull(createdCat)
    assert.equal(createdCat?.name, 'Sobremesas Especiais')

    // Criação de produto
    const prodRes = await client
      .post('/admin/catalog/products')
      .loginAs(admin)
      .withCsrfToken()
      .json({
        categoryId: createdCat!.id,
        name: 'Petit Gâteau',
        description: 'Bolo quente com sorvete',
        price: 28.5,
        isAvailable: true,
        tags: ['Sobremesa', 'Quente'],
      })

    assert.oneOf(prodRes.status(), [200, 201, 302, 303])
    const createdProd = await Product.findBy('name', 'Petit Gâteau')
    assert.isNotNull(createdProd)
    assert.equal(createdProd?.price, 28.5)
    assert.isTrue(createdProd?.isAvailable)
  })

  test('c) Toggle rápido de disponibilidade via PATCH /admin/catalog/products/:id/availability', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin_toggle@test.local',
      password: 'password123',
      role: 'ADMIN',
    })

    const category = await Category.create({
      name: 'Bebidas',
      slug: 'bebidas',
      isActive: true,
    })

    const product = await Product.create({
      categoryId: category.id,
      name: 'Negroni Clássico',
      slug: 'negroni-classico',
      price: 36,
      isAvailable: true,
    })

    const toggleRes = await client
      .patch(`/admin/catalog/products/${product.id}/availability`)
      .loginAs(admin)
      .withCsrfToken()
      .json({ isAvailable: false })

    assert.oneOf(toggleRes.status(), [200, 302, 303])
    await product.refresh()
    assert.isFalse(product.isAvailable)

    // Toggle de volta para true
    const toggleBackRes = await client
      .patch(`/admin/catalog/products/${product.id}/availability`)
      .loginAs(admin)
      .withCsrfToken()
      .json({ isAvailable: true })

    assert.oneOf(toggleBackRes.status(), [200, 302, 303])
    await product.refresh()
    assert.isTrue(product.isAvailable)
  })

  test('d) Soft-delete de produto via DELETE /admin/catalog/products/:id', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin_delete@test.local',
      password: 'password123',
      role: 'ADMIN',
    })

    const category = await Category.create({
      name: 'Entradas',
      slug: 'entradas',
      isActive: true,
    })

    const product = await Product.create({
      categoryId: category.id,
      name: 'Bruschetta',
      slug: 'bruschetta',
      price: 32,
      isAvailable: true,
    })

    // Simula produto com histórico em order_items
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.table('order_items').insert({
      order_id: null,
      product_id: product.id,
      name_snapshot: product.name,
      unit_price: product.price,
      quantity: 1,
      created_at: new Date().toISOString(),
    })
    await db.rawQuery('PRAGMA foreign_keys = ON')

    const deleteRes = await client
      .delete(`/admin/catalog/products/${product.id}`)
      .loginAs(admin)
      .withCsrfToken()

    assert.oneOf(deleteRes.status(), [200, 302, 303])

    const dbProd = await db.from('products').where('id', product.id).first()
    assert.isNotNull(dbProd)
    assert.isNotNull(dbProd.deleted_at)
  })
})
