# TASK-02: CatalogModule - Models, Migrations e CatalogService

- **ID:** `TASK-02`
- **Feature:** `FEATURE-02: CatalogModule (Gestão de Categorias, Produtos e Disponibilidade)`
- **Responsável Sugerido:** Dev-1
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-04 de Sessão/Mesas e TASK-06 de Pedidos)
- **Dependências:** TASK-01

---

## 1. Objetivo e Contexto

Construir o backend profundo do **CatalogModule** conforme estipulado na arquitetura do sistema (ADR-002 e Architecture Guide). Este módulo gerencia o cardápio do restaurante, incluindo categorização temática com ordenação e emojis, produtos comercializáveis, controle de disponibilidade em tempo real e proteção contra exclusão física de itens já vendidos (**RN-02**).

---

## 2. Regras de Negócio e Referências

- **RN-02.1 (Produtos Indisponíveis):** Produtos marcados como indisponíveis não podem ser retornados como ativos para pedidos de clientes.
- **RN-02.2 (Congelamento de Preço):** Manter precisão decimal/centavos para suporte ao congelamento no OrderItem.
- **RN-02.3 (Exclusão Segura):** Produtos associados a pedidos anteriores não devem ser excluídos fisicamente; aplicar _soft delete_ (`deleted_at`).
- **Glossário Seção 2:** Categorias com emoji/ordem, tags alimentares ("Vegano", "Sem Glúten", etc.) e observações.

---

## 3. Escopo Técnico Backend

### 3.1. Migrations e Banco de Dados

- Criar migration `database/migrations/xxxx_create_categories_table.ts`:

  ```typescript
  table.increments('id').primary()
  table.string('name', 100).notNullable()
  table.string('slug', 120).notNullable().unique()
  table.string('emoji', 10).nullable()
  table.integer('sort_order').defaultTo(0).notNullable()
  table.boolean('is_active').defaultTo(true).notNullable()
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
  ```

- Criar migration `database/migrations/xxxx_create_products_table.ts`:
  ```typescript
  table.increments('id').primary()
  table
    .integer('category_id')
    .unsigned()
    .references('id')
    .inTable('categories')
    .onDelete('RESTRICT')
  table.string('name', 150).notNullable()
  table.text('description').nullable()
  table.decimal('price', 10, 2).notNullable()
  table.string('image_url', 500).nullable()
  table.boolean('is_available').defaultTo(true).notNullable()
  table.json('tags').nullable() // Ex: ["Vegano", "Sem Glúten"]
  table.timestamp('deleted_at').nullable()
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
  ```

### 3.2. Models Lucid

- Criar `app/modules/catalog/models/category.ts`:
  - Relacionamento: `@hasMany(() => Product) declare products: HasMany<typeof Product>`
  - Scopes: `active(query)` para filtrar apenas `is_active = true`.
- Criar `app/modules/catalog/models/product.ts`:
  - Relacionamento: `@belongsTo(() => Category) declare category: BelongsTo<typeof Category>`
  - Scopes: `available(query)` (`is_available = true` e `deleted_at IS NULL`).
  - Getter/Setter para parsing seguro do campo `tags`.

### 3.3. Serviço Profundo (Deep Module Service)

- Criar `app/modules/catalog/services/catalog_service.ts`:
  - `getCatalogTree(options?: { onlyAvailable?: boolean })`: Retorna todas as categorias ativas ordenadas por `sort_order ASC`, contendo seus respectivos produtos (filtrando disponíveis quando requisitado para a visão do cliente).
  - `updateProductAvailability(productId: number, isAvailable: boolean)`: Atualização rápida atômica do status de estoque do produto.
  - `upsertProduct(payload: UpsertProductDTO)`: Cria ou edita um produto existente com validação de unicidade de nome por categoria.
  - `upsertCategory(payload: UpsertCategoryDTO)`: Cria ou edita categoria temática.
  - `deleteProduct(productId: number)`: Verifica se há registros dependentes na tabela de pedidos (`order_items`). Se houver, aplica _soft delete_ preenchendo `deleted_at`; caso contrário, remove do banco.

### 3.4. Validações VineJS

- Criar `app/modules/catalog/validators/category_validator.ts`:
  - Regras: `name` (min 2, max 100), `emoji` (max 10), `sortOrder` (integer positivo).
- Criar `app/modules/catalog/validators/product_validator.ts`:
  - Regras: `name` (min 2, max 150), `categoryId` (exists in categories), `price` (number min 0.01), `isAvailable` (boolean), `tags` (array of strings optional).

### 3.5. Seeder de Demonstração

- Criar `database/seeders/02_catalog_seeder.ts`:
  - Popular as categorias e pratos idênticos ao protótipo de design ([menu-example.tsx](../../design/menu-example.tsx)):
    - _Entradas:_ Bruschetta ao Azeite (R$ 32), Tartare de Atum (R$ 68), Ostras Frescas (R$ 89).
    - _Principais:_ Filé ao Molho Trufado (R$ 148), Frango ao Risoto Verde (R$ 92), Robalo com Aspargos (R$ 118), Aspargos com Molho Verde (R$ 78).
    - _Sobremesas:_ Bolo de Chocolate (R$ 42), Tarte de Maçã (R$ 38).
    - _Bebidas:_ Negroni Clássico (R$ 36), Spritz Rosé (R$ 28), Martini Dry (R$ 38).

---

## 4. Escopo Técnico Frontend (Tipagem)

- Atualizar `inertia/types.ts` exportando as interfaces compartilhadas de catálogo:
  ```typescript
  export interface Category {
    id: number
    name: string
    slug: string
    emoji?: string
    sortOrder: number
    isActive: boolean
    products?: Product[]
  }

  export interface Product {
    id: number
    categoryId: number
    name: string
    description: string
    price: number
    imageUrl?: string
    isAvailable: boolean
    tags?: string[]
  }
  ```

---

## 5. Critérios de Aceitação

1. **Integridade de Catálogo:** `CatalogService.getCatalogTree()` retorna as categorias ordenadas e produtos aninhados.
2. **Toggle Instantâneo:** Alterar a disponibilidade via `updateProductAvailability` reflete imediatamente na consulta do catálogo.
3. **Proteção contra Exclusão (RN-02.3):** Se um produto tiver itens vinculados em histórico, o método `deleteProduct()` realiza soft-delete e mantém o registro no banco com `deleted_at != null`.
4. **Seed Confiável:** A execução de `node ace db:seed` popula todas as categorias e itens de menu sem inconsistências.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Migrations de `categories` e `products` criadas e aplicadas no SQLite.
- [ ] Models Lucid com relacionamentos e scopes implementados.
- [ ] `CatalogService` com testes unitários em `tests/unit/modules/catalog_service.spec.ts`.
- [ ] Validadores VineJS criados para categorias e produtos.
- [ ] Seeder de catálogo preenchido e funcional.
- [ ] Cobertura de testes dos métodos públicos do serviço > 90%.
