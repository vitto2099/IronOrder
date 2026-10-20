# TASK-04: TabSessionModule - Mesas, Comandas e TabSessionService

- **ID:** `TASK-04`
- **Feature:** `FEATURE-03: TabSessionModule (Gestão de Mesas, Comandas e Membros)`
- **Responsável Sugerido:** Dev-2
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-02 de Catálogo e TASK-06 de Pedidos)
- **Dependências:** TASK-01

---

## 1. Objetivo e Contexto

Construir a camada de domínio profunda do **TabSessionModule** (ADR-002 e ADR-003). Este módulo gerencia o ciclo de vida das mesas físicas do estabelecimento, o ciclo de vida das comandas financeiras e a associação dinâmica e efêmera de clientes (Aliases) sem necessidade de login formal (**Zero-Auth**). Também calcula o extrato financeiro acumulado da mesa e o subtotal individual de cada cliente (**RN-01, RN-04, RN-05**).

---

## 2. Regras de Negócio e Referências

- **RN-01.1 (Primeiro Acesso):** Se a mesa estiver `LIVRE`, o primeiro cliente altera a mesa para `OCUPADA` e abre uma nova `Comanda`.
- **RN-01.2 (Unicidade de Alias):** Se dois membros usarem o mesmo apelido na mesma comanda, o sistema sufixa automaticamente (ex: "Carlos (2)").
- **RN-04.1 (Transparência de Consumo):** Cálculo financeiro discrimina o subtotal de cada Alias e o total da mesa.
- **RN-04.2 (Itens Cancelados):** Pedidos `CANCELADO` são sumariamente desconsiderados de todos os cálculos.
- **RN-04.3 (Itens Faturáveis):** Itens `ENVIADO`, `EM_PREPARO`, `PRONTO` e `ENTREGUE` entram no somatório.
- **RN-05.1 (Solicitação de Conta):** Ação de pedir conta altera status da mesa para `CONTA_PEDIDA`.
- **RN-05.3 (Liberação da Mesa):** Encerramento marca a comanda como `FECHADA`, retorna a mesa para `LIVRE` e desativa os tokens de sessão.

---

## 3. Escopo Técnico Backend

### 3.1. Migrations e Banco de Dados

- Criar migration `database/migrations/xxxx_create_tables_table.ts`:

  ```typescript
  table.increments('id').primary()
  table.integer('number').notNullable().unique()
  table.integer('capacity').defaultTo(4).notNullable()
  table.string('status', 30).defaultTo('LIVRE').notNullable() // 'LIVRE' | 'OCUPADA' | 'CONTA_PEDIDA'
  table.string('token', 64).nullable().unique() // Token criptográfico para validação do QR Code
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
  ```

- Criar migration `database/migrations/xxxx_create_tabs_table.ts`:

  ```typescript
  table.increments('id').primary()
  table.integer('table_id').unsigned().references('id').inTable('tables').onDelete('CASCADE')
  table.string('status', 30).defaultTo('ABERTA').notNullable() // 'ABERTA' | 'FECHADA'
  table.timestamp('opened_at').notNullable()
  table.timestamp('closed_at').nullable()
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
  ```

- Criar migration `database/migrations/xxxx_create_tab_members_table.ts`:
  ```typescript
  table.increments('id').primary()
  table.integer('tab_id').unsigned().references('id').inTable('tabs').onDelete('CASCADE')
  table.string('alias', 60).notNullable()
  table.string('session_token', 64).notNullable().unique()
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
  ```

### 3.2. Models Lucid

- `app/modules/tab_session/models/table.ts`:
  - Enums de status: `TableStatus = 'LIVRE' | 'OCUPADA' | 'CONTA_PEDIDA'`.
  - Relacionamentos: `@hasMany(() => Tab) declare tabs: HasMany<typeof Tab>`.
  - Helper: método para buscar comanda ativa (`activeTab()`).
- `app/modules/tab_session/models/tab.ts`:
  - Relacionamentos:
    - `@belongsTo(() => Table) declare table: BelongsTo<typeof Table>`
    - `@hasMany(() => TabMember) declare members: HasMany<typeof TabMember>`
    - `@hasMany(() => Order) declare orders: HasMany<typeof Order>`
