# TASK-15: Ciclo de Vida de Comandas Individuais, Trava Anti-Orfandade no KDS e Liberação Atômica de Mesas

- **ID:** `TASK-15`
- **Feature:** `FEATURE-13: Comandas Individuais, Trava Anti-Orfandade no KDS e Liberação Granular de Mesas`
- **Responsável Sugerido:** Dev-2 (Trilha B - Sessão de Mesa, Comandas & Zero-Auth)
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Independente de Catálogo e Dashboard BI)
- **Dependências:** TASK-04 (TabSessionService), TASK-05 (Zero-Auth e Middleware), TASK-07 (KDS), TASK-09 (Extrato Mobile), TASK-10 (Painel Garçom)

---

## 1. Objetivo e Diagnóstico do Problema

### 1.1. Diagnóstico do Problema Crítico
No modelo original de sessão de mesas do **QR-Order**, a comanda (`Tab`) e a mesa (`Table`) eram manipuladas de forma monolítica e indivisível. Esse desenho gerava três falhas graves no salão:
1. **Cobrança Indevida / Antecipada**: Quando um cliente sentado à mesa solicitava a conta, a mesa inteira transitava para `CONTA_PEDIDA`, bloqueando imediatamente novos pedidos para todos os demais ocupantes, mesmo que eles tivessem acabado de se sentar ou ainda estivessem consumindo.
2. **Orfandade de Pedidos no KDS**: O garçom conseguia encerrar a comanda (`Tab.status = CLOSED`) e liberar a mesa (`Table.status = LIVRE`) enquanto pratos pertencentes a outros clientes ainda estavam em preparação (`ENVIADO`, `EM_PREPARO`) ou aguardando entrega (`PRONTO`) no KDS da cozinha. Isso gerava desperdício, pratos abandonados sem mesa associada e descompasso financeiro.
3. **Ausência de Ciclo de Vida Individual por Cliente**: O model `TabMember` não possuía status próprio de cobrança, impedindo que um cliente pagasse sua parte e fosse embora enquanto seus amigos continuavam consumindo.

### 1.2. Objetivo da Solução
Evoluir a arquitetura do **TabSessionModule** para suportar **Ciclo de Vida Individual por Membro (`TabMember`)**, garantindo que:
- Cada cliente na mesa possua seu próprio estado (`OPEN` -> `BILL_REQUESTED` -> `PAID`).
- Apenas a comanda do cliente que pediu a conta seja bloqueada para novos pedidos; os demais clientes continuam navegando, adicionando itens ao carrinho e pedindo pratos normalmente.
- Exista uma **Trava de Segurança Anti-Orfandade**: o sistema impede terminantemente que um garçom ou operador de caixa liquide a comanda de um cliente ou libere a mesa se houver pedidos daquele cliente (ou da mesa) ainda em produção ou aguardando entrega na cozinha.
- A mesa física só seja liberada (`LIVRE`) e a `Tab` geral fechada (`CLOSED`) quando **100% dos membros** estiverem com suas contas quitadas (`PAID`) e todos os pedidos entregues ou cancelados.

---

## 2. Regras de Negócio e Princípios Arquiteturais

- **RN-MEMBER.1 (Status do Membro na Comanda):**
  - Cada registro de `TabMember` passa a ter um status formal:
    - `OPEN`: Cliente ativo, consumindo e autorizado a enviar pedidos para a cozinha.
    - `BILL_REQUESTED`: Cliente solicitou sua conta. Bloqueado para novos pedidos, mas com extrato visível para conferência.
    - `PAID`: Conta do cliente quitada e recebida pelo garçom/caixa. Sessão encerrada.
  - O status padrão ao entrar na mesa via Zero-Auth é `OPEN`.

- **RN-MEMBER.2 (Independência das Comandas na Mesma Mesa):**
  - A solicitação de conta por um cliente altera exclusivamente o seu próprio `TabMember.status` para `BILL_REQUESTED`.
  - Clientes que permanecem com status `OPEN` mantêm permissão irrestrita para submeter pedidos (`ClientOrderController.store`).

