# TASK-13: Seeder Inicial e Configuração do Sistema

- **ID:** `TASK-13`
- **Feature:** `FEATURE-11: Provisionamento e Seeders Iniciais do Sistema`
- **Responsável Sugerido:** Dev-1
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Focado em banco de dados, orquestração de seeders e testes de carga/idempotência)
- **Dependências:** TASK-01 (RBAC e Model de Usuário), TASK-02 (Catalog Seeder), TASK-04 (Table Seeder)

---

## 1. Objetivo e Contexto

Dotar o sistema **QR-Order** de uma infraestrutura robusta, idempotente e automatizada de seed inicial do banco de dados através do comando padrão do framework:

```bash
node ace db:seed
```

O objetivo central é garantir que, imediatamente após a execução do seed em uma base recém-migrada (ou já existente), a aplicação fique **100% operacional** para testes, demonstrações ou homologação:

1. **Usuário Owner / Administrador Geral (`ADMIN`)**: Acesso irrestrito a configurações, cadastro de colaboradores, impressão de QR Codes e gestão do cardápio.
2. **Equipe Operacional Staff Padrão**: 1 colaborador pré-configurado para cada papel do negócio (`GERENTE`, `GARCOM`, `COZINHA`, `CAIXA`) com credenciais conhecidas e documentadas.
3. **Catálogo Completo Gastronômico**: 4 categorias estruturadas e 12 pratos/bebidas com fotografias de alta resolução, preços em reais, tags nutricionais e disponibilidade ativa (`02_catalog_seeder.ts`).
4. **Infraestrutura Física do Salão**: Mesas de 1 a 15 geradas com capacidades realistas (2, 4 e 6 lugares), status inicial `LIVRE` e tokens criptográficos únicos de 32 caracteres hexadecimais prontos para leitura dos QR Codes (`03_table_seeder.ts`).
5. **Idempotência Absoluta**: O comando deve poder ser executado repetidas vezes sem duplicar linhas nem disparar erros de unicidade (`UNIQUE constraint failed`).

---

## 2. Regras de Negócio e Princípios Arquiteturais

- **RN-07.1 (Papéis Operacionais do Sistema):** O sistema possui 5 perfis de acesso: `ADMIN`, `GERENTE`, `GARCOM`, `COZINHA`, `CAIXA`. O seeder inicial deve provisionar ao menos um usuário ativo para cada perfil.
- **RN-07.2 (Criptografia de Credenciais):** Todas as senhas devem ser persistidas utilizando o driver de hash seguro do AdonisJS v6 (scrypt/argon2 via mixin `withAuthFinder`), nunca em texto puro.
- **RN-07.3 (Unicidade de Identificação):** O campo `email` é a chave única natural de cada usuário.
- **RN-SEED.1 (Idempotência Absoluta via `updateOrCreate`):** O seeder de usuários deve utilizar obrigatoriamente `User.updateOrCreate({ email: staff.email }, staffData)` buscando pela chave única de email. Caso o registro já exista, os dados cadastrais e permissões devem ser sincronizados sem falhas de banco.
- **RN-SEED.2 (Customização Segura via Variáveis de Ambiente):** O seeder deve permitir a sobreposição das credenciais do Administrador Geral e da equipe através de variáveis de ambiente (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, etc.), mantendo fallbacks amigáveis para o ambiente de desenvolvimento local.
- **RN-SEED.3 (Orquestração por Ordem Natural):** Os arquivos de seeder em `database/seeders/` devem seguir o padrão numérico de prefixo:
  - `01_user_seeder.ts`
  - `02_catalog_seeder.ts`
  - `03_table_seeder.ts`

---

## 3. Escopo Técnico Backend

### 3.1. Seeder de Usuários e Staff (`database/seeders/01_user_seeder.ts`)

O seeder deve instanciar o Owner/Administrador Geral e a equipe operacional com senhas criptografadas automaticamente pelo hook `beforeSave` do model `User`:

```typescript
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
```

> **Nota Técnica de Hashing:** No model `User`, o mixin `withAuthFinder(hash)` define a interceptação `hashPassword` via `beforeSave`. Quando `updateOrCreate` altera ou cria o registro com a nova senha em texto plano (`$dirty.password = true`), o hash é gerado transparentemente.

---

### 3.2. Configurações de Ambiente (`start/env.ts` e `.env.example`)

Definição das variáveis de ambiente opcionais no validador do AdonisJS:

#### Em `start/env.ts`:

```typescript
  // Seeders & Initial Provisioning (Opcionais)
  SEED_ADMIN_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_ADMIN_PASSWORD: Env.schema.string.optional(),
  SEED_ADMIN_NAME: Env.schema.string.optional(),
  SEED_MANAGER_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_MANAGER_PASSWORD: Env.schema.string.optional(),
  SEED_WAITER_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_WAITER_PASSWORD: Env.schema.string.optional(),
  SEED_KITCHEN_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_KITCHEN_PASSWORD: Env.schema.string.optional(),
  SEED_CASHIER_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_CASHIER_PASSWORD: Env.schema.string.optional(),
```

#### Em `.env.example`:

```ini
# Seed Provisioning (Opcional - Defaults em 01_user_seeder.ts)
# SEED_ADMIN_EMAIL=admin@qrorder.local
# SEED_ADMIN_PASSWORD=admin123456
# SEED_ADMIN_NAME=Administrador Geral
```

---

### 3.3. Orquestração e Idempotência dos Seeders Existentes

Para que a tríade funcione perfeitamente:

1. **`01_user_seeder.ts`**:
   - Criação/Atualização dos 5 usuários por email via `User.updateOrCreate()`.
2. **`02_catalog_seeder.ts`**:
   - Já utiliza `Category.firstOrCreate({ slug })` e `Product.firstOrCreate({ categoryId, name })`.
   - Totalmente idempotente.
3. **`03_table_seeder.ts`**:
   - Utiliza `Table.updateOrCreate({ number })`.
   - **Refinamento de Idempotência:** Assegurar que caso a mesa já possua um `token`, este seja preservado para evitar invalidar QR Codes físicos previamente impressos durante sucessivos seeds em ambiente ativo:
   ```typescript
   for (let i = 1; i <= 15; i++) {
     const existingTable = await Table.findBy('number', i)
     await Table.updateOrCreate(
       { number: i },
       {
         number: i,
         capacity: i <= 5 ? 2 : i <= 12 ? 4 : 6,
         status: existingTable ? existingTable.status : 'LIVRE',
         token: existingTable?.token || randomBytes(16).toString('hex'),
       }
     )
   }
   ```

---

## 4. Matriz de Credenciais Padrão (Ambiente Local & Homologação)

| Perfil            | Nome Completo       | E-mail de Acesso        | Senha Padrão  | Papel (Role) | Telas & Rotas Principais de Acesso                                                                                 |
| :---------------- | :------------------ | :---------------------- | :------------ | :----------- | :----------------------------------------------------------------------------------------------------------------- |
| **Owner / Admin** | Administrador Geral | `admin@qrorder.local`   | `admin123456` | `ADMIN`      | `/admin/tables`, `/admin/tables/print`, `/admin/staff`, `/admin/categories`, `/admin/products`, `/admin/dashboard` |
| **Gerente**       | Gerente Geral       | `gerente@qrorder.local` | `gerente123`  | `GERENTE`    | `/admin/dashboard`, `/staff/tables`                                                                                |
| **Garçom**        | Garçom Atendimento  | `garcom@qrorder.local`  | `garcom123`   | `GARCOM`     | `/staff/tables` (Grid de mesas, lançar pedidos, liberar mesas)                                                     |
| **Cozinha**       | Chefe de Cozinha    | `cozinha@qrorder.local` | `cozinha123`  | `COZINHA`    | `/staff/kds` (Display Kanban de pedidos, transições de status)                                                     |
| **Caixa**         | Operador de Caixa   | `caixa@qrorder.local`   | `caixa123`    | `CAIXA`      | Fechamento de contas e recebimento de pagamentos                                                                   |

---

## 5. Critérios de Aceitação

1. **Execução Completa sem Erros:** O comando `node ace db:seed` deve executar todos os seeders na ordem `01 -> 02 -> 03` e terminar com código de saída 0 sem warnings ou exceções.
2. **Idempotência Comprovada:** Executar `node ace db:seed` repetidas vezes (mínimo 3 vezes seguidas) na mesma base não gera erros de chave única (`UNIQUE constraint failed`) e mantém a contagem exata de registros.
3. **Verificação de Credenciais:** Todos os 5 usuários gerados conseguem validar login via `User.verifyCredentials(email, password)`.
4. **Prontidão Imediata da Aplicação:**
   - 5 usuários ativos no banco (`isActive: true`).
   - 4 categorias (`entradas`, `principais`, `sobremesas`, `bebidas`).
   - 12 produtos cadastrados, todos vinculados às suas respectivas categorias com imagens, preços e tags.
   - 15 mesas cadastradas (números 1 a 15) com tokens hex válidos e status `LIVRE`.
