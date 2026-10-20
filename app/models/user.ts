import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

import { column } from '@adonisjs/lucid/orm'

export type UserRole = 'ADMIN' | 'GERENTE' | 'GARCOM' | 'CAIXA' | 'COZINHA'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @column()
  declare role: UserRole

  @column({ consume: (val) => Boolean(val) })
  declare isActive: boolean

  get isAdmin(): boolean {
    return this.role === 'ADMIN'
  }

  get isGerente(): boolean {
    return this.role === 'GERENTE'
  }

  get isWaiter(): boolean {
    return this.role === 'GARCOM'
  }

  get isKitchen(): boolean {
    return this.role === 'COZINHA'
  }

  get isCashier(): boolean {
    return this.role === 'CAIXA'
  }

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