- **RN-MEMBER.3 (Trava Rígida Anti-Orfandade no KDS):**
  - Um cliente **NÃO PODE** ser liquidado (`PAID`) pelo garçom enquanto possuir pedidos com status não-final: `ENVIADO`, `EM_PREPARO` ou `PRONTO`.
  - É pré-requisito mandatório que todos os pedidos daquele cliente estejam com status final: `ENTREGUE` ou `CANCELADO`.
  - Caso o garçom tente liquidar a conta de um membro com pedidos em preparo ou aguardando entrega, o backend bloqueia a operação retornando HTTP 422 com a lista dos itens impeditivos.

- **RN-MEMBER.4 (Liquidação Individual da Comanda):**
  - O garçom pode registrar a liquidação individual da comanda de um cliente específico (`POST /staff/tables/:id/members/:memberId/pay`).
  - O status do cliente passa para `PAID` e `paid_at` é registrado com o timestamp atual.
  - A mesa física continua `OCUPADA` e a comanda global `OPEN` enquanto houver qualquer membro restante com status `OPEN` ou `BILL_REQUESTED`.

- **RN-MEMBER.5 (Liberação Físico-Lógica da Mesa e Fechamento Geral):**
  - A mesa só pode ser liberada para `LIVRE` e a `Tab` geral marcada como `CLOSED` quando:
    1. **TODOS** os membros da comanda estiverem com status `PAID`.
    2. **ZERO** pedidos da mesa estiverem em aberto no KDS ou no salão (`ENVIADO`, `EM_PREPARO`, `PRONTO`).
  - O garçom tem à disposição a ação "Liquidar Todos e Liberar Mesa", que executa a quitação de todos os membros em lote, desde que a trava anti-orfandade seja satisfeita para 100% dos pedidos da mesa.

- **RN-MEMBER.6 (Visibilidade dos Status no Salão):**
  - No grid de mesas e no modal da mesa, o garçom visualiza o status detalhado de cada membro:
    - 🟢 `Consumindo` (`OPEN`)
    - 🟡 `Conta Solicitada` (`BILL_REQUESTED`)
    - 🟣 `Pago / Finalizado` (`PAID`)
  - A mesa no grid só exibe a badge `CONTA_PEDIDA` se **todos os membros ativos não-pagos** tiverem solicitado a conta. Se houver membros ainda consumindo, a mesa exibe `OCUPADA` com indicador de contas parciais pendentes (ex: `"1/3 contas pedidas"`).

---

## 3. Modelagem de Dados & Migrations Backend

### 3.1. Migration: Adicionar Status e Timestamps em `tab_members`

Criar migration `database/migrations/xxxx_add_status_and_paid_at_to_tab_members_table.ts`:

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tab_members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status', 30).notNullable().defaultTo('OPEN')
      table.timestamp('paid_at').nullable()
      table.timestamp('closed_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
      table.dropColumn('paid_at')
      table.dropColumn('closed_at')
    })
  }
}
```

### 3.2. Atualização do Model `TabMember` (`app/models/tab_member.ts`)

```typescript
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Tab from '#models/tab'
import Order from '#models/order'

export type TabMemberStatus = 'OPEN' | 'BILL_REQUESTED' | 'PAID'

export class TabMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tabId: number

  @column()
  declare alias: string

  @column()
  declare sessionToken: string

  @column()
  declare status: TabMemberStatus

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare closedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Tab)
  declare tab: BelongsTo<typeof Tab>

  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>

  get isOpen(): boolean {
    return this.status === 'OPEN'
  }

  get isBillRequested(): boolean {
    return this.status === 'BILL_REQUESTED'
  }

  get isPaid(): boolean {
    return this.status === 'PAID'
  }
}

export default TabMember
```

---

## 4. Escopo Técnico Backend & Serviços

### 4.1. Atualização do `TabSessionService` (`app/services/tab_session_service.ts`)

O serviço passa a controlar as transições de comanda individual e a validação anti-orfandade:

```typescript
// Novos métodos em TabSessionService:

/**
 * Solicita o fechamento da conta de um membro específico.
 */
async requestMemberBill(memberId: number): Promise<TabMember> {
  const member = await TabMember.findOrFail(memberId)
  if (member.status === 'PAID') {
    throw new Error('Esta comanda já foi quitada.')
  }

  member.status = 'BILL_REQUESTED'
  await member.save()

  // Atualiza status da mesa caso todos os membros ativos tenham pedido a conta
  await this.syncTableStatus(member.tabId)

  return member
}