5. **Sobrescrita via Env:** Se a variável `SEED_ADMIN_EMAIL=custom_admin@test.com` for definida, o seeder cria/atualiza o usuário com o e-mail customizado.

---

## 6. Testes Automatizados (Japa)

Arquivo de teste funcional a ser implementado em `tests/functional/seeders/db_seed.spec.ts`:

```typescript
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'
import Table from '#models/table'
import UserSeeder from '#database/seeders/01_user_seeder'
import CatalogSeeder from '#database/seeders/02_catalog_seeder'
import TableSeeder from '#database/seeders/03_table_seeder'

test.group('Database Seeders | Provisionamento Inicial', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
  })

  test('deve provisionar admin e todo o staff com credenciais funcionais', async ({ assert }) => {
    const userSeeder = new UserSeeder()
    await userSeeder.run()

    const users = await User.all()
    assert.lengthOf(users, 5)

    // Testa verificação de credenciais para cada role
    const admin = await User.verifyCredentials('admin@qrorder.local', 'admin123456')
    assert.isNotNull(admin)
    assert.equal(admin.role, 'ADMIN')
    assert.isTrue(admin.isActive)

    const waiter = await User.verifyCredentials('garcom@qrorder.local', 'garcom123')
    assert.isNotNull(waiter)
    assert.equal(waiter.role, 'GARCOM')

    const kitchen = await User.verifyCredentials('cozinha@qrorder.local', 'cozinha123')
    assert.isNotNull(kitchen)
    assert.equal(kitchen.role, 'COZINHA')

    const manager = await User.verifyCredentials('gerente@qrorder.local', 'gerente123')
    assert.isNotNull(manager)
    assert.equal(manager.role, 'GERENTE')

    const cashier = await User.verifyCredentials('caixa@qrorder.local', 'caixa123')
    assert.isNotNull(cashier)
    assert.equal(cashier.role, 'CAIXA')
  })

  test('deve garantir idempotência absoluta ao re-executar seeders consecutivamente', async ({
    assert,
  }) => {
    const userSeeder = new UserSeeder()
    const catalogSeeder = new CatalogSeeder()
    const tableSeeder = new TableSeeder()

    // Primeira execução
    await userSeeder.run()
    await catalogSeeder.run()
    await tableSeeder.run()

    // Segunda execução consecutiva
    await userSeeder.run()
    await catalogSeeder.run()
    await tableSeeder.run()

    const usersCount = await User.query().count('* as total')
    const categoriesCount = await Category.query().count('* as total')
    const productsCount = await Product.query().count('* as total')
    const tablesCount = await Table.query().count('* as total')

    assert.equal(Number((usersCount[0] as any).total), 5)
    assert.equal(Number((categoriesCount[0] as any).total), 4)
    assert.equal(Number((productsCount[0] as any).total), 12)
    assert.equal(Number((tablesCount[0] as any).total), 15)
  })

  test('deve preservar os tokens existentes das mesas na re-execução', async ({ assert }) => {
    const tableSeeder = new TableSeeder()
    await tableSeeder.run()

    const table1Before = await Table.findByOrFail('number', 1)
    const tokenBefore = table1Before.token

    await tableSeeder.run()

    const table1After = await Table.findByOrFail('number', 1)
    assert.equal(table1After.token, tokenBefore)
  })
})
```

---

## 7. Critérios de Conclusão (Definition of Done - DoD)

- [ ] `database/seeders/01_user_seeder.ts` criado com todos os 5 papéis e suporte a `updateOrCreate`.
- [ ] Refinamento em `database/seeders/03_table_seeder.ts` para preservação de tokens em re-execuções.
- [ ] Variáveis de ambiente configuradas em `start/env.ts` e documentadas em `.env.example`.
- [ ] Execução manual de `node ace db:seed` realizada com sucesso.
- [ ] Testes automatizados do Japa implementados em `tests/functional/seeders/db_seed.spec.ts` com 100% de sucesso.
- [ ] Documentação indexada em `docs/tasks/README.md`.
- [ ] Nota "Plano de Desenvolvimento" no canvas do Maestri atualizada.
