# Arquitetura do Sistema: Cardápio & Comanda Digital Local

## 1. Visão Geral e Propósito

O sistema é uma aplicação _local-first_ monolítica modular desenvolvida em **AdonisJS v6** e **Inertia.js** (com React no frontend), voltada para bares e restaurantes. Ele opera diretamente na infraestrutura local do estabelecimento, provendo acesso aos clientes via QR Code sem necessidade de instalação de aplicativos ou criação de contas, além de fornecer interfaces operacionais dedicadas para a equipe (Salão/Garçons, Cozinha/Bar e Administração).

---

## 2. Diagrama de Blocos e Visão Macro

```
                        ┌──────────────────────────────────────────────┐
                        │      Cloudflare Tunnel (HTTPS Público)       │
                        └──────────────────────┬───────────────────────┘
                                               │
 ┌─────────────────────────────────────────────┴─────────────────────────────────────────────┐
 │                                   AdonisJS Monolith                                       │
 │                                                                                           │
 │   ┌────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐   │
 │   │     CatalogModule      │  │    TabSessionModule     │  │    OrderEngineModule     │   │
 │   │                        │  │                         │  │                          │   │
 │   │ • Categorias & Pratos  │  │ • Gestão de Mesas       │  │ • Máquina de Estados     │   │
 │   │ • Disponibilidade      │  │ • Sessões/Aliases       │  │ • Lote de Pedidos        │   │
 │   │ • Upload de Imagens    │  │ • Divisão de Comandas   │  │ • Concorrência & Trava   │   │
 │   └───────────┬────────────┘  └────────────┬────────────┘  └────────────┬─────────────┘   │
 │               │                            │                            │                 │
 │               └────────────────────────────┼────────────────────────────┘                 │
 │                                            ▼                                              │
 │                              Lucid ORM / Database Layer                                   │
 │                                            │                                              │
 │                                            ▼                                              │
 │                              SQLite Local (`database.sqlite`)                             │
 └────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                           ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
        │   Visão Cliente   │       │   Visão Garçom    │       │   Visão Cozinha   │
        │   (Zero-Auth)     │       │   (Painel Staff)  │       │     (KDS/Bar)     │
        │                   │       │                   │       │                   │
        │ • Menu Responsivo │       │ • Grid de Mesas   │       │ • Kanban KDS      │
        │ • Carrinho Local  │       │ • Lançamento Manual│      │ • Status Tempo Real│
        │ • Extrato Pessoal │       │ • Baixa & Fechamento│     │ • Fila por Mesa   │
        └───────────────────┘       └───────────────────┘       └───────────────────┘
```

---

## 3. Padrões de Projeto e Filosofia Arquitetural

### 3.1. Deep Modules (Módulos Profundos)

Seguindo os princípios de _Philosophy of Software Design_ (John Ousterhout), o sistema é decomposto em três módulos profundos com interfaces públicas enxutas e regras de negócio encapsuladas:

1. **`CatalogModule`**:
   - **Interface Exposta:** `getCatalogTree()`, `updateProductAvailability(id, boolean)`, `upsertProduct(data)`.
   - **Responsabilidade:** Validações de integridade de catálogo, categorização hierárquica e abstração do armazenamento de imagens via Drive.

2. **`TabSessionModule`**:
   - **Interface Exposta:** `bindAliasToTable(tableId, alias, sessionToken)`, `getTabSummary(tableId)`, `releaseTable(tableId)`.
   - **Responsabilidade:** Agregação de clientes em uma mesa, ciclo de vida da mesa (`LIVRE`, `OCUPADA`, `FECHANDO`) e cálculo determinístico da divisão de conta.

3. **`OrderEngineModule`**:
   - **Interface Exposta:** `submitBatchOrder(tabId, aliasId, items[])`, `transitionOrderStatus(orderId, newStatus, userContext)`.
   - **Responsabilidade:** Atomicidade no envio do carrinho, proteção contra alterações indevidas pós-disparo e execução da máquina de estados do pedido.

### 3.2. Monólito Inertia.js (Zero-Duplication DTO)

Em vez de manter uma API REST desacoplada com serializers duplicados e rotas paralelas, o sistema utiliza o **Inertia.js**. Os controllers do AdonisJS retornam diretamente os dados tipados para componentes React/Vue, reduzindo o custo de manutenção e agilizando os ciclos de TDD.

### 3.3. Polling Periódico Inteligente

Para contornar a complexidade operacional de servidores WebSocket locais expostos por túnel, as views em tempo real (KDS, Grid de Mesas e Extrato da Comanda) utilizam o mecanismo nativo de recarga parcial do Inertia (`router.reload({ only: [...] })`) em intervalos configurados (5 a 10 segundos).

---

## 4. Estrutura de Diretórios Recomendada

```text
app/
├── modules/
│   ├── catalog/
│   │   ├── services/catalog_service.ts
│   │   ├── models/category.ts
│   │   ├── models/product.ts
│   │   └── validators/product_validator.ts
│   ├── tab_session/
│   │   ├── services/tab_session_service.ts
│   │   ├── models/table.ts
│   │   ├── models/tab.ts
│   │   └── models/tab_member.ts
│   └── order_engine/
│       ├── services/order_engine_service.ts
│       ├── state_machine/order_state_machine.ts
│       ├── models/order.ts
│       └── models/order_item.ts
├── http/
│   ├── controllers/
│   │   ├── client/menu_controller.ts
│   │   ├── client/order_controller.ts
│   │   ├── staff/kds_controller.ts
│   │   ├── staff/table_grid_controller.ts
│   │   └── admin/catalog_admin_controller.ts
│   └── middleware/
│       ├── role_guard_middleware.ts
│       └── client_session_middleware.ts
database/
├── migrations/
└── seeders/
```