/**
 * Valida a trava anti-orfandade no KDS para um membro ou mesa inteira.
 * Retorna lista de pedidos não-finalizados impeditivos.
 */
async getBlockingPendingOrders(options: { memberId?: number; tabId?: number }): Promise<Order[]> {
  const query = Order.query()
    .whereIn('status', ['ENVIADO', 'EM_PREPARO', 'PRONTO', 'PENDING', 'PREPARING', 'READY'])
    .preload('items')

  if (options.memberId) {
    query.where('tab_member_id', options.memberId)
  } else if (options.tabId) {
    query.where('tab_id', options.tabId)
  }

  return await query
}

/**
 * Liquida a conta de um membro individualmente após confirmação do garçom/caixa.
 * Aplica a trava anti-orfandade: impede liquidação se houver pedidos pendentes.
 */
async settleMemberBill(memberId: number): Promise<{
  member: TabMember
  allPaid: boolean
  remainingActiveMembers: number
}> {
  const member = await TabMember.query()
    .where('id', memberId)
    .preload('tab')
    .firstOrFail()

  if (member.status === 'PAID') {
    throw new Error('Esta comanda já está quitada.')
  }

  // Trava anti-orfandade: verifica se este membro possui pedidos não-entregues
  const pendingOrders = await this.getBlockingPendingOrders({ memberId: member.id })
  if (pendingOrders.length > 0) {
    const itemNames = pendingOrders
      .flatMap((o) => o.items.map((i) => i.nameSnapshot))
      .join(', ')
    throw new Error(
      `Não é possível liquidar a comanda de ${member.alias}: existem pedidos pendentes na cozinha ou a caminho (${itemNames}). Finalize a entrega ou cancele antes de quitar.`
    )
  }

  member.status = 'PAID'
  member.paidAt = DateTime.now()
  member.closedAt = DateTime.now()
  await member.save()

  // Verifica se todos os membros da comanda agora estão pagos
  const allMembers = await TabMember.query().where('tab_id', member.tabId)
  const unpaidMembers = allMembers.filter((m) => m.status !== 'PAID')
  const allPaid = unpaidMembers.length === 0

  await this.syncTableStatus(member.tabId)

  return {
    member,
    allPaid,
    remainingActiveMembers: unpaidMembers.length,
  }
}

/**
 * Libera a mesa e encerra a comanda global.
 * Exige que todos os membros estejam QUITADOS e não haja pedidos pendentes.
 */
async releaseTable(tableIdOrNumber: number, forceSettleAll: boolean = false): Promise<{ table: Table; tab: Tab | null }> {
  const table = await Table.query()
    .where('id', tableIdOrNumber)
    .orWhere('number', tableIdOrNumber)
    .firstOrFail()

  const tab = await Tab.query()
    .where('table_id', table.id)
    .whereIn('status', ['ABERTA', 'OPEN', 'CONTA_PEDIDA', 'BILL_REQUESTED'])
    .orderBy('id', 'desc')
    .first()

  if (!tab) {
    table.status = 'LIVRE'
    await table.save()
    return { table, tab: null }
  }

  // Trava anti-orfandade global na mesa
  const pendingOrders = await this.getBlockingPendingOrders({ tabId: tab.id })
  if (pendingOrders.length > 0) {
    throw new Error(
      `Não é possível liberar a mesa ${table.number}: existem ${pendingOrders.length} pedido(s) pendente(s) na cozinha ou salão.`
    )
  }

  const members = await TabMember.query().where('tab_id', tab.id)
  const unpaidMembers = members.filter((m) => m.status !== 'PAID')

  if (unpaidMembers.length > 0) {
    if (!forceSettleAll) {
      throw new Error(
        `Não é possível liberar a mesa: ainda existem ${unpaidMembers.length} comanda(s) não quitada(s) (${unpaidMembers.map((m) => m.alias).join(', ')}).`
      )
    }

    // Liquida todos em lote
    const now = DateTime.now()
    for (const m of unpaidMembers) {
      m.status = 'PAID'
      m.paidAt = now
      m.closedAt = now
      await m.save()
    }
  }

  tab.status = 'CLOSED'
  tab.closedAt = DateTime.now()
  await tab.save()

  table.status = 'LIVRE'
  await table.save()

  return { table, tab }
}

