import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    const staffUsers = [
      {
        fullName: env.get('SEED_ADMIN_NAME', 'Administrador Geral'),
        email: env.get('SEED_ADMIN_EMAIL', 'admin@qrorder.local'),
        password: env.get('SEED_ADMIN_PASSWORD', 'admin123456'),
        role: 'ADMIN' as const,
        isActive: true,
      },
      {
        fullName: env.get('SEED_MANAGER_NAME', 'Gerente Geral'),
        email: env.get('SEED_MANAGER_EMAIL', 'gerente@qrorder.local'),
        password: env.get('SEED_MANAGER_PASSWORD', 'gerente123'),
        role: 'GERENTE' as const,
        isActive: true,
      },
      {
        fullName: env.get('SEED_WAITER_NAME', 'Garçom Atendimento'),
        email: env.get('SEED_WAITER_EMAIL', 'garcom@qrorder.local'),
        password: env.get('SEED_WAITER_PASSWORD', 'garcom123'),
        role: 'GARCOM' as const,
        isActive: true,
      },
      {
        fullName: env.get('SEED_KITCHEN_NAME', 'Chefe de Cozinha'),
        email: env.get('SEED_KITCHEN_EMAIL', 'cozinha@qrorder.local'),
        password: env.get('SEED_KITCHEN_PASSWORD', 'cozinha123'),
        role: 'COZINHA' as const,
        isActive: true,
      },
      {
        fullName: env.get('SEED_CASHIER_NAME', 'Operador de Caixa'),
        email: env.get('SEED_CASHIER_EMAIL', 'caixa@qrorder.local'),
        password: env.get('SEED_CASHIER_PASSWORD', 'caixa123'),
        role: 'CAIXA' as const,
        isActive: true,
      },
    ]

    for (const staff of staffUsers) {
      await User.updateOrCreate(
        { email: staff.email },
        {
          fullName: staff.fullName,
          email: staff.email,
          password: staff.password,
          role: staff.role,
          isActive: staff.isActive,
        }
      )
    }
  }
}
