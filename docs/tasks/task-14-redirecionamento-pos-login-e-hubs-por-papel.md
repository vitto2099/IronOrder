# TASK-14: Redirecionamento Pós-Login e Hubs por Papel Operacional

- **ID:** `TASK-14`
- **Feature:** `FEATURE-12: Roteamento Inteligente Pós-Login & Hubs Operacionais`
- **Responsável Sugerido:** Dev-3
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa de forma desacoplada dos módulos de BI e Seed)
- **Dependências:** TASK-01 (RBAC e User Model), TASK-03 (Catalog Admin), TASK-07 (KDS), TASK-10 (Painel Salão/Garçom), TASK-11 (Admin Tables/Staff)

---

## 1. Objetivo e Contexto

Prover uma experiência de entrada e navegação fluida, intuitiva e segura para todos os operadores do sistema **QR-Order**. Atualmente, ao concluir a autenticação na tela `/login`, todos os colaboradores são direcionados indiscriminadamente para a rota raiz (`/`), obrigando garçons, cozinheiros e administradores a navegarem manualmente até suas respectivas áreas de trabalho.

Esta funcionalidade introduz o **Roteamento Inteligente Pós-Login**, que:

1. Identifica o papel operacional do colaborador autenticado (`ADMIN`, `GERENTE`, `GARCOM`, `COZINHA`, `CAIXA`) e o encaminha imediatamente para o seu **Hub Central** ou destino operacional direto.
2. Fornece o **Hub do Administrador** (`/admin/hub`) com cards e atalhos rápidos para todos os módulos gerenciais (Colaboradores, Mesas/QR Codes, Catálogo, Salão, KDS e BI).
3. Fornece o **Hub do Gerente** (`/manager/hub`) contendo visão integrada de salão, cozinha, catálogo e relatórios de vendas.
4. Direciona os perfis de linha de frente diretamente para suas ferramentas de trabalho:
   - **`GARCOM`** ➔ Grid de Mesas do Salão (`/staff/tables`)
   - **`COZINHA`** ➔ KDS Kanban da Cozinha (`/kds` / `/staff/kds`)
5. Fornece a rota e interface do **Hub do Caixa** (`/cashier/hub` ou `/staff/cashier`) para conferência e liquidação de comandas que solicitaram a conta.
6. Garante que qualquer colaborador já logado que acesse a URL raiz (`/`) ou a página de login (`/login`) seja automaticamente redirecionado para o seu hub específico.

---

## 2. Regras de Negócio e Referências de Arquitetura

- **RN-HUB.1 (Mapeamento de Destinos por Papel):**
  - `ADMIN`: Redirecionar para `/admin/hub`.
  - `GERENTE`: Redirecionar para `/manager/hub`.
  - `GARCOM`: Redirecionar para `/staff/tables`.
  - `COZINHA`: Redirecionar para `/kds` (com rota `/staff/kds` atuando como alias).
  - `CAIXA`: Redirecionar para `/cashier/hub`.
- **RN-HUB.2 (Interceptação de Visitantes Autenticados em `/login` e `/signup`):**
  - O `GuestMiddleware` deve inspecionar o papel do usuário autenticado e efetuar redirect 302 para seu hub correspondente em vez da rota estática `/`.
- **RN-HUB.3 (Interceptação de Visitantes Autenticados na Raiz `/`):**
  - A rota raiz (`/`) deve verificar se há sessão ativa (`auth.check()`). Se houver, efetua redirect 302 para o hub daquele papel. Se anônimo, renderiza a página institucional `home.tsx`.
- **RN-HUB.4 (Endpoint Universal `/hub`):**
  - Disponibilizar rota protegida `GET /hub` que atua como resolvedor universal, direcionando qualquer colaborador autenticado para sua página inicial correta.
- **RN-HUB.5 (Proteção Rígida de RBAC nos Hubs):**
  - `/admin/hub`: Restrito exclusivamente a `ADMIN` (HTTP 403 para os demais).
  - `/manager/hub`: Permitido para `GERENTE` e `ADMIN`.
  - `/cashier/hub`: Permitido para `CAIXA`, `GERENTE` e `ADMIN`.

---

## 3. Matriz de Destinos e Conteúdo por Perfil

