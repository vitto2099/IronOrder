import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

test.group('E2E: Cadastro de Usuários (/signup)', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('deve renderizar a página de cadastro com campos obrigatórios e botão de registro', async ({
    visit,
  }) => {
    const page = await visit('/signup')

    await page.assertPath('/signup')
    await page.assertVisible('h1:has-text("Signup")')
    await page.assertVisible('input[name="fullName"]')
    await page.assertVisible('input[name="email"]')
    await page.assertVisible('input[name="password"]')
    await page.assertVisible('input[name="passwordConfirmation"]')
    await page.assertVisible('button[type="submit"]')
    await page.assertText('button[type="submit"]', 'Sign up')
  })

  test('deve exibir erros de validação ao submeter formulário em branco ou com confirmação divergente', async ({
    visit,
  }) => {
    const page = await visit('/signup')

    // 1. Submissão vazia
    await page.click('button[type="submit"]')
    await page.waitForSelector('[data-invalid="true"]')
    await page.assertVisible('input[name="email"][data-invalid="true"]')

    // 2. Senha e confirmação diferentes
    await page.fill('input[name="fullName"]', 'Usuário Teste')
    await page.fill('input[name="email"]', 'teste.divergente@qrorder.local')
    await page.fill('input[name="password"]', 'senhaSegura123')
    await page.fill('input[name="passwordConfirmation"]', 'senhaDiferente456')
    await page.click('button[type="submit"]')

    await page.waitForSelector('input[name="passwordConfirmation"][data-invalid="true"]')
    await page.assertVisible('input[name="passwordConfirmation"][data-invalid="true"]')
  })

  test('deve registrar novo usuário com sucesso, persistir no banco e iniciar sessão autenticada', async ({
    visit,
    assert,
  }) => {
    const page = await visit('/signup')

    await page.fill('input[name="fullName"]', 'Juliana Gerente')
    await page.fill('input[name="email"]', 'juliana.gerente@qrorder.local')
    await page.fill('input[name="password"]', 'senhaSegura123')
    await page.fill('input[name="passwordConfirmation"]', 'senhaSegura123')
    await page.click('button[type="submit"]')

    // Redireciona com sucesso para seu destino de perfil (/staff/tables)
    await page.waitForURL('**/staff/tables')
    await page.assertPath('/staff/tables')

    // Valida que o usuário foi persistido no banco de dados
    const createdUser = await User.findByOrFail('email', 'juliana.gerente@qrorder.local')
    assert.equal(createdUser.fullName, 'Juliana Gerente')
    assert.isNotNull(createdUser.password)
  })
})
