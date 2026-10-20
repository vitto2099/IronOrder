import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { CatalogService } from '#services/catalog_service'

test.group('CatalogService (TDD)', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('products').delete()
    await db.from('categories').delete()
    if (await db.connection().schema.hasTable('order_items')) {
      await db.from('order_items').delete()
    }
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('a) deve criar categoria e produto gerando slug automaticamente se omitido', async ({
    assert,
  }) => {
    const catalogService = new CatalogService()

    const category = await catalogService.upsertCategory({
      name: 'Entradas Especiais',
      emoji: '🥗',
      sortOrder: 1,
      isActive: true,
    })

    assert.isNotNull(category.id)
    assert.equal(category.name, 'Entradas Especiais')
    assert.equal(category.slug, 'entradas-especiais')
    assert.isTrue(category.isActive)

    const product = await catalogService.upsertProduct({
      categoryId: category.id,
      name: 'Bruschetta ao Azeite de Oliva',
      description: 'Pão rústico artesanal',
      price: 32.5,
      isAvailable: true,
      tags: ['Vegano', 'Artesanal'],
    })

    assert.isNotNull(product.id)
    assert.equal(product.name, 'Bruschetta ao Azeite de Oliva')
    assert.equal(product.slug, 'bruschetta-ao-azeite-de-oliva')
    assert.equal(product.price, 32.5)
    assert.isTrue(product.isAvailable)
    assert.deepEqual(product.tags, ['Vegano', 'Artesanal'])
  })

  test('b) deve consultar cardápio retornando apenas categorias ativas e produtos disponíveis e não deletados', async ({
    assert,
  }) => {
    const catalogService = new CatalogService()

    const activeCat = await catalogService.upsertCategory({
      name: 'Pratos Principais',
      sortOrder: 1,
      isActive: true,
    })

    const inactiveCat = await catalogService.upsertCategory({
      name: 'Bebidas Desativadas',
      sortOrder: 2,
      isActive: false,
    })

    // Produto disponível e ativo
    await catalogService.upsertProduct({
      categoryId: activeCat.id,
      name: 'Filé ao Molho Trufado',
      price: 148,
      isAvailable: true,
    })

    // Produto indisponível
    await catalogService.upsertProduct({
      categoryId: activeCat.id,
      name: 'Robalo Esgotado',
      price: 118,
      isAvailable: false,
    })

    // Produto em categoria inativa
    await catalogService.upsertProduct({
      categoryId: inactiveCat.id,
      name: 'Negroni Proibido',
      price: 36,
      isAvailable: true,
    })

    const tree = await catalogService.getCatalogTree({ onlyAvailable: true })

    assert.lengthOf(tree, 1)
    assert.equal(tree[0].id, activeCat.id)
    assert.lengthOf(tree[0].products, 1)
    assert.equal(tree[0].products[0].name, 'Filé ao Molho Trufado')
  })

  test('c) deve aplicar soft-delete em produto faturado/com pedidos e hard-delete quando sem pedidos', async ({
    assert,
  }) => {
    const catalogService = new CatalogService()

    const cat = await catalogService.upsertCategory({
      name: 'Sobremesas',
      sortOrder: 1,
      isActive: true,
    })

    const productWithoutOrders = await catalogService.upsertProduct({
      categoryId: cat.id,
      name: 'Tarte de Limão',
      price: 25,
    })

    // Hard delete quando não há pedidos
    const deleteResult1 = await catalogService.deleteProduct(productWithoutOrders.id)
    assert.isTrue(deleteResult1.deleted)
    assert.isFalse(deleteResult1.soft)

    const checkHardDeleted = await db.from('products').where('id', productWithoutOrders.id).first()
    assert.isNull(checkHardDeleted)

    // Criação de produto com pedido vinculado (simulando tabela order_items)
    const productWithOrders = await catalogService.upsertProduct({
      categoryId: cat.id,
      name: 'Bolo de Chocolate 70%',
      price: 42,
    })

    const hasOrderItems = await db.connection().schema.hasTable('order_items')
    if (!hasOrderItems) {
      await db.connection().schema.createTable('order_items', (table) => {
        table.increments('id').primary()
        table.integer('product_id').unsigned().notNullable()
        table.integer('quantity').notNullable()
      })
    }

    await db.table('order_items').insert({
      product_id: productWithOrders.id,
      name_snapshot: 'Bolo de Chocolate 70%',
      unit_price: 42,
      quantity: 2,
      created_at: new Date(),
    })

    // Soft delete quando há registros em order_items
    const deleteResult2 = await catalogService.deleteProduct(productWithOrders.id)
    assert.isTrue(deleteResult2.deleted)
    assert.isTrue(deleteResult2.soft)

    const checkSoftDeleted = await db.from('products').where('id', productWithOrders.id).first()
    assert.isNotNull(checkSoftDeleted)
    assert.isNotNull(checkSoftDeleted.deleted_at)

    // Valida que produto soft-deleted não aparece no cardápio de clientes
    const tree = await catalogService.getCatalogTree({ onlyAvailable: true })
    const allProducts = tree.flatMap((c) => c.products)
    assert.isFalse(allProducts.some((p) => p.id === productWithOrders.id))
  })

  test('d) deve alternar disponibilidade rápida via toggleAvailability e updateProductAvailability', async ({
    assert,
  }) => {
    const catalogService = new CatalogService()

    const cat = await catalogService.upsertCategory({
      name: 'Bebidas',
      sortOrder: 1,
      isActive: true,
    })

    const product = await catalogService.upsertProduct({
      categoryId: cat.id,
      name: 'Negroni Clássico',
      price: 36,
      isAvailable: true,
    })

    assert.isTrue(product.isAvailable)

    // Toggle para indisponível
    const toggled1 = await catalogService.toggleAvailability(product.id)
    assert.isFalse(toggled1.isAvailable)

    // Toggle de volta para disponível
    const toggled2 = await catalogService.toggleAvailability(product.id)
    assert.isTrue(toggled2.isAvailable)

    // Atualização explícita
    const updated = await catalogService.updateProductAvailability(product.id, false)
    assert.isFalse(updated.isAvailable)

    // Consulta no cardápio de clientes confirma ausência do produto indisponível
    const tree = await catalogService.getCatalogTree({ onlyAvailable: true })
    const products = tree.find((c) => c.id === cat.id)?.products ?? []
    assert.isFalse(products.some((p) => p.id === product.id))
  })

  test('e) deve permitir editar categoria e produto existentes', async ({ assert }) => {
    const catalogService = new CatalogService()

    const cat = await catalogService.upsertCategory({
      name: 'Entradas Originais',
      emoji: '🥖',
      sortOrder: 1,
    })

    const updatedCat = await catalogService.upsertCategory({
      id: cat.id,
      name: 'Entradas Renomeadas',
      emoji: '🥗',
      sortOrder: 2,
      isActive: false,
    })

    assert.equal(updatedCat.id, cat.id)
    assert.equal(updatedCat.name, 'Entradas Renomeadas')
    assert.equal(updatedCat.emoji, '🥗')
    assert.equal(updatedCat.sortOrder, 2)
    assert.isFalse(updatedCat.isActive)

    const prod = await catalogService.upsertProduct({
      categoryId: cat.id,
      name: 'Bruschetta Simples',
      price: 20,
    })

    const updatedProd = await catalogService.upsertProduct({
      id: prod.id,
      categoryId: cat.id,
      name: 'Bruschetta Gourmet',
      price: 35,
      description: 'Tomates orgânicos e manjericão',
      isAvailable: false,
      tags: ['Vegetariano'],
    })

    assert.equal(updatedProd.id, prod.id)
    assert.equal(updatedProd.name, 'Bruschetta Gourmet')
    assert.equal(updatedProd.price, 35)
    assert.equal(updatedProd.description, 'Tomates orgânicos e manjericão')
    assert.isFalse(updatedProd.isAvailable)
    assert.deepEqual(updatedProd.tags, ['Vegetariano'])
  })

  test('f) deve rejeitar duplicidade de nome de produto na mesma categoria', async ({ assert }) => {
    const catalogService = new CatalogService()

    const cat = await catalogService.upsertCategory({
      name: 'Pratos Principais',
    })

    await catalogService.upsertProduct({
      categoryId: cat.id,
      name: 'Risoto de Cogumelos',
      price: 55,
    })

    await assert.rejects(async () => {
      await catalogService.upsertProduct({
        categoryId: cat.id,
        name: 'Risoto de Cogumelos',
        price: 60,
      })
    }, /already exists in category/)
  })

  test('g) deve retornar todas as categorias e produtos quando onlyAvailable é false', async ({
    assert,
  }) => {
    const catalogService = new CatalogService()

    const cat = await catalogService.upsertCategory({
      name: 'Bebidas Admin',
      sortOrder: 1,
      isActive: false,
    })

    await catalogService.upsertProduct({
      categoryId: cat.id,
      name: 'Vinho Tinto',
      price: 90,
      isAvailable: false,
    })

    const tree = await catalogService.getCatalogTree({ onlyAvailable: false })
    const foundCat = tree.find((c) => c.id === cat.id)

    assert.isDefined(foundCat)
    assert.equal(foundCat?.products.length, 1)
    assert.equal(foundCat?.products[0].name, 'Vinho Tinto')
  })
})
