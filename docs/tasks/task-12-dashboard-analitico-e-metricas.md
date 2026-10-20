# TASK-12: Dashboard Analítico & Relatórios Financeiros (MVP)

- **ID:** `TASK-12`
- **Feature:** `FEATURE-09: Dashboard Analítico & Métricas Financeiras`
- **Responsável Sugerido:** Dev-2
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-11 de Gestão de Mesas e Staff)
- **Dependências:** TASK-01, TASK-04, TASK-06

---

## 1. Objetivo e Contexto

Construir o painel executivo de visualização analítica (**Business Intelligence**) para gerentes e administradores do restaurante (conforme **RN-08**). O painel consolida o faturamento do negócio a partir das comandas encerradas, analisa o mix de produtos mais vendidos, calcula tickets médios por mesa e por pessoa, e revela os horários de pico operacional do salão.

---

## 2. Regras de Negócio e Referências

- **RN-08.1 (Consolidação de Receita):** O painel consolida o faturamento por períodos (Hoje, Esta Semana, Este Mês, Customizado) considerando exclusivamente comandas com status `FECHADA`.
- **RN-08.2 (Mix de Vendas e Volume):** Exibir a quantidade vendida e o faturamento total arrecadado por item e por categoria.
- **RN-08.3 (Indicadores de Performance):** Apresentar o ticket médio por comanda, o ticket médio por cliente/alias e gráfico de horários de pico.
- **RN-08.4 (Restrição de Exportação):** O MVP contempla exclusivamente visualização interativa em tela, sem exportação para CSV ou PDF.
- **RN-07.1 / RN-07.4:** Acesso restrito aos perfis `ADMIN` e `GERENTE`.

---

## 3. Escopo Técnico Backend

### 3.1. Rotas HTTP (`start/routes.ts`)

```typescript
router
  .group(() => {
    router.get('/dashboard', [controllers.Dashboard, 'index']).as('admin.dashboard.index')
  })
  .prefix('/admin')
  .use([middleware.auth(), middleware.role(['ADMIN', 'GERENTE'])])
```

### 3.2. Controller (`app/controllers/admin/dashboard_controller.ts`)

- `index({ request, inertia })`:
  - Lê parâmetros de filtro: `period` (`today`, `week`, `month`, `custom`), `startDate`, `endDate`.
  - Constrói o range temporal (`from` e `to` em Luxon DateTime).
  - **Consultas de Agregação no SQLite:**
    1. _Total Arrecadado & Comandas:_ Consulta em `tabs` onde `status = 'FECHADA'` e `closed_at BETWEEN from AND to`.
       - Soma dos `order_items` (com `unit_price * quantity`) desconsiderando itens de pedidos com `status = 'CANCELADO'`.
       - Contagem total de comandas fechadas.
       - Contagem total de membros (`tab_members`) atendidos nessas comandas.
    2. _Ticket Médio:_
       - `ticketMedioComanda = totalFaturamento / totalComandas`
       - `ticketMedioCliente = totalFaturamento / totalMembros`
    3. _Mix de Vendas (Top Pratos):_
       - `order_items` agrupados por `name_snapshot`:
       - `SUM(quantity) as total_qty`, `SUM(unit_price * quantity) as total_revenue`. Ordenado por `total_revenue DESC` limite 10.
    4. _Faturamento por Categoria:_
       - Agrupamento somando receita vinculada à categoria do prato.
    5. _Distribuição por Faixa Horária:_
       - Agrupamento de pedidos por hora usando `strftime('%H', created_at)`.
  - Retorna o pacote de dados analíticos para a página Inertia.

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Página do Dashboard (`inertia/pages/admin/dashboard/index.tsx`)

- Utiliza o layout mestre `inertia/layouts/staff_layout.tsx`.
- **Barra de Controle Temporal:**
  - Botões de seleção rápida com highlight ativo: `[ Hoje ]`, `[ Últimos 7 Dias ]`, `[ Este Mês ]`.
  - Campos de data Inicial e data Final para período customizado com botão "Filtrar".
- **Grid de Cards de KPI no Topo:**
  - 💰 **Faturamento Total:** Valor em destaque formatado em BRL (ex: `R$ 14.850,00`).
  - 🧾 **Comandas Fechadas:** Número de mesas atendidas no período.
  - 👥 **Total de Clientes Atendidos:** Contagem de aliases registrados.
  - 📈 **Ticket Médio por Mesa:** Valor médio gasto por comanda.
  - 👤 **Ticket Médio por Pessoa:** Gasto médio por indivíduo na mesa.
- **Seção de Gráficos e Distribuição:**
  - **Gráfico de Horários de Pico:** Visualização em barras horizontais ou gráfico de colunas por faixa de horário (11h às 23h), permitindo identificar visualmente os picos do almoço e jantar.
  - **Participação por Categoria:** Barra percentual ou gráfico de composição mostrando a fatia de Entradas, Principais, Sobremesas e Bebidas.
- **Tabela de Performance de Produtos (Mix de Vendas):**
  - Tabela listando:
    - Posição (#1 a #10 com badge).
    - Nome do Prato.
    - Categoria.
    - Quantidade de unidades vendidas.
    - Faturamento bruto total arrecadado.
    - Barra visual proporcional de volume.

---

## 5. Critérios de Aceitação

1. **Consistência de Status (RN-08.1):** Mesas com comanda em aberto ou pedidos cancelados não afetam o cálculo do faturamento fechado.
2. **Exatidão dos Indicadores (RN-08.3):** O ticket médio por mesa e por cliente é calculado com exatidão matemática a partir das entidades persistidas.
3. **Filtros Dinâmicos:** Alternar entre "Hoje" e "Este Mês" atualiza os números na tela sem recarregar a página inteira (Inertia partial reload com `preserveState: true`).
4. **Resguardo de Acesso:** Apenas `ADMIN` e `GERENTE` têm acesso autorizado a esta rota.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Rota `/admin/dashboard` protegida por autenticação e RBAC.
- [ ] Controller com queries agregadas de agregação do SQLite testadas e eficientes.
- [ ] Página React `dashboard/index.tsx` estilizada com Tailwind CSS.
- [ ] Testes funcionais validando o cálculo de receita com dados simulados de comandas abertas e fechadas.
- [ ] Cobertura de testes unitários e de integração validada.
