# TASK-10: Painel do Salão & Garçons - Grid de Mesas, Lançamento Manual e Liberação

- **ID:** `TASK-10`
- **Feature:** `FEATURE-07: Operação do Salão & Garçons (Grid de Mesas e Atendimento)`
- **Responsável Sugerido:** Dev-3
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-08 e TASK-09)
- **Dependências:** TASK-01, TASK-04, TASK-06, TASK-07

---

## 1. Objetivo e Contexto

Construir a interface operacional do salão para Garçons, Gerentes e Administradores. Permite monitorar todas as mesas do restaurante em um **Grid Visual em tempo real**, visualizar chamados de encerramento de conta (**RN-05.1**), realizar a entrega dos pratos prontos na mesa física (**RN-04.3**), lançar pedidos manuais para clientes que não utilizam smartphone (**RN-06.1**), cancelar itens com justificativa autorizada (**RN-03.3**) e liberar mesas após a liquidação presencial (**RN-05.3**).

---

## 2. Regras de Negócio e Referências

- **RN-05.1 (Aviso de Conta Pedida):** Emitir alerta visual no painel do salão quando uma mesa transitar para `CONTA_PEDIDA`.
- **RN-05.2 (Liquidação Presencial):** Não há cobrança online; o garçom confirma o pagamento fisicamente no PDV.
- **RN-05.3 (Liberação e Arquivamento):** "Liberar Mesa" marca a comanda como `FECHADA`, retorna a mesa a `LIVRE` e desativa os acessos dos clientes.
- **RN-06.1 (Lançamento Manual pelo Garçom):** Garçom pode lançar pedidos escolhendo um Alias existente ou criando um Alias avulso (ex: "Balcão").
- **RN-03.3 (Cancelamento de Pedidos):** Restrito a perfis com permissão de Staff (`GARCOM`, `GERENTE`, `ADMIN`).

---

## 3. Escopo Técnico Backend

### 3.1. Rotas HTTP (`start/routes.ts`)

```typescript
router
  .group(() => {
    router.get('/tables', [controllers.TableGrid, 'index']).as('staff.tables.index')
    router.get('/tables/:id', [controllers.TableGrid, 'show']).as('staff.tables.show')
    router
      .post('/tables/:id/orders', [controllers.TableGrid, 'manualOrder'])
      .as('staff.tables.manualOrder')
    router
      .patch('/tables/orders/:orderId/deliver', [controllers.TableGrid, 'markDelivered'])
      .as('staff.tables.deliver')
    router
      .post('/tables/orders/:orderId/cancel', [controllers.TableGrid, 'cancelOrder'])
      .as('staff.tables.cancel')
    router
      .post('/tables/:id/release', [controllers.TableGrid, 'release'])
      .as('staff.tables.release')
  })
  .prefix('/staff')
  .use([middleware.auth(), middleware.role(['GARCOM', 'GERENTE', 'ADMIN'])])
```

### 3.2. Controller (`app/controllers/staff/table_grid_controller.ts`)

- `index({ inertia })`:
  - Carrega todas as mesas cadastradas ordenadas por `number ASC`.
  - Mapeia status (`LIVRE`, `OCUPADA`, `CONTA_PEDIDA`).
  - Identifica mesas com pratos com status `PRONTO` aguardando garçom.
  - Identifica comandas ativas e tempo de ocupação decorrido.
- `show({ params, inertia })`:
  - Carrega detalhes da mesa, lista de membros/aliases presentes e extrato consolidado de pedidos.
- `manualOrder({ params, request, response, auth })`:
  - Recebe `alias` (existente ou novo), `items` e valida via VineJS.
  - Se for um novo alias, cria o membro na comanda via `TabSessionService.bindAliasToTable`.
  - Dispara o lote via `OrderEngineService.submitBatchOrder`.
- `markDelivered({ params, response, auth })`:
  - Executa `OrderStateMachine.transition(order, 'ENTREGUE', auth.user)`.
- `cancelOrder({ params, request, response, auth })`:
  - Recebe `reason` e executa cancelamento via `OrderEngineService.cancelOrder`.
- `release({ params, response, auth })`:
  - Chama `TabSessionService.releaseTable(params.id)`.
  - Redireciona para o grid com notificação de mesa liberada com sucesso.

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Página do Grid de Mesas (`inertia/pages/staff/tables/index.tsx`)

- Utiliza o layout mestre `inertia/layouts/staff_layout.tsx`.
- **Barra de Métricas do Salão:**
  - Total de Mesas, Mesas Ocupadas, Mesas Aguardando Conta, Pratos Prontos para Entrega.
- **Filtros Rápidos:** Todas | Ocupadas | Contas Pedidas ⚠️ | Livres.
- **Grid de Cards de Mesas:**
  - Card estilizado por cor de acordo com o status:
    - 🟢 **LIVRE:** Borda cinza/verde discreta, capacidade de lugares, botão rápido "Abrir Mesa".
    - 🔵 **OCUPADA:** Borda azul, contagem de clientes presentes, total parcial acumulado (R$ ...), badge se houver itens aguardando entrega (🔔).
    - 🟡 **CONTA_PEDIDA:** Borda amarela chamativa ou pulsante, ícone de dinheiro/conta pedida, tempo aguardando fechamento.
  - Clique no card abre o Drawer/Modal de Detalhes da Mesa.

### 4.2. Componente de Gestão da Mesa (`TableDetailDrawer.tsx`)

- Informações do cabeçalho: "Mesa {number}" e status atual.
- Lista de participantes (Aliases na comanda).
- **Lista de Pedidos da Mesa:**
  - Agrupados por lote e horário.
  - Itens com status atual.
  - Botão de ação rápida: **"Entregue na Mesa ✅"** para itens com status `PRONTO`.
  - Botão de **Cancelar Item / Pedido** (solicita motivo em modal de confirmação).
- **Ações Principais no Rodapé:**
  - Botão **"+ Lançar Pedido Manual"**: abre modal com busca do cardápio e seleção de Alias.
  - Botão **"Liberar Mesa & Fechar Comanda"**: fecha a conta, exibe total final para cobrança presencial e reseta a mesa para `LIVRE`.

### 4.3. Polling Periódico

- Polling no grid a cada 5 segundos para garantir que pedidos de conta e pratos prontos sejam sinalizados sem atraso:
  ```typescript
  router.reload({ only: ['tables'], preserveScroll: true, preserveState: true })
  ```

---

## 5. Critérios de Aceitação

1. **Destaque Imediato de Conta Solicitada:** Uma mesa que clica em "Pedir Conta" no mobile pisca em amarelo no painel do garçom em até 6 segundos.
2. **Baixa de Entrega:** Clicar em "Entregue" altera o status para `ENTREGUE` e o remove da fila de espera do garçom.
3. **Lançamento Manual Flexível:** O garçom consegue lançar um prato em nome de "Balcão" em uma mesa ocupada sem que o cliente precise escanear QR Code.
4. **Liberação Completa:** Ao liberar a mesa, a comanda fecha, o total é arquivado e a mesa volta a ficar verde (`LIVRE`).

---

## 6. Critérios de Conclusão (DoD)

- [ ] Rotas `/staff/tables/*` implementadas com proteção RBAC para `GARCOM`, `GERENTE`, `ADMIN`.
- [ ] Controller `TableGridController` com todos os métodos implementados.
- [ ] Telas React do Grid e Drawer responsivas em tablets e celulares de atendimento.
- [ ] Testes funcionais simulando atendimento completo de uma mesa pelo garçom.
- [ ] Verificação de lint e build sem erros.
