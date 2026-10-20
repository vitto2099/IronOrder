# TASK-09: Extrato Mobile da Mesa, Divisão de Subtotais e Solicitação de Conta

- **ID:** `TASK-09`
- **Feature:** `FEATURE-06: Extrato Mobile da Mesa e Fechamento de Conta`
- **Responsável Sugerido:** Dev-2
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-08 de Cardápio Mobile e TASK-10 de Painel Garçom)
- **Dependências:** TASK-01, TASK-04, TASK-05, TASK-06

---

## 1. Objetivo e Contexto

Desenvolver a visão mobile do **Extrato da Comanda** e o mecanismo de **Solicitação de Conta** no smartphone do cliente. Resolve uma das maiores dores em bares e restaurantes: permitir que amigos dividam a conta com total transparência (**RN-04.1**), sabendo exatamente quanto cada pessoa consumiu, além de permitir chamar o garçom para fechamento com 1 clique (**RN-05.1**).

---

## 2. Regras de Negócio e Referências

- **RN-04.1 (Transparência de Consumo):** Qualquer cliente da mesa pode visualizar o total acumulado da mesa e o subtotal discriminado de cada Alias.
- **RN-04.2 (Itens Cancelados):** Pedidos cancelados não compõem subtotais nem o total da mesa.
- **RN-04.3 (Itens Faturáveis):** Pedidos `ENVIADO`, `EM_PREPARO`, `PRONTO` e `ENTREGUE` são computados.
- **RN-05.1 (Solicitação de Conta):** Ao clicar em "Pedir Conta", a mesa transita para `CONTA_PEDIDA`, bloqueando novos pedidos.
- **RN-05.2 (Liquidação Presencial):** O sistema não possui gateway online; o pagamento ocorre presencialmente com o Garçom/Caixa.

---

## 3. Escopo Técnico Backend

### 3.1. Rotas HTTP (`start/routes.ts`)

```typescript
router
  .group(() => {
    router
      .get('/m/:tableNumber/tab', [controllers.ClientTab, 'statement'])
      .as('client.tab.statement')
    router
      .post('/m/:tableNumber/request-bill', [controllers.ClientTab, 'requestBill'])
      .as('client.tab.requestBill')
  })
  .use(middleware.clientSession())
```

### 3.2. Controller (`app/controllers/client/tab_controller.ts`)

- `statement({ params, inertia, clientSession })`:
  - Executa `TabSessionService.getTabSummary(table.id)`.
  - Mapeia pedidos agrupados:
    - `mySubtotal`: soma financeira dos itens do `clientSession.tabMember.id`.
    - `tableTotal`: soma de todos os itens faturáveis da mesa.
    - `membersBreakdown`: lista de cada Alias com seus respectivos itens pedidos e subtotais.
    - `tableStatus`: status atual da mesa (`OCUPADA` ou `CONTA_PEDIDA`).
  - Renderiza `client/statement`.
- `requestBill({ params, response, clientSession })`:
  - Invoca `TabSessionService.requestBill(table.id)`.
  - Redireciona de volta com flash message informando que a solicitação foi enviada à equipe.

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Página do Extrato (`inertia/pages/client/statement.tsx`)

- Container mobile padronizado (`max-w-md mx-auto bg-[#F6F6F6] min-h-screen pb-24`).
- **Navegação Superior:**
  - Botão de retorno ao cardápio (`← Voltar ao Cardápio`).
  - Identificação: "Extrato da Mesa {tableNumber}".
- **Card Resumo Financeiro:**
  - Destaque superior em fundo escuro contrastante ou card branco:
    - **Total Geral da Mesa:** `R$ XXX,XX`
    - **Sua Parte ({member.alias}):** `R$ YY,YY` (em destaque para clareza imediata).
- **Banner de Status:**
  - Se `tableStatus === 'CONTA_PEDIDA'`:
    - Card amarelo com ícone de sino/espera: _"Conta solicitada! O garçom está a caminho para receber o pagamento no cartão, dinheiro ou Pix."_
- **Seção "Seu Consumo":**
  - Lista de itens pedidos pelo cliente conectado com badge visual do status de produção:
    - `ENVIADO` (Aguardando início 🟡)
    - `EM_PREPARO` (Na cozinha 🍳)
    - `PRONTO` (A caminho da mesa 🔔)
    - `ENTREGUE` (Entregue na mesa ✅)
- **Seção "Outros Membros da Mesa":**
  - Accordion expansível para cada amigo da mesa:
    - Cabeçalho: Nome do Alias e subtotal individual (ex: _"Mariana · R$ 56,00"_).
    - Itens consumidos por aquele participante.
- **Ação Inferior Fixa:**
  - Se a mesa estiver `OCUPADA`:
    - Botão proeminente: **"Pedir a Conta"**.
    - Modal de confirmação para prevenir acionamentos acidentais.
  - Se estiver `CONTA_PEDIDA`:
    - Botão desabilitado com label "Aguardando garçom...".
- **Polling Inteligente:**
  - Recarga periódica a cada 6 segundos via `router.reload({ only: ['tabSummary', 'tableStatus'], preserveScroll: true })`.

---

## 5. Critérios de Aceitação

1. **Precisão da Divisão de Conta:** A soma dos subtotais individuais de todos os Aliases bate exatamente com o total geral da comanda.
2. **Itens Cancelados Ignorados:** Se um item foi cancelado pela equipe, ele é exibido riscado ou com badge `CANCELADO`, e seu valor é deduzido do total.
3. **Bloqueio ao Pedir Conta:** Acionar "Pedir a Conta" atualiza o status para `CONTA_PEDIDA` e bloqueia novos pedidos no cardápio.
4. **Acompanhamento de Status:** O cliente vê seu pedido mudar de `EM_PREPARO` para `PRONTO` e `ENTREGUE` automaticamente na tela sem refresh manual.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Rotas de extrato e pedir conta implementadas com middleware `clientSession`.
- [ ] Página React `statement.tsx` com divisão por membro e visualização de status.
- [ ] Modal de confirmação de pedido de conta implementado.
- [ ] Testes funcionais garantindo cálculo correto dos subtotais e transição para `CONTA_PEDIDA`.
- [ ] Polling suave sem flicker de tela.
