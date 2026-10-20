import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'
import Table from '#models/table'

test.group('E2E: Gestão Administrativa Interativa (Catálogo, Mesas e Staff)', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    if (await db.connection().schema.hasTable('order_items')) {
      await db.from('order_items').delete()
    }
    if (await db.connection().schema.hasTable('orders')) {
      await db.from('orders').delete()
    }
    if (await db.connection().schema.hasTable('tab_members')) {
      await db.from('tab_members').delete()
    }
    if (await db.connection().schema.hasTable('tabs')) {
      await db.from('tabs').delete()
    }
    if (await db.connection().schema.hasTable('tables')) {
      await db.from('tables').delete()
    }
    await db.from('products').delete()
    await db.from('categories').delete()
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('Catálogo: criação de categoria, produto via modal e toggle rápido de disponibilidade', async ({
    browserContext,
    assert,
  }) => {
    // 1. Cria usuário administrador
    const admin = await User.create({
      email: 'admin.crud@qrorder.local',
      password: 'password123',
      fullName: 'Administrador Gestor',
      role: 'ADMIN',
    })

    // 2. Login e navegação para o Catálogo
    await browserContext.loginAs(admin)
    const page = await browserContext.visit('/admin/catalog')

    await page.assertPath('/admin/catalog')
    await page.assertVisible('h1:has-text("Catálogo & Cardápio")')

    // 3. Criação de Categoria via modal
    await page.click('button:has-text("Nova Categoria")')
    await page.assertVisible('h2:has-text("Nova Categoria")')

    await page.fill('input[placeholder="Ex: Entradas, Pratos Principais"]', 'Bebidas Especiais')
    await page.fill('input[placeholder="Ex: 🥗, 🍽️"]', '🍹')
    await page.click('button[type="submit"]:has-text("Salvar")')

    // Valida categoria renderizada na página
    await page.assertVisible('h2:has-text("Bebidas Especiais")')
    const savedCategory = await Category.findByOrFail('name', 'Bebidas Especiais')
    assert.isNotNull(savedCategory)

    // 4. Criação de Produto via modal
    await page.click('button:has-text("Novo Produto")')
    await page.assertVisible('h2:has-text("Novo Produto")')

    await page.selectOption('select', String(savedCategory.id))
    await page.fill('input[placeholder="Ex: Bruschetta ao Azeite"]', 'Mojito Cubano Clássico')
    await page.fill('input[placeholder="32.00"]', '29.90')
    await page.fill(
      'textarea[placeholder="Ingredientes principais, preparo..."]',
      'Rum branco, hortelã fresca, limão tahiti e água com gás'
    )
    await page.click('button[type="submit"]:has-text("Salvar")')

    // Valida produto renderizado no catálogo
    await page.assertVisible('text=Mojito Cubano Clássico')
    const savedProduct = await Product.findByOrFail('name', 'Mojito Cubano Clássico')
    assert.isTrue(Boolean(savedProduct.isAvailable))

    // 5. Toggle de Disponibilidade Rápida
    // O switch inicial está ativo (aria-checked="true")
    const switchBtn = page.locator('button[role="switch"]')
    await page.assertVisible('button[role="switch"]')

    // Clica para pausar/desativar
    await switchBtn.click()

    // Valida atualização no banco
    await savedProduct.refresh()
    assert.isFalse(Boolean(savedProduct.isAvailable))

    // Clica novamente para reativar
    await switchBtn.click()
    await savedProduct.refresh()
    assert.isTrue(Boolean(savedProduct.isAvailable))
  })

  test('Mesas: cadastro de mesa física e renderização da folha A4 de impressão com QR Codes', async ({
    browserContext,
    assert,
  }) => {
    // 1. Cria usuário administrador
    const admin = await User.create({
      email: 'admin.mesas@qrorder.local',
      password: 'password123',
      fullName: 'Admin Mesas',
      role: 'ADMIN',
    })

    // 2. Acesso à Gestão de Mesas
    await browserContext.loginAs(admin)
    const page = await browserContext.visit('/admin/tables')

    await page.assertPath('/admin/tables')
    await page.assertVisible('h1:has-text("Gestão de Mesas")')

    // 3. Abertura do modal de cadastro de mesa
    await page.click('button:has-text("Cadastrar Mesa")')
    await page.assertVisible('h2:has-text("Nova Mesa")')

    await page.fill('input[placeholder="Ex: 12"]', '35')
    await page.fill('input[placeholder="Ex: 4"]', '6')
    await page.click('button[type="submit"]:has-text("Cadastrar Mesa")')

    // Valida que a mesa 35 aparece na listagem
    await page.assertVisible('text=Mesa 35')
    const savedTable = await Table.findByOrFail('number', 35)
    assert.equal(savedTable.capacity, 6)

    // 4. Acesso à página de impressão de etiquetas A4
    await page.goto('/admin/tables/print')
    await page.assertPath('/admin/tables/print')
    await page.assertVisible('h1:has-text("Impressão de Etiquetas A4")')
    await page.assertVisible('text=MESA 35')
    await page.assertVisible('button:has-text("Imprimir Folhas A4")')
  })

  test('Staff: cadastro de colaborador com papel específico e toggle de status ativo/inativo', async ({
    browserContext,
    assert,
  }) => {
    // 1. Cria usuário administrador
    const admin = await User.create({
      email: 'admin.staff@qrorder.local',
      password: 'password123',
      fullName: 'Admin Staff Master',
      role: 'ADMIN',
    })

    // 2. Acesso à Gestão de Colaboradores
    await browserContext.loginAs(admin)
    const page = await browserContext.visit('/admin/staff')

    await page.assertPath('/admin/staff')
    await page.assertVisible('h1:has-text("Equipe & Colaboradores")')

    // 3. Abertura do modal de cadastro de colaborador
    await page.click('button:has-text("Novo Colaborador")')
    await page.assertVisible('h2:has-text("Novo Colaborador")')

    await page.fill('input[placeholder="Ex: Carlos Silva"]', 'Carlos Barista')
    await page.fill('input[placeholder="carlos@restaurante.com"]', 'carlos.bar@qrorder.local')
    await page.fill('input[placeholder="Mínimo 8 caracteres"]', 'senha123456')
    await page.selectOption('select', 'COZINHA')
    await page.click('button[type="submit"]:has-text("Cadastrar Colaborador")')

    // Valida exibição de Carlos Barista na tabela
    await page.assertVisible('tr:has-text("Carlos Barista")')
    await page.assertVisible('span:has-text("Cozinha")')

    const newStaff = await User.findByOrFail('email', 'carlos.bar@qrorder.local')
    assert.equal(newStaff.role, 'COZINHA')
    assert.isTrue(Boolean(newStaff.isActive))

    // 4. Alterna status ativo/inativo
    // O botão do Carlos está inicialmente ativo: "● Ativo"
    const staffRow = page.locator('tr', { hasText: 'Carlos Barista' })
    const toggleBtn = staffRow.locator('button', { hasText: '● Ativo' })
    await toggleBtn.click()

    // O botão deve alternar para "○ Inativo"
    await page.assertVisible('text=○ Inativo')
    await newStaff.refresh()
    assert.isFalse(Boolean(newStaff.isActive))

    // Reativa o colaborador
    const inactiveBtn = staffRow.locator('button', { hasText: '○ Inativo' })
    await inactiveBtn.click()
    await page.assertVisible('text=● Ativo')
    await newStaff.refresh()
    assert.isTrue(Boolean(newStaff.isActive))
  })
})