/**
 * Sincroniza o status da mesa física de acordo com os membros da comanda.
 */
private async syncTableStatus(tabId: number): Promise<void> {
  const tab = await Tab.query().where('id', tabId).preload('table').first()
  if (!tab || !tab.table) return

  const members = await TabMember.query().where('tab_id', tab.id)
  const activeMembers = members.filter((m) => m.status !== 'PAID')

  if (activeMembers.length === 0) {
    // Todos pagos, aguardando liberação física da mesa
    tab.table.status = 'OCUPADA'
  } else if (activeMembers.every((m) => m.status === 'BILL_REQUESTED')) {
    // Todos os membros restantes pediram conta
    tab.table.status = 'CONTA_PEDIDA'
  } else {
    // Ao menos um membro segue consumindo (OPEN)
    tab.table.status = 'OCUPADA'
  }

  await tab.table.save()
}
```

### 4.2. Atualização do `ClientOrderController` (`app/controllers/client/order_controller.ts`)

A validação de bloqueio de pedidos passa a verificar o status individual do membro logado:

```typescript
// Bloqueia se o próprio membro solicitou a conta ou já foi liquidado
if (tabMember.status === 'BILL_REQUESTED' || tabMember.status === 'PAID') {
  const message =
    tabMember.status === 'PAID'
      ? 'Sua comanda já foi quitada. Agradecemos a preferência!'
      : 'Sua conta já foi solicitada. O garçom está a caminho com a maquininha.'

  session.flash('notification', { type: 'error', message })
  return response.status(422).json({ error: message })
}

// Bloqueia caso a mesa como um todo esteja finalizada
if (tabMember.tab?.status === 'CLOSED' || tabMember.tab?.status === 'FECHADA') {
  const message = 'Esta mesa já foi encerrada.'
  session.flash('notification', { type: 'error', message })
  return response.status(422).json({ error: message })
}
```

### 4.3. Atualização do `ClientSessionMiddleware` (`app/middleware/client_session_middleware.ts`)

Tratamento de membros com comanda já quitada (`PAID`):

```typescript
// Se a comanda do membro já foi quitada individualmente
if (member.status === 'PAID') {
  // Se for requisição ao extrato, permite ver o recibo final
  if (ctx.request.url().includes('/statement') || ctx.request.url().includes('/tab')) {
    ctx.tabMember = member
    return await next()
  }

  // Se tentar ir ao cardápio, exibe aviso e direciona para o extrato quitado
  ctx.session?.flash('notification', {
    type: 'success',
    message: 'Sua comanda foi quitada com sucesso. Obrigado pela visita!',
  })
  return ctx.response.redirect().toPath(`/m/${targetTableNumber}/statement`)
}
```

### 4.4. Atualização das Rotas e Controladores de Staff (`TableGridController`)

Adicionar endpoint para quitação individual de comanda:

#### Em `start/routes.ts`:
```typescript
router
  .group(() => {
    router.get('/tables', [TableGridController, 'index']).as('staff.tables.index')
    router.get('/tables/:id', [TableGridController, 'show']).as('staff.tables.show')
    router.post('/tables/:id/orders', [TableGridController, 'manualOrder']).as('staff.tables.manualOrder')
    router.patch('/tables/orders/:orderId/deliver', [TableGridController, 'markDelivered']).as('staff.tables.deliver')
    router.post('/tables/orders/:orderId/cancel', [TableGridController, 'cancelOrder']).as('staff.tables.cancel')

    // Novas rotas de liquidação e liberação
    router.post('/tables/:id/members/:memberId/pay', [TableGridController, 'settleMember']).as('staff.tables.settleMember')
    router.post('/tables/:id/release', [TableGridController, 'release']).as('staff.tables.release')
  })
  .prefix('/staff')
  .use([middleware.auth(), middleware.role(['GARCOM', 'GERENTE', 'ADMIN', 'CAIXA'])])
```

#### Em `app/controllers/staff/table_grid_controller.ts`:
```typescript
/**
 * Liquida a comanda de um membro individual da mesa (com trava de orfandade)
 */
