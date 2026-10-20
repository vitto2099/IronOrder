# TASK-01: Setup da Base de Dados, Tailwind CSS, Componentes Base e RBAC de Staff

- **ID:** `TASK-01`
- **Feature:** `FEATURE-01: Fundação de Infraestrutura & Controle de Acesso de Staff`
- **Responsável Sugerido:** Dev-1 (ou Kick-off Conjunto)
- **Status:** Planejada
- **Paralelizável:** ⚠️ Base Arquitetural (deve ser priorizada para destravar o setup visual e modelo de usuário compartilhado)

---

## 1. Objetivo e Contexto

Estabelecer a base técnica inicial da aplicação AdonisJS v6 + InertiaJS (React), configurando o motor de estilos **Tailwind CSS** (essencial para renderizar fielmente a interface definida em [menu-example.tsx](../../design/menu-example.tsx)), integrando a coluna de papéis de acesso (**RBAC**) no model e migração de `users` (conforme **RN-07.1** e **RN-07.4**), criando o middleware `RoleGuardMiddleware` e fornecendo o layout mestre para as áreas autenticadas do Staff.

---

## 2. Regras de Negócio e Referências de Arquitetura

- **RN-07.1 (Papéis de Acesso):** Papéis fixos: `ADMIN`, `GERENTE`, `GARCOM`, `CAIXA`, `COZINHA`.
- **RN-07.4 (Proteção de Rotas Administrativas):** Perfis operacionais (`GARCOM`, `COZINHA`) não podem acessar rotas de configurações gerais, relatórios avançados ou gestão de funcionários (retornar HTTP 403).
- **ADR-001:** Persistência em SQLite Local (`better-sqlite3`).
- **ADR-002:** Arquitetura monolítica com Inertia.js React.

---

## 3. Escopo Técnico Backend

### 3.1. Migrations e Banco de Dados

- Criar migration `database/migrations/xxxx_add_role_to_users_table.ts`:
  ```typescript
  // Adiciona coluna role com enum/string
  table.string('role', 30).notNullable().defaultTo('GARCOM')
  table.boolean('is_active').notNullable().defaultTo(true)
  ```
- Criar seeder `database/seeders/01_staff_seeder.ts` para provisionar o primeiro usuário administrativo de desenvolvimento:
  - `email`: `admin@qrorder.local`
  - `password`: `admin123456`
  - `fullName`: `Administrador Geral`
  - `role`: `ADMIN`

### 3.2. Models Lucid

- Atualizar `app/models/user.ts`:
  - Declarar propriedade `role`: `'ADMIN' | 'GERENTE' | 'GARCOM' | 'CAIXA' | 'COZINHA'`.
  - Declarar propriedade `isActive`: `boolean`.
  - Adicionar helpers de autorização:
    ```typescript
    get isAdmin(): boolean { return this.role === 'ADMIN' }
    get isGerente(): boolean { return this.role === 'GERENTE' }
    get isWaiter(): boolean { return this.role === 'GARCOM' }
    get isKitchen(): boolean { return this.role === 'COZINHA' }
    get isCashier(): boolean { return this.role === 'CAIXA' }
    ```

### 3.3. Validações VineJS

- Atualizar `app/validators/user.ts`:
  - Adicionar validação de `role` no schema de criação e atualização de colaboradores:
    ```typescript
    role: vine.enum(['ADMIN', 'GERENTE', 'GARCOM', 'CAIXA', 'COZINHA'])
    ```

### 3.4. Middleware de Autorização (RBAC)

- Criar `app/middleware/role_guard_middleware.ts`:
  - Interceptar requisição após autenticação (`auth.authenticate()`).
  - Comparar `auth.user.role` com lista de papéis permitidos para a rota.
  - Lançar `Exception` com status HTTP 403 Forbidden caso o papel do usuário logado não conste na lista permitida.
  - Registrar middleware nomeado em `start/kernel.ts`:
    ```typescript
    export const middleware = router.named({
      guest: () => import('#middleware/guest_middleware'),
      auth: () => import('#middleware/auth_middleware'),
      role: () => import('#middleware/role_guard_middleware'),
    })
    ```

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Configuração do Tailwind CSS

- Instalar dependências necessárias (`tailwindcss`, `@tailwindcss/postcss`, `postcss`, etc.).
- Configurar Tailwind e `postcss.config.js`.
- Ajustar `inertia/css/app.css` com as diretivas `@import "tailwindcss";` e manter compatibilidade com tokens de cor e fontes do projeto.
- Garantir suporte às classes utilitárias de cores e layout vistas em `docs/design/menu-example.tsx`.

### 4.2. Layout Base de Staff

- Criar layout reutilizável `inertia/layouts/staff_layout.tsx`:
  - Barra superior ou lateral com logo "QR-Order / Mesa+".
  - Badge visual destacando o papel atual do usuário (`ADMIN`, `GARÇOM`, `COZINHA`, etc.).
  - Links de navegação condicionais de acordo com o perfil:
    - `ADMIN`: Dashboard, Cardápio, Mesas, Colaboradores.
    - `GARCOM`: Salão & Mesas.
    - `COZINHA`: KDS / Fila de Preparo.
  - Ação de logout seguro via POST `/logout`.

### 4.3. Telas e Tipagem TypeScript

- Atualizar `inertia/types.ts` com o contrato do usuário compartilhado:
  ```typescript
  export type UserRole = 'ADMIN' | 'GERENTE' | 'GARCOM' | 'CAIXA' | 'COZINHA'

  export interface AuthUser {
    id: number
    fullName: string | null
    email: string
    role: UserRole
    isActive: boolean
  }

  export interface SharedProps {
    user?: AuthUser
    [key: string]: unknown
  }
  ```
- Atualizar `inertia/pages/auth/login.tsx` com formulário moderno, mensagens de erro inline e loading state.

---

## 5. Critérios de Aceitação

1. **Migrations & Seed:** A execução de `node ace migration:run` e `node ace db:seed` executa sem erros e cria o usuário admin.
2. **Login com RBAC:** Um usuário com papel `ADMIN` faz login e é direcionado para a área administrativa.
3. **Bloqueio 403:** Se uma rota configurada com `middleware.role(['ADMIN'])` for acessada por um usuário autenticado com perfil `GARCOM`, o sistema deve barrar a requisição com HTTP 403 Forbidden.
4. **Tailwind CSS Ativo:** Classes Tailwind são renderizadas perfeitamente pelo Vite no frontend Inertia sem avisos de erro no build.
5. **Tipagem Estrita:** `npm run typecheck` passa com zero erros de TypeScript.

---

## 6. Critérios de Conclusão (Definition of Done - DoD)

- [ ] Migration de role criada e aplicada com sucesso no SQLite local.
- [ ] Model `User` e validator `user.ts` atualizados com typings de papéis.
- [ ] `RoleGuardMiddleware` implementado, registrado e testado com suite de testes funcionais (`tests/functional/auth/role_guard.spec.ts`).
- [ ] Tailwind CSS configurado e validado em `inertia/layouts/staff_layout.tsx`.
- [ ] Página de login funcional consumindo as credenciais do Staff.
- [ ] Código formatado com Prettier e validado com ESLint (`npm run lint`).
