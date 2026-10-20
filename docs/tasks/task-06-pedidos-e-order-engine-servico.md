# TASK-06: OrderEngineModule - Models, Transação Atômica e Serviço de Pedidos

- **ID:** `TASK-06`
- **Feature:** `FEATURE-04: OrderEngineModule (Processamento de Pedidos e Máquina de Estados)`
- **Responsável Sugerido:** Dev-3
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-02 de Catálogo e TASK-04 de Sessão/Mesas)
- **Dependências:** TASK-01

---

## 1. Objetivo e Contexto

Construir o motor transacional profundo do **OrderEngineModule** (ADR-002), responsável por processar carrinhos de pedidos disparados pelos clientes ou lançados por garçons. O serviço garante **atomicidade absoluta** na gravação dos itens em banco de dados (**RN-03.1**), congelamento de preços unitários no ato da compra (**RN-02.2**), validação rigorosa de estoque/disponibilidade (**RN-02.1**) e trava de cancelamento exclusiva para a equipe de Staff (**RN-03.3**).

---

## 2. Regras de Negócio e Referências

- **RN-02.1 (Produtos Indisponíveis):** Produtos indisponíveis no catálogo não podem ser aceitos pelo backend.
- **RN-02.2 (Congelamento de Preço):** O preço unitário do item e o nome são congelados no `OrderItem`. Alterações posteriores de preço no catálogo não afetam itens já pedidos.
- **RN-03.1 (Atomicidade do Lote):** O lote de pedidos deve ser processado em uma única transação (`db.transaction`). Se houver qualquer falha em um item, o lote inteiro sofre rollback.
- **RN-03.2 (Imutabilidade pelo Cliente):** Pedido confirmado entra no status `ENVIADO` e não pode ser editado pelo cliente.
- **RN-03.3 (Cancelamento de Pedidos):** Apenas usuários com perfil `GARCOM`, `GERENTE` ou `ADMIN` têm permissão para cancelar pedidos ou itens.
- **RN-05.1:** Bloquear envio de novos pedidos caso a comanda/mesa esteja com status `CONTA_PEDIDA`.

---

## 3. Escopo Técnico Backend

### 3.1. Migrations e Banco de Dados

- Criar migration `database/migrations/xxxx_create_orders_table.ts`:

  ```typescript
  table.increments('id').primary()
  table.integer('tab_id').unsigned().references('id').inTable('tabs').onDelete('CASCADE')
  table
    .integer('tab_member_id')
    .unsigned()
    .references('id')
    .inTable('tab_members')
    .onDelete('CASCADE')
  table.string('status', 30).defaultTo('ENVIADO').notNullable() // 'ENVIADO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO'
  table.text('cancellation_reason').nullable()
  table.integer('cancelled_by_user_id').unsigned().nullable().references('id').inTable('users')
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
  ```

- Criar migration `database/migrations/xxxx_create_order_items_table.ts`:
  ```typescript
  table.increments('id').primary()
  table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')
  table.integer('product_id').unsigned().references('id').inTable('products').onDelete('RESTRICT')
  table.string('name_snapshot', 150).notNullable()
  table.decimal('unit_price', 10, 2).notNullable() // Preço congelado no ato da compra
  table.integer('quantity').notNullable()
  table.string('notes', 255).nullable() // Ex: "Sem cebola", "Ponto da carne: mal passada"
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
  ```

### 3.2. Models Lucid

- `app/modules/order_engine/models/order.ts`:
  - Scopes: `active(query)`, `pendingKitchen(query)` (`ENVIADO` ou `EM_PREPARO`).
  - Relacionamentos:
    - `@hasMany(() => OrderItem) declare items: HasMany<typeof OrderItem>`
    - `@belongsTo(() => Tab) declare tab: BelongsTo<typeof Tab>`
    - `@belongsTo(() => TabMember) declare member: BelongsTo<typeof TabMember>`
- `app/modules/order_engine/models/order_item.ts`:
  - Helper getter: `get subtotal(): number { return Number(this.unitPrice) * this.quantity }`

### 3.3. Serviço Profundo (`OrderEngineService`)

- Criar `app/modules/order_engine/services/order_engine_service.ts`:
  - `submitBatchOrder(payload: SubmitBatchOrderDTO): Promise<Order>`:
    - Abre transação com `db.transaction(async (trx) => { ... })`.
    - Verifica status da Comanda/Mesa: Se comanda fechada ou mesa em `CONTA_PEDIDA`, rejeita imediatamente com `OrderException("Mesa em fechamento. Não são aceitos novos pedidos.")`.
    - Itera sobre a lista de itens (`productId`, `quantity`, `notes`):
      - Carrega produto no banco pelo ID.
      - Valida se produto existe, está ativo e com `is_available === true`. Caso contrário, lança `OrderException("Produto '[Nome]' está indisponível.")`.
    - Cria o registro na tabela `orders` associado ao `tabId` e `tabMemberId`, com status `ENVIADO`.
    - Cria todos os `order_items` inserindo `name_snapshot: product.name` e `unit_price: product.price`.
    - Comita a transação e retorna a `Order` com seus itens pré-carregados.
  - `cancelOrder(orderId: number, staffUser: { id: number, role: string }, reason?: string): Promise<Order>`:
    - Valida perfil: se o usuário não for `GARCOM`, `GERENTE` ou `ADMIN`, lança `ForbiddenException`.
    - Atualiza status para `CANCELADO`, armazena `cancellation_reason` e `cancelled_by_user_id`.

### 3.4. Validações VineJS (`app/modules/order_engine/validators/order_validator.ts`)

- Schema de validação do carrinho disparado:
  ```typescript
  export const batchOrderValidator = vine.create({
    items: vine
      .array(
        vine.object({
          productId: vine.number().positive(),
          quantity: vine.number().min(1).max(50),
          notes: vine.string().maxLength(200).optional(),
        })
      )
      .minLength(1),
  })
  ```

---

## 4. Escopo Técnico Frontend (Tipagem)

- Atualizar `inertia/types.ts`:
  ```typescript
  export type OrderStatus = 'ENVIADO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO'

  export interface OrderItem {
    id: number
    orderId: number
    productId: number
    nameSnapshot: string
    unitPrice: number
    quantity: number
    notes?: string | null
    subtotal: number
  }

  export interface Order {
    id: number
    tabId: number
    tabMemberId: number
    status: OrderStatus
    createdAt: string
    items: OrderItem[]
    memberName?: string
  }
  ```

---

## 5. Critérios de Aceitação

1. **Transação Atômica (RN-03.1):** Em um lote com 5 produtos válidos e 1 esgotado, a requisição falha e absolutamente nenhum registro é gravado em `orders` ou `order_items`.
2. **Preço Congelado (RN-02.2):** Se um prato custava R$ 50 no momento do pedido e depois foi reajustado para R$ 65 no catálogo, o extrato do pedido permanece inalterado em R$ 50.
3. **Bloqueio em "Conta Pedida":** Nenhuma ordem é aceita se a mesa estiver aguardando conta.
4. **Segurança no Cancelamento (RN-03.3):** Chamada de cancelamento desprovida de contexto de Staff é terminantemente recusada com HTTP 403.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Migrations de `orders` e `order_items` criadas e aplicadas.
- [ ] Models Lucid implementados com relacionamentos e cálculos de subtotal.
- [ ] `OrderEngineService` com transação atômica (`trx`) testado.
- [ ] Testes unitários com simulação de rollback em `tests/unit/modules/order_engine_service.spec.ts`.
- [ ] Suporte a observações personalizadas por item (`notes`).