| Perfil        | Destino Primário | Tipo de Interface        | Módulos e Atalhos Acessíveis                                                                                                                                                                                                                                                                    |
| :------------ | :--------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ADMIN`**   | `/admin/hub`     | **Hub do Administrador** | • 👥 Colaboradores (`/admin/staff`)<br>• 🪑 Mesas & Impressão A4 (`/admin/tables`)<br>• 📋 Catálogo & Pratos (`/admin/catalog`)<br>• 🍽️ Salão & Mesas (`/staff/tables`)<br>• 🍳 KDS Cozinha (`/kds`)<br>• 📊 Dashboard BI (`/admin/dashboard`)<br>• Resumo em tempo real de ocupação e pedidos. |
| **`GERENTE`** | `/manager/hub`   | **Hub de Operações**     | • 🍽️ Monitoramento de Mesas (`/staff/tables`)<br>• 🍳 Fila do KDS (`/kds`)<br>• 📋 Disponibilidade do Cardápio (`/admin/catalog`)<br>• 📊 Dashboard de Faturamento (`/admin/dashboard`)<br>• Indicadores de giro de mesas e tempos de atendimento.                                              |
| **`GARCOM`**  | `/staff/tables`  | **Operacional Salão**    | • Grid de Mesas coloridas por status (Livre, Ocupada, Conta Pedida).<br>• Lançamento manual de pedidos e baixa de entrega.                                                                                                                                                                      |
| **`COZINHA`** | `/kds`           | **Display KDS**          | • Kanban de produção em tempo real (Pendente, Preparando, Pronto).<br>• Timer por comanda e avisos de atraso.                                                                                                                                                                                   |
| **`CAIXA`**   | `/cashier/hub`   | **Controle de Caixa**    | • Lista de comandas solicitando fechamento (`CONTA_PEDIDA`).<br>• Extrato consolidado por mesa e membro/alias.<br>• Confirmação de recebimento e liberação da mesa.                                                                                                                             |

---

## 4. Escopo Técnico Backend

### 4.1. Serviço Centralizado de Navegação (`app/services/role_navigation_service.ts`)

Centralizar a lógica de destinos por perfil para reuso em controllers e middlewares:

```typescript
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
```

### 4.2. Atualização do `GuestMiddleware` (`app/middleware/guest_middleware.ts`)

Modificar a resposta do middleware para que usuários já autenticados sejam direcionados ao seu hub:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { RoleNavigationService } from '#services/role_navigation_service'

export default class GuestMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  ) {
    for (let guard of options.guards || [ctx.auth.defaultGuard]) {
      if (await ctx.auth.use(guard).check()) {
        ctx.session.reflash()
        const user = ctx.auth.use(guard).user
        const target = user ? RoleNavigationService.getHomeRoute(user.role) : '/'
        return ctx.response.redirect(target, true)
      }
    }

    return next()
  }
}
```

### 4.3. Atualização do `SessionController` (`app/controllers/session_controller.ts`)

Ao realizar login com sucesso, aplicar o redirecionamento dinâmico:

```typescript
import User from '#models/user'
import { loginValidator } from '#validators/user'
import { RoleNavigationService } from '#services/role_navigation_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ auth, inertia, response }: HttpContext) {
    if (await auth.check()) {
      return response.redirect(RoleNavigationService.getHomeRoute(auth.user!.role))
    }
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    await auth.use('web').login(user)
    return response.redirect(RoleNavigationService.getHomeRoute(user.role))
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
```

### 4.4. Controlador de Hubs (`app/controllers/staff/hub_controller.ts`)

Controlador responsável por alimentar as telas de Hub com métricas resumidas e links operacionais:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Table from '#models/table'
import Order from '#models/order'
import Tab from '#models/tab'
import User from '#models/user'
import { RoleNavigationService } from '#services/role_navigation_service'

