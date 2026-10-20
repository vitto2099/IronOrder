import type { UserRole } from '#models/user'

export class RoleNavigationService {
  /**
   * Retorna a rota inicial de destino de acordo com o papel do usuário
   */
  static getHomeRoute(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return '/admin/hub'
      case 'GERENTE':
        return '/manager/hub'
      case 'GARCOM':
        return '/staff/tables'
      case 'COZINHA':
        return '/kds'
      case 'CAIXA':
        return '/cashier/hub'
      default:
        return '/'
    }
  }
}
