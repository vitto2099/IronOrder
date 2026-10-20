import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

test.group('E2E: Login e Acesso às Rotas de Admin', (group) => {
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

  test('deve exibir a página de login com campos obrigatórios e botão de submit', async ({
    visit,
  }) => {
    const page = await visit('/login')

    await page.assertExists('h1')
    await page.assertText('h1', 'Login')
    await page.assertVisible('input[name="email"]')
    await page.assertVisible('input[name="password"]')
    await page.assertVisible('button[type="submit"]')
  })

  test('deve exibir erro de validação ao submeter formulário de login em branco', async ({
    visit,
  }) => {
    const page = await visit('/login')

    await page.click('button[type="submit"]')

    // O validador do vine retorna mensagens e aplica data-invalid nos campos
    await page.waitForSelector('[data-invalid="true"], span, div')
    await page.assertVisible('input[name="email"][data-invalid="true"]')
  })

  test('não deve autenticar com credenciais incorretas e deve permanecer na tela de login', async ({
    visit,
  }) => {
    await User.create({
      email: 'admin@qrorder.local',
      password: 'password123',
      fullName: 'Administrador Chefe',
      role: 'ADMIN',
    })

    const page = await visit('/login')

    await page.fill('input[name="email"]', 'admin@qrorder.local')
    await page.fill('input[name="password"]', 'senha-incorreta-xyz')
    await page.click('button[type="submit"]')

    // Não deve navegar para a home protegida, mantendo-se na rota de login
    await page.assertPath('/login')
  })

  test('deve autenticar usuário ADMIN com credenciais válidas e redirecionar com sucesso', async ({
    visit,
  }) => {
    await User.create({
      email: 'admin@qrorder.local',
      password: 'password123',
      fullName: 'Administrador Chefe',
      role: 'ADMIN',
    })

    const page = await visit('/login')

    await page.fill('input[name="email"]', 'admin@qrorder.local')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Ao logar com sucesso, SessionController redireciona para /admin/hub
    await page.waitForURL('**/admin/hub')
    await page.assertPath('/admin/hub')
  })

  test('visitante não autenticado tentando acessar rota admin deve ser redirecionado para /login', async ({
    visit,
  }) => {
    const page = await visit('/admin/catalog')

    // AuthMiddleware redireciona usuário anônimo para /login
    await page.waitForURL('**/login')
    await page.assertPath('/login')
  })

  test('usuário autenticado com perfil não autorizado (GARCOM) tem acesso proibido (403)', async ({
    browserContext,
  }) => {
    const waiter = await User.create({
      email: 'garcom@qrorder.local',
      password: 'password123',
      fullName: 'Garçom Silva',
      role: 'GARCOM',
    })

    await browserContext.loginAs(waiter)

    const page = await browserContext.visit('/admin/catalog')
    // RoleMiddleware retorna 403 Forbidden com resposta em json/texto
    await page.assertText('body', JSON.stringify({ message: 'Acesso negado para o seu perfil' }))
  })

  test('administrador autenticado consegue acessar todas as telas administrativas e interagir com as interfaces', async ({
    browserContext,
  }) => {
    const admin = await User.create({
      email: 'gestor@qrorder.local',
      password: 'password123',
      fullName: 'Gestor Restaurante',
      role: 'ADMIN',
    })

    await browserContext.loginAs(admin)

    // 1. Acesso ao Catálogo de Produtos e Categorias
    const catalogPage = await browserContext.visit('/admin/catalog')
    await catalogPage.assertPath('/admin/catalog')
    await catalogPage.assertVisible('h1')
    await catalogPage.assertText('h1', 'Catálogo & Cardápio')
    await catalogPage.assertVisible('header.sticky')
    await catalogPage.assertTextContains('header.sticky', 'ADMIN')
    await catalogPage.assertTextContains('header.sticky', 'Gestor Restaurante')

    // Interação com modal de criação no catálogo
    await catalogPage.click('button:has-text("Nova Categoria")')
    await catalogPage.assertVisible('h2:has-text("Nova Categoria")')
    await catalogPage.click('button:has-text("×")')

    // 2. Acesso à Gestão de Mesas
    const tablesPage = await browserContext.visit('/admin/tables')
    await tablesPage.assertPath('/admin/tables')
    await tablesPage.assertVisible('h1')
    await tablesPage.assertText('h1', 'Gestão de Mesas')
    await tablesPage.assertVisible('text=Imprimir Etiquetas A4')
    await tablesPage.assertVisible('text=Cadastrar Mesa')

    // 3. Acesso à Gestão de Staff / Colaboradores
    const staffPage = await browserContext.visit('/admin/staff')
    await staffPage.assertPath('/admin/staff')
    await staffPage.assertVisible('h1')
    await staffPage.assertText('h1', 'Equipe & Colaboradores')
    await staffPage.assertVisible('text=Novo Colaborador')
  })

  test('gerente consegue acessar o catálogo, mas é bloqueado nas rotas restritas a ADMIN (/admin/tables e /admin/staff)', async ({
    browserContext,
  }) => {
    const manager = await User.create({
      email: 'gerente@qrorder.local',
      password: 'password123',
      fullName: 'Gerente Geral',
      role: 'GERENTE',
    })

    await browserContext.loginAs(manager)

    // Gerente tem permissão em /admin/catalog (middleware role ADMIN, GERENTE)
    const catalogPage = await browserContext.visit('/admin/catalog')
    await catalogPage.assertPath('/admin/catalog')
    await catalogPage.assertText('h1', 'Catálogo & Cardápio')

    // Gerente NÃO tem permissão em /admin/tables (apenas ADMIN)
    await catalogPage.goto('/admin/tables')
    await catalogPage.assertText(
      'body',
      JSON.stringify({ message: 'Acesso negado para o seu perfil' })
    )

    // Gerente NÃO tem permissão em /admin/staff (apenas ADMIN)
    await catalogPage.goto('/admin/staff')
    await catalogPage.assertText(
      'body',
      JSON.stringify({ message: 'Acesso negado para o seu perfil' })
    )
  })

  test('jornada completa E2E: formulário de login -> navegação admin -> logout', async ({
    visit,
  }) => {
    await User.create({
      email: 'owner@qrorder.local',
      password: 'password123',
      fullName: 'Proprietário Admin',
      role: 'ADMIN',
    })

    // Passo 1: Acessa a página de login
    const page = await visit('/login')
    await page.assertPath('/login')

    // Passo 2: Preenche o formulário de login na interface real
    await page.fill('input[name="email"]', 'owner@qrorder.local')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Aguarda autenticação e redirecionamento inicial para /admin/hub
    await page.waitForURL('**/admin/hub')
    await page.assertPath('/admin/hub')

    // Passo 3: Navega para a área de admin agora que está devidamente autenticado
    await page.goto('/admin/catalog')
    await page.assertPath('/admin/catalog')
    await page.assertText('h1', 'Catálogo & Cardápio')

    // Valida dados do usuário na barra superior staff
    await page.assertVisible('header.sticky')
    await page.assertTextContains('header.sticky', 'Proprietário Admin')
    await page.assertTextContains('header.sticky', 'ADMIN')

    // Passo 4: Clica nos links do menu da barra de navegação staff para transitar entre telas admin
    await page.click('header.sticky a[href="/admin/tables"]')
    await page.waitForURL('**/admin/tables')
    await page.assertPath('/admin/tables')
    await page.assertText('h1', 'Gestão de Mesas')

    await page.click('header.sticky a[href="/admin/staff"]')
    await page.waitForURL('**/admin/staff')
    await page.assertPath('/admin/staff')
    await page.assertText('h1', 'Equipe & Colaboradores')

    // Passo 5: Clica no botão de logout ("Sair")
    await page.click('header.sticky button:has-text("Sair")')

    // SessionController destroy finaliza a sessão e redireciona para /login
    await page.waitForURL('**/login')
    await page.assertPath('/login')

    // Passo 6: Confirma que após logout, nova tentativa de acessar /admin/catalog redireciona para /login
    await page.goto('/admin/catalog')
    await page.waitForURL('**/login')
    await page.assertPath('/login')
  })
})