export default class HubController {
  /**
   * Resolvedor universal de Hub
   */
  async redirect({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.redirect(RoleNavigationService.getHomeRoute(user.role))
  }

  /**
   * Hub do Administrador Geral
   */
  async adminHub({ inertia }: HttpContext) {
    const [tables, pendingOrders, staffMembers, openTabs] = await Promise.all([
      Table.all(),
      Order.query().whereIn('status', ['PENDENTE', 'EM_PREPARO']),
      User.query().where('isActive', true),
      Tab.query().where('status', 'ABERTA'),
    ])

    const totalTables = tables.length
    const occupiedTables = tables.filter((t) => t.status === 'OCUPADA').length
    const freeTables = tables.filter((t) => t.status === 'LIVRE').length

    return inertia.render('admin/hub', {
      stats: {
        totalTables,
        occupiedTables,
        freeTables,
        pendingOrdersCount: pendingOrders.length,
        activeStaffCount: staffMembers.length,
        openTabsCount: openTabs.length,
      },
    })
  }

  /**
   * Hub do Gerente
   */
  async managerHub({ inertia }: HttpContext) {
    const [tables, pendingOrders, openTabs] = await Promise.all([
      Table.all(),
      Order.query().whereIn('status', ['PENDENTE', 'EM_PREPARO']),
      Tab.query().where('status', 'ABERTA'),
    ])

    return inertia.render('manager/hub', {
      stats: {
        occupiedTables: tables.filter((t) => t.status === 'OCUPADA').length,
        freeTables: tables.filter((t) => t.status === 'LIVRE').length,
        pendingOrdersCount: pendingOrders.length,
        openTabsCount: openTabs.length,
      },
    })
  }

  /**
   * Hub / Painel do Caixa
   */
  async cashierHub({ inertia }: HttpContext) {
    const tabsAwaitingPayment = await Tab.query()
      .where('status', 'ABERTA')
      .preload('table')
      .preload('members')
      .preload('orders', (orderQuery) => {
        orderQuery.whereNot('status', 'CANCELADO').preload('items')
      })
      .orderBy('openedAt', 'asc')

    return inertia.render('cashier/hub', {
      tabs: tabsAwaitingPayment,
    })
  }
}
```

### 4.5. Configuração de Rotas (`start/routes.ts`)

```typescript
const HubController = () => import('#controllers/staff/hub_controller')

// Rota raiz inteligente
router
  .get('/', async ({ auth, response, inertia }) => {
    if (await auth.check()) {
      const { RoleNavigationService } = await import('#services/role_navigation_service')
      return response.redirect(RoleNavigationService.getHomeRoute(auth.user!.role))
    }
    return inertia.render('home', {})
  })
  .as('home')

// Resolvedor universal de Hub
router.get('/hub', [HubController, 'redirect']).use(middleware.auth()).as('staff.hub.redirect')

// Hubs específicos protegidos por RBAC
router
  .group(() => {
    router.get('/hub', [HubController, 'adminHub']).as('admin.hub')
  })
  .prefix('/admin')
  .use([middleware.auth(), middleware.role(['ADMIN'])])

router
  .group(() => {
    router.get('/hub', [HubController, 'managerHub']).as('manager.hub')
  })
  .prefix('/manager')
  .use([middleware.auth(), middleware.role(['GERENTE', 'ADMIN'])])

router
  .group(() => {
    router.get('/hub', [HubController, 'cashierHub']).as('cashier.hub')
  })
  .prefix('/cashier')
  .use([middleware.auth(), middleware.role(['CAIXA', 'GERENTE', 'ADMIN'])])

// Alias /staff/kds direcionando para o KDS
router.get('/staff/kds', ({ response }) => response.redirect('/kds'))
```

---

## 5. Escopo Técnico Frontend (Inertia + React)

### 5.1. Hub do Administrador (`inertia/pages/admin/hub.tsx`)

- **Estrutura Visual:**
  - Header acolhedor com saudação, data atual e badge `ADMIN`.
  - Barra de Resumo de Indicadores:
    - 🪑 Mesas (Ocupadas / Livres / Total)
    - 🍳 Pedidos em Fila (Pendentes / Preparando)
    - 👥 Colaboradores Ativos
    - 🧾 Comandas Abertas no Salão
  - Bento Grid com Cards de Navegação Rápida:
    - **Gestão de Colaboradores** (`/admin/staff`): Cadastro de funcionários, redefinição de senhas e papéis.
    - **Mesas & Impressão A4** (`/admin/tables`): Adicionar mesas e imprimir etiquetas prontas com QR Code.
    - **Catálogo & Cardápio** (`/admin/catalog`): Categorias, itens, fotos, preços e toggles de disponibilidade.
    - **Operação do Salão** (`/staff/tables`): Grid visual com status das mesas em tempo real.
    - **Display KDS da Cozinha** (`/kds`): Fila de preparação de comandas para a cozinha.
    - **Dashboard Analítico** (`/admin/dashboard`): Faturamento, mix de vendas e ticket médio.

### 5.2. Hub do Gerente (`inertia/pages/manager/hub.tsx`)

- Focado na supervisão do turno sem expor gestão de senhas e infraestrutura física:
  - Cards: Salão & Mesas, KDS da Cozinha, Catálogo (disponibilidade de itens), Relatórios de Vendas.
  - Indicadores de fluxo do salão e tempo de espera dos pedidos.

### 5.3. Hub do Caixa (`inertia/pages/cashier/hub.tsx`)

- Painel operacional para conferência rápida de contas:
  - Listagem de mesas com comandas ativas, destacando mesas com solicitação de encerramento (`CONTA_PEDIDA`).
  - Totalização de itens e valores consumidos por mesa e por membro.
  - Ação de fechamento de conta e emissão de comprovante/baixa de comanda.

### 5.4. Atualização da Barra de Navegação (`inertia/layouts/staff_layout.tsx`)

- Substituir link estático do logotipo por `/hub`, permitindo que qualquer colaborador clique no logo "M+ Painel Staff" e volte ao seu respectivo ponto de controle.
- Atualizar menu de navegação adicionando o link **"Hub"** ou **"Início"** contextualizado.

---

## 6. Critérios de Aceitação

1. **Redirecionamento Preciso por Papel no Login:**
   - Login com usuário `ADMIN` redireciona para `/admin/hub`.
   - Login com usuário `GERENTE` redireciona para `/manager/hub`.
   - Login com usuário `GARCOM` redireciona para `/staff/tables`.
   - Login com usuário `COZINHA` redireciona para `/kds`.
   - Login com usuário `CAIXA` redireciona para `/cashier/hub`.
2. **Proteção e Redirecionamento da Rota `/`:**
   - Visitante anônimo acessando `/` visualiza a tela inicial de apresentação.
   - Qualquer usuário autenticado acessando `/` é redirecionado para seu hub correspondente.
3. **Proteção e Redirecionamento de `/login` e `/signup`:**
   - Usuário já autenticado tentando acessar `/login` ou `/signup` é imediatamente encaminhado para seu hub.
4. **Respeito às Regras de RBAC:**
   - Garçom tentando forçar acesso a `/admin/hub` ou `/manager/hub` recebe HTTP 403 Forbidden.
   - Cozinheiro tentando forçar acesso a `/cashier/hub` recebe HTTP 403 Forbidden.
5. **Acesso Universal `/hub`:**
   - Acesso autenticado a `/hub` identifica o usuário e o encaminha para o destino correto do seu perfil.
6. **Alias `/staff/kds`:**
   - Acesso a `/staff/kds` redireciona com sucesso para `/kds`.

---

## 7. Testes Automatizados

### 7.1. Testes Funcionais de Rotas e Redirecionamento (`tests/functional/auth/role_redirect.spec.ts`)

```typescript
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Auth | Redirecionamento Inteligente Pós-Login & Hubs', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
  })

  test('ADMIN deve ser redirecionado para /admin/hub após login', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Admin Teste',
      email: 'admin@qrorder.local',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    })

    const response = await client.post('/login').form({
      email: admin.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/admin/hub')
  })

  test('GARCOM deve ser redirecionado diretamente para /staff/tables após login', async ({
    client,
  }) => {
    const waiter = await User.create({
      fullName: 'Garcom Teste',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const response = await client.post('/login').form({
      email: waiter.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/staff/tables')
  })

  test('COZINHA deve ser redirecionada diretamente para /kds após login', async ({ client }) => {
    const chef = await User.create({
      fullName: 'Cozinha Teste',
      email: 'cozinha@qrorder.local',
      password: 'password123',
      role: 'COZINHA',
      isActive: true,
    })

    const response = await client.post('/login').form({
      email: chef.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/kds')
  })

  test('GERENTE deve ser redirecionado para /manager/hub após login', async ({ client }) => {
    const manager = await User.create({
      fullName: 'Gerente Teste',
      email: 'gerente@qrorder.local',
      password: 'password123',
      role: 'GERENTE',
      isActive: true,
    })

    const response = await client.post('/login').form({
      email: manager.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/manager/hub')
  })

  test('CAIXA deve ser redirecionado para /cashier/hub após login', async ({ client }) => {
    const cashier = await User.create({
      fullName: 'Caixa Teste',
      email: 'caixa@qrorder.local',
      password: 'password123',
      role: 'CAIXA',
      isActive: true,
    })

    const response = await client.post('/login').form({
      email: cashier.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/cashier/hub')
  })

  test('usuário autenticado acessando raiz / deve ser redirecionado para seu hub', async ({
    client,
  }) => {
    const admin = await User.create({
      fullName: 'Admin Teste',
      email: 'admin@qrorder.local',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    })

    const response = await client.get('/').loginAs(admin)
    response.assertStatus(302)
    response.assertHeader('location', '/admin/hub')
  })

  test('usuário autenticado acessando /login deve ser redirecionado para seu hub', async ({
    client,
  }) => {
    const waiter = await User.create({
      fullName: 'Garcom Teste',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const response = await client.get('/login').loginAs(waiter)
    response.assertStatus(302)
    response.assertHeader('location', '/staff/tables')
  })

  test('GARCOM tentando acessar /admin/hub deve receber 403 Forbidden', async ({ client }) => {
    const waiter = await User.create({
      fullName: 'Garcom Teste',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const response = await client.get('/admin/hub').loginAs(waiter)
    response.assertStatus(403)
  })
})
```

### 7.2. Testes E2E com Navegador (`tests/browser/role_hubs.spec.ts`)

```typescript
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('E2E Browser: Navegação Pós-Login e Hubs Operacionais', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
  })

  test('login de ADMIN renderiza Admin Hub com cards operacionais e métricas', async ({
    visit,
  }) => {
    await User.create({
      fullName: 'Super Administrador',
      email: 'admin@qrorder.local',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    })

    const page = await visit('/login')
    await page.fill('input[name="email"]', 'admin@qrorder.local')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin/hub')
    await page.assertPath('/admin/hub')
    await page.assertVisible('h1')
    await page.assertTextContains('h1', 'Super Administrador')
    await page.assertVisible('a[href="/admin/staff"]')
    await page.assertVisible('a[href="/admin/tables"]')
    await page.assertVisible('a[href="/admin/catalog"]')
  })

  test('login de GARCOM redireciona visualmente direto para o Grid de Mesas', async ({ visit }) => {
    await User.create({
      fullName: 'Garçom de Salão',
      email: 'garcom@qrorder.local',
      password: 'password123',
      role: 'GARCOM',
      isActive: true,
    })

    const page = await visit('/login')
    await page.fill('input[name="email"]', 'garcom@qrorder.local')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/staff/tables')
    await page.assertPath('/staff/tables')
    await page.assertVisible('h1')
    await page.assertTextContains('h1', 'Mesas')
  })
})
```

---

## 8. Critérios de Conclusão (Definition of Done - DoD)

- [ ] `RoleNavigationService` criado em `app/services/role_navigation_service.ts`.
- [ ] `GuestMiddleware` atualizado para redirecionar conforme o papel do usuário autenticado.
- [ ] `SessionController` atualizado com redirecionamento dinâmico na ação `store`.
- [ ] Rota raiz `/` e endpoint `/hub` configurados com checagem de papel em `start/routes.ts`.
- [ ] Controlador `HubController` implementado com as ações `adminHub`, `managerHub` e `cashierHub`.
- [ ] Páginas Inertia criadas:
  - `inertia/pages/admin/hub.tsx`
  - `inertia/pages/manager/hub.tsx`
  - `inertia/pages/cashier/hub.tsx`
- [ ] `StaffLayout` atualizado com link do logotipo apontando para `/hub`.
- [ ] Suíte de testes funcionais `tests/functional/auth/role_redirect.spec.ts` implementada e passando 100%.
- [ ] Suíte de testes E2E `tests/browser/role_hubs.spec.ts` implementada e validada no navegador.
- [ ] Documento indexado em `docs/tasks/README.md`.
- [ ] Nota do Maestri "Plano de Desenvolvimento" atualizada.