async settleMember({ params, request, response, session }: HttpContext) {
  try {
    const result = await this.tabSessionService.settleMemberBill(Number(params.memberId))

    session.flash('notification', {
      type: 'success',
      message: `Comanda de ${result.member.alias} quitada com sucesso!`,
    })

    if (request.accepts(['json', 'html']) === 'json' && !request.header('X-Inertia')) {
      return response.ok({ success: true, ...result })
    }

    return response.redirect().back()
  } catch (error: any) {
    session.flash('notification', {
      type: 'error',
      message: error.message || 'Erro ao liquidar comanda.',
    })

    if (request.accepts(['json', 'html']) === 'json' && !request.header('X-Inertia')) {
      return response.status(422).json({ error: error.message })
    }

    return response.redirect().back()
  }
}
```

---

## 5. Escopo Técnico Frontend (Inertia + React)

### 5.1. Painel do Garçom: Gestão Granular de Membros (`inertia/pages/staff/tables/index.tsx`)

O modal de detalhes da mesa é aprimorado para apresentar o controle financeiro de cada cliente:

1. **Card de Comanda por Membro:**
   - Exibe o apelido do cliente (ex: `👤 JOÃO`), badge de status individual:
     - 🟢 `Consumindo` (`OPEN`)
     - 🟡 `Conta Pedida` (`BILL_REQUESTED`)
     - 🟣 `Pago` (`PAID`)
   - Subtotal consumido pelo cliente em reais (`R$ XX,XX`).
   - Resumo de status dos pedidos daquele cliente:
     - `2 itens entregues`
     - `1 item na cozinha` (destacado em amarelo/alerta)
   - **Botão "💳 Liquidar Comanda":**
     - Se o cliente possuir pedidos não-entregues: botão desabilitado com aviso explicativo: *"Aguardando entrega na cozinha"*.
     - Se todos os pedidos estiverem entregues: botão ativo acionando `POST /staff/tables/:id/members/:memberId/pay`.
     - Se já estiver pago (`PAID`): badge verde de confirmação *"Quitado"*.

2. **Rodapé de Liberação da Mesa:**
   - Botão **"Liberar Mesa & Fechar 🏁"**:
     - Fica desabilitado caso existam membros não quitados ou pedidos pendentes.
     - Exibe contador claro: `"Mesa liberável após quitar 1 comanda restante"`.
   - Botão **"⚡ Liquidar Todos e Liberar"**:
     - Permite fechar a mesa inteira em uma única operação, desde que **100% dos pedidos da mesa** já estejam entregues no KDS.

### 5.2. Extrato Mobile do Cliente (`inertia/pages/client/statement.tsx`)

1. **Visão Contextual do Cliente Conectado:**
   - Se o status do próprio membro for `BILL_REQUESTED`:
     - Banner fixo de status: *"🔔 Você solicitou a conta. O garçom está a caminho com a maquininha."*
     - Botão de envio de novos pedidos desativado.
     - Botão inferior alternado para *"Aguardando Garçom..."*.
   - Se o status for `PAID`:
     - Banner elegante de agradecimento: *"✅ Sua comanda foi quitada. Muito obrigado pela visita!"*
   - Se outros clientes pediram a conta mas o cliente atual continua `OPEN`:
     - Banner informativo discreto: *"Alguns amigos já pediram a conta, mas você continua livre para pedir!"*
     - Ações de carrinho e novos pedidos continuam totalmente operacionais.

2. **Ação de Solicitação de Conta:**
   - Opção de escolher entre:
     - **"Pedir Minha Conta (R$ XX,XX)"**: Altera apenas o status do usuário logado.
     - **"Pedir Conta da Mesa Toda"**: Solicita o fechamento de todos os membros.

---

## 6. Critérios de Aceitação

1. **Isolamento de Comandas:** Quando o Cliente A clica em "Pedir Minha Conta", apenas o seu `TabMember.status` transiciona para `BILL_REQUESTED`. O Cliente B na mesma mesa continua com status `OPEN` e consegue navegar no cardápio e submeter novos pedidos para a cozinha normalmente.
2. **Bloqueio de Orfandade no KDS:** O garçom não consegue liquidar a conta de um membro que tenha pedidos em `ENVIADO`, `EM_PREPARO` ou `PRONTO`. O sistema bloqueia a requisição com HTTP 422 e mensagem explicativa.
3. **Desbloqueio após Entrega:** Assim que todos os pratos do membro são marcados como `ENTREGUE` (ou `CANCELADO`), o botão de liquidar comanda fica habilitado.
4. **Liquidação Parcial:** O garçom liquida a comanda do Cliente A (`PAID`). O Cliente A vê sua tela de recibo final/agradecimento. A mesa física continua `OCUPADA` e o Cliente B continua operando normalmente.
5. **Liberação Físico-Lógica Estrita:** A mesa física só pode ser liberada para `LIVRE` e a `Tab` fechada quando todos os membros estiverem com status `PAID` e zero pedidos pendentes.
6. **Liquidação em Lote:** A opção "Liquidar Todos e Liberar" quita todos os membros e libera a mesa de forma atômica, desde que nenhum pedido da mesa esteja pendente de entrega.

---

## 7. Matriz de Testes Automatizados

### 7.1. Testes Unitários de Serviço (`tests/unit/tab_session_service.spec.ts`)

- Teste de transição individual de `requestMemberBill`.
- Teste de bloqueio de `settleMemberBill` quando existem pedidos em `ENVIADO`, `EM_PREPARO` ou `PRONTO`.
- Teste de sucesso de `settleMemberBill` após entrega de todos os itens.
- Teste de bloqueio de `releaseTable` quando há membros não-pagos ou pedidos pendentes.
- Teste de liberação atômica com `forceSettleAll`.

### 7.2. Testes Funcionais HTTP (`tests/functional/staff/individual_tab_lifecycle.spec.ts`)

- Simulação de mesa com 2 clientes:
  1. Cliente 1 e Cliente 2 fazem pedidos.
  2. Cozinha prepara e garçom entrega pedidos do Cliente 1. Pedidos do Cliente 2 permanecem `EM_PREPARO`.
  3. Cliente 1 pede a conta via `POST /m/:number/request-bill`.
  4. Garçom liquida Cliente 1 via `POST /staff/tables/:id/members/:memberId/pay` -> Sucesso (HTTP 200).
  5. Garçom tenta liquidar Cliente 2 com pedidos na cozinha -> Bloqueado (HTTP 422).
  6. Garçom tenta liberar a mesa -> Bloqueado (HTTP 422).
  7. Cozinha finaliza e garçom entrega pedidos do Cliente 2.
  8. Garçom liquida Cliente 2 e libera a mesa -> Sucesso, mesa torna-se `LIVRE`.

### 7.3. Testes E2E com Navegador (`tests/browser/individual_tabs_flow.spec.ts`)

- Execução com Playwright utilizando 2 contextos de navegador concorrentes na mesma mesa:
  - Navegador A (Cliente 1) pede a conta e aguarda.
  - Navegador B (Cliente 2) adiciona sobremesa ao carrinho e dispara pedido com sucesso para o KDS.
  - Painel do Garçom exibe Cliente 1 pronto para pagamento e Cliente 2 com item em preparo.

---

## 8. Critérios de Conclusão (Definition of Done - DoD)

- [ ] Migration criada e executada adicionando `status`, `paid_at` e `closed_at` em `tab_members`.
- [ ] Model `TabMember` atualizado com enum de status e helpers booleanos.
- [ ] `TabSessionService` refatorado com métodos `requestMemberBill`, `settleMemberBill`, `getBlockingPendingOrders` e `releaseTable` com travas de KDS.
- [ ] `ClientOrderController` atualizado com bloqueio por membro individual.
- [ ] `ClientSessionMiddleware` atualizado com suporte a clientes em status `PAID`.
- [ ] `TableGridController` e rotas atualizadas com `settleMember` e liberação condicional.
- [ ] Interface do Painel do Garçom atualizada com tabela/cards de membros e ações individuais de liquidação.
- [ ] Extrato mobile atualizado com exibição contextual de status por membro.
- [ ] Suíte de testes unitários, funcionais e E2E implementada com 100% de sucesso.
- [ ] Documentação indexada em `docs/tasks/README.md`.
- [ ] Nota "Plano de Desenvolvimento" no canvas do Maestri atualizada.