- `app/modules/tab_session/models/tab_member.ts`:
  - Relacionamentos:
    - `@belongsTo(() => Tab) declare tab: BelongsTo<typeof Tab>`
    - `@hasMany(() => Order) declare orders: HasMany<typeof Order>`

### 3.3. Serviço Profundo (`TabSessionService`)

- Criar `app/modules/tab_session/services/tab_session_service.ts`:
  - `bindAliasToTable(tableId: number, desiredAlias: string): Promise<{ member: TabMember, isNewTab: boolean }>`:
    - Executa em transação (`db.transaction`).
    - Localiza mesa por ID (ou número). Lança exceção se não existir.
    - Se a mesa estiver `LIVRE`, altera status para `OCUPADA` e cria uma nova `Tab` com `status = 'ABERTA'` e `opened_at = DateTime.now()`.
    - Se a mesa estiver `CONTA_PEDIDA`, recusa novo acesso com erro de negócio ("Mesa em processo de fechamento").
    - Busca membros existentes da comanda ativa. Se o `desiredAlias` já existir, calcula o sufixo numérico (ex: "Carlos" -> "Carlos (2)", "Carlos (3)").
    - Cria o `TabMember` com um `sessionToken` gerado via `string.random(32)`.
    - Retorna a entidade do membro e indicador de abertura.
  - `getTabSummary(tableId: number)`:
    - Carrega comanda ativa, membros e todos os pedidos com seus itens.
    - Filtra itens faturáveis (`status != 'CANCELADO'`).
    - Calcula o total geral da comanda.
    - Agrupa pedidos por `tabMemberId` e calcula o subtotal exato de cada Alias.
  - `requestBill(tableId: number)`:
    - Altera o status da mesa para `CONTA_PEDIDA`.
  - `releaseTable(tableId: number)`:
    - Encerra comanda ativa (`status = 'FECHADA'`, `closed_at = DateTime.now()`).
    - Altera status da mesa para `LIVRE`.

### 3.4. Seeder de Mesas

- Criar `database/seeders/03_table_seeder.ts`:
  - Criar 15 mesas padrão para o salão (`number`: 1 até 15, capacidade 4 ou 6, tokens randômicos).

---

## 4. Escopo Técnico Frontend (Tipagem)

- Atualizar `inertia/types.ts`:
  ```typescript
  export type TableStatus = 'LIVRE' | 'OCUPADA' | 'CONTA_PEDIDA'
  export type TabStatus = 'ABERTA' | 'FECHADA'

  export interface Table {
    id: number
    number: number
    capacity: number
    status: TableStatus
  }

  export interface TabMemberSummary {
    id: number
    alias: string
    subtotal: number
    itemsCount: number
  }

  export interface TabSummary {
    tabId: number
    tableNumber: number
    status: TabStatus
    total: number
    members: TabMemberSummary[]
  }
  ```

---

## 5. Critérios de Aceitação

1. **Transição de Status de Mesa:** Vincular o primeiro membro a uma mesa `LIVRE` abre comanda e muda mesa para `OCUPADA`.
2. **Deduplicação de Alias:** Vincular "Pedro" duas vezes na mesma comanda gera o primeiro membro como "Pedro" e o segundo como "Pedro (2)".
3. **Cálculo de Comanda Exato:** Pedidos cancelados não compõem subtotais nem total geral; pedidos válidos são discriminados com precisão matemática.
4. **Fechamento e Liberação:** `releaseTable` encerra a comanda e devolve a mesa ao status `LIVRE`.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Migrations de `tables`, `tabs` e `tab_members` criadas e executadas no SQLite.
- [ ] Models Lucid estruturados com relacionamentos cruzados.
- [ ] `TabSessionService` implementado com transações de banco.
- [ ] Testes unitários com 100% de sucesso em `tests/unit/modules/tab_session_service.spec.ts`.
- [ ] Seeder de mesas populado e pronto para testes.
