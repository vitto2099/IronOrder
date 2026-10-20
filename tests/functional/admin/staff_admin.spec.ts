import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

test.group('Admin Staff (Functional HTTP)', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('PRAGMA foreign_keys = OFF')
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON')
  })

  test('a) Acesso a /admin/staff protegido por RBAC (somente ADMIN)', async ({
    client,
    assert,
  }) => {
    // Anônimo
    const guestRes = await client.get('/admin/staff').header('accept', 'application/json')
    assert.equal(guestRes.status(), 401)

    // Gerente
    const manager = await User.create({
      email: 'manager_staff@test.local',
      password: 'password123',
      fullName: 'Gerente Staff',
      role: 'GERENTE',
    })
    const managerRes = await client.get('/admin/staff').loginAs(manager)
    managerRes.assertStatus(403)

    // Garçom
    const waiter = await User.create({
      email: 'waiter_staff@test.local',
      password: 'password123',
      fullName: 'Garçom Staff',
      role: 'GARCOM',
    })
    const waiterRes = await client.get('/admin/staff').loginAs(waiter)
    waiterRes.assertStatus(403)

    // Administrador
    const admin = await User.create({
      email: 'admin_staff@test.local',
      password: 'password123',
      fullName: 'Admin Staff',
      role: 'ADMIN',
    })
    const adminRes = await client.get('/admin/staff').loginAs(admin)
    adminRes.assertStatus(200)
  })

  test('b) Cadastro de colaborador com papéis válidos e senha criptografada', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin_creator@test.local',
      password: 'password123',
      fullName: 'Admin Creator',
      role: 'ADMIN',
    })

    const roles = ['GERENTE', 'GARCOM', 'CAIXA', 'COZINHA'] as const

    for (const role of roles) {
      const res = await client
        .post('/admin/staff')
        .loginAs(admin)
        .withCsrfToken()
        .json({
          fullName: `Colaborador ${role}`,
          email: `${role.toLowerCase()}@restaurante.com`,
          password: 'secretPassword123',
          role,
        })

      assert.oneOf(res.status(), [200, 201, 302])

      const createdUser = await User.findBy('email', `${role.toLowerCase()}@restaurante.com`)
      assert.isNotNull(createdUser)
      assert.equal(createdUser?.role, role)
      assert.isTrue(Boolean(createdUser?.isActive))

      // Verifica criptografia da senha
      const isPasswordValid = await hash.verify(createdUser!.password, 'secretPassword123')
      assert.isTrue(isPasswordValid)
    }
  })

  test('c) Bloqueio de e-mail duplicado e validações de dados inválidos', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'superadmin@test.local',
      password: 'password123',
      fullName: 'Super Admin',
      role: 'ADMIN',
    })

    await User.create({
      email: 'existente@test.local',
      password: 'password123',
      fullName: 'Operador Existente',
      role: 'GARCOM',
    })

    // Tentativa de duplicar e-mail existente
    const dupRes = await client
      .post('/admin/staff')
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        fullName: 'Outro Operador',
        email: 'existente@test.local',
        password: 'password1234',
        role: 'CAIXA',
      })
    assert.oneOf(dupRes.status(), [400, 422])

    // Senha com menos de 8 caracteres
    const shortPassRes = await client
      .post('/admin/staff')
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        fullName: 'Operador Curto',
        email: 'curto@test.local',
        password: '123',
        role: 'GARCOM',
      })
    assert.oneOf(shortPassRes.status(), [400, 422])
  })

  test('d) Toggle de status ativo/inativo e proteção contra auto-desativação do admin', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'main_admin@test.local',
      password: 'password123',
      fullName: 'Main Admin',
      role: 'ADMIN',
      isActive: true,
    })

    const employee = await User.create({
      email: 'employee@test.local',
      password: 'password123',
      fullName: 'Employee Test',
      role: 'GARCOM',
      isActive: true,
    })

    // Desativar colaborador
    const toggleRes1 = await client
      .patch(`/admin/staff/${employee.id}/status`)
      .loginAs(admin)
      .withCsrfToken()
    assert.oneOf(toggleRes1.status(), [200, 302])

    await employee.refresh()
    assert.isFalse(Boolean(employee.isActive))

    // Reativar colaborador
    const toggleRes2 = await client
      .patch(`/admin/staff/${employee.id}/status`)
      .loginAs(admin)
      .withCsrfToken()
    assert.oneOf(toggleRes2.status(), [200, 302])

    await employee.refresh()
    assert.isTrue(Boolean(employee.isActive))

    // Tentativa de auto-desativação do admin logado deve ser bloqueada
    const selfToggleRes = await client
      .patch(`/admin/staff/${admin.id}/status`)
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
    assert.oneOf(selfToggleRes.status(), [400, 403, 422])

    await admin.refresh()
    assert.isTrue(Boolean(admin.isActive))
  })

  test('e) Reset de senha do colaborador pelo administrador', async ({ client, assert }) => {
    const admin = await User.create({
      email: 'boss@test.local',
      password: 'password123',
      fullName: 'Boss Admin',
      role: 'ADMIN',
    })

    const staffMember = await User.create({
      email: 'staff_reset@test.local',
      password: 'oldPassword123',
      fullName: 'Staff Reset',
      role: 'GARCOM',
    })

    const resetRes = await client
      .patch(`/admin/staff/${staffMember.id}/reset-password`)
      .loginAs(admin)
      .withCsrfToken()
      .json({
        password: 'brandNewPassword999',
      })
    assert.oneOf(resetRes.status(), [200, 302])

    await staffMember.refresh()
    const isNewPasswordValid = await hash.verify(staffMember.password, 'brandNewPassword999')
    assert.isTrue(isNewPasswordValid)
  })
})
