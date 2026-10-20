# TASK-07: OrderEngineModule - Máquina de Estados e Display KDS da Cozinha

- **ID:** `TASK-07`
- **Feature:** `FEATURE-04: OrderEngineModule (Processamento de Pedidos e Máquina de Estados)`
- **Responsável Sugerido:** Dev-3
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-03 de Admin Catálogo e TASK-05 de Zero-Auth)
- **Dependências:** TASK-01, TASK-06

---

## 1. Objetivo e Contexto

Implementar a máquina de estados rigorosa de ciclo de vida dos pedidos e a interface operacional do **KDS (Kitchen Display System)** para a equipe da cozinha e do bar (conforme **RN-06.2** e **ADR-002**). O display exibe os lotes em ordem cronológica de recebimento com cronômetro de tempo de espera decorrido, alertas visuais de atraso e atualização automática via polling inteligente do Inertia.js.

---

## 2. Regras de Negócio e Referências

- **RN-06.2 (Sequenciamento no KDS):** Ordenação cronológica estrita (`created_at ASC`) destacando o tempo de espera decorrido em minutos.
- **RN-03.2 / RN-03.3:** Estados do ciclo de vida: `ENVIADO` -> `EM_PREPARO` -> `PRONTO` -> `ENTREGUE`. Cancelamentos requerem papel de Staff.
- **RN-07.1 / RN-07.4:** Acesso permitido para os papéis `COZINHA`, `GERENTE` e `ADMIN`.
- **ADR-002 (Polling Periódico Inteligente):** Atualização automática via `router.reload({ only: ['orders'] })` a cada 5 a 10 segundos.

---

## 3. Escopo Técnico Backend

### 3.1. Máquina de Estados (`app/modules/order_engine/state_machine/order_state_machine.ts`)

- Mapeamento estrito das transições permitidas:
  ```typescript
  const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    ENVIADO: ['EM_PREPARO', 'CANCELADO'],
    EM_PREPARO: ['PRONTO', 'CANCELADO'],
    PRONTO: ['ENTREGUE', 'CANCELADO'],
    ENTREGUE: [],
    CANCELADO: [],
  }
  ```
- Método `canTransition(from: OrderStatus, to: OrderStatus): boolean`.
- Método `transition(order: Order, newStatus: OrderStatus, userContext: StaffContext): Promise<Order>`:
  - Valida se a transição é permitida pela matriz. Lança `InvalidStateTransitionException` caso inválida.
  - Se `newStatus === 'CANCELADO'`, exige que `userContext.role` seja `ADMIN`, `GERENTE` ou `GARCOM`.
  - Persiste a alteração e retorna a ordem atualizada.

### 3.2. Rotas HTTP (`start/routes.ts`)

```typescript
router
  .group(() => {
    router.get('/kds', [controllers.Kds, 'index']).as('staff.kds.index')
    router
      .patch('/kds/orders/:id/status', [controllers.Kds, 'updateStatus'])
      .as('staff.kds.updateStatus')
  })
  .use([middleware.auth(), middleware.role(['COZINHA', 'GERENTE', 'ADMIN'])])
```

### 3.3. Controller (`app/controllers/staff/kds_controller.ts`)

- `index({ inertia })`:
  - Carrega todos os pedidos onde `status` seja `ENVIADO`, `EM_PREPARO` ou `PRONTO`.
  - Ordenação obrigatória: `orderBy('createdAt', 'asc')`.
  - Pré-carrega: `items`, `tab.table`, `member`.
  - Mapeia DTO serializado para envio eficiente ao Inertia.
- `updateStatus({ params, request, response, auth })`:
  - Recebe `newStatus` validado por VineJS.
  - Invoca `OrderStateMachine.transition(order, newStatus, auth.user)`.
  - Redireciona de volta (`response.redirect().back()`).

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Interface KDS (`inertia/pages/staff/kds.tsx`)

- Interface de alto contraste (Dark Theme otimizado para telas de cozinha e pouca iluminação).
- **Cabeçalho KDS:**
  - Título: "Display da Cozinha & Bar".
  - Indicador de status da sincronização ("Ao vivo 🟢").
  - Contadores: `X na fila`, `Y em preparo`.
  - Botão de filtro: Todos / Cozinha / Bar.
- **Colunas Kanban Dinâmicas:**
  1. **📥 Novos Pedidos (`ENVIADO`):** Destaque amarelo.
  2. **🍳 Em Preparo (`EM_PREPARO`):** Destaque azul.
  3. **✅ Prontos para Retirada (`PRONTO`):** Destaque verde (aguardando garçom).
- **Card de Pedido Operacional:**
  - Número da Mesa em caixa alta grande (ex: **MESA 04**).
  - Nome do cliente (**Alias**) e hora exata do pedido (ex: `19:42`).
  - **Timer Decorrido:** Exibição dinâmica (ex: `⏱ 12 min`).
    - < 10 min: texto verde / neutro.
    - 10 - 20 min: badge de alerta amarelo.
    - > 20 min: badge vermelho pulsante de prioridade crítica.
  - **Lista de Itens:**
    - Quantidade em evidência (ex: `<span className="text-xl font-bold">2x</span>`).
    - Nome do prato em destaque.
    - **Observações Especiais em Caixa de Alerta:** (ex: ⚠️ _"Sem cebola, bem passado"_).
  - **Botão de Ação de 1 Toque:**
    - Para `ENVIADO`: botão grande "Iniciar Preparo 🍳".
    - Para `EM_PREPARO`: botão grande "Marcar Pronto 🔔".
- **Polling Automático Integrado:**
  - Efeito React com `setInterval` de 7 segundos disparando:
    ```typescript
    router.reload({ only: ['orders'], preserveScroll: true, preserveState: true })
    ```

---

## 5. Critérios de Aceitação

1. **Ordem Cronológica Rígida:** Pedidos mais antigos ficam sempre no topo/início da esteira (`created_at ASC`).
2. **Tempo Decorrido Preciso:** Cada card recalcula seu tempo de espera a cada minuto.
3. **Transição de 1 Toque:** O cozinheiro clica em "Iniciar Preparo" e o card move para a coluna seguinte sem recarregar a página inteira.
4. **Alerta de Observação:** Itens com observações (ex: "Sem cebola") são exibidos com destaque visual obrigatório.
5. **Atualização Automática:** Novos pedidos feitos pelos clientes aparecem no KDS em menos de 8 segundos via polling.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Máquina de estados `OrderStateMachine` implementada e testada com todas as transições válidas e inválidas.
- [ ] Controller `KdsController` criado com proteção RBAC.
- [ ] Interface KDS React construída com Kanban, timer decorrido e design de alto contraste.
- [ ] Polling periódica com `router.reload` validado sem quebra de scroll.
- [ ] Testes funcionais simulando o fluxo de avanço de pedidos da cozinha.
