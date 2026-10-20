# Spec: Analytics dashboard

> feature: analytics-dashboard
> status: pronta

## Contexto

Painel de controle analítico do estabelecimento para acompanhamento de faturamento por período, mix de produtos vendidos, ticket médio e faixas horárias de pico de atendimento.

## Histórias

### US-010 — Consolidação de Faturamento e Mix de Vendas

Como administrador ou gerente, quero visualizar os resultados financeiros e o faturamento por período, para entender o desempenho comercial e o mix de produtos mais vendidos.

#### AC-022 — Consolidação Exclusiva de Comandas Fechadas e Pagas

- **Dado** o Administrador selecionando um filtro temporal (Dia, Semana, Mês ou Período Customizado)
- **Quando** o dashboard calcula a receita acumulada
- **Então** o somatório considera exclusivamente comandas com status `FECHADA` e devidamente pagas, desconsiderando comandas ativas ou em aberto.

#### AC-023 — Exibição do Mix de Vendas e Volume por Categoria e Item

- **Dado** o período temporal selecionado no dashboard
- **Quando** a seção "Mix de Vendas" é carregada
- **Então** exibe o volume total de unidades vendidas e o faturamento bruto arrecadado por item e por categoria de produto.

### US-011 — Indicadores de Performance e Restrição de Exportação

Como administrador, quero visualizar métricas de ticket médio e horários de pico exclusivamente em tela, para tomar decisões operacionais rápidas sem necessidade de relatórios externos.

#### AC-024 — Cálculo de Ticket Médio por Comanda, por Cliente e Horários de Pico

- **Dado** o histórico de comandas finalizadas no período filtrado
- **Quando** as métricas analíticas são processadas
- **Então** o painel exibe o ticket médio por comanda, o ticket médio por cliente (Alias) e um gráfico contendo a distribuição de faixas horárias com maior volume de pedidos disparados.

#### AC-025 — Visualização Integrada Exclusiva em Tela (Sem Exportação)

- **Dado** a interface do dashboard analítico no MVP
- **Quando** visualizada pelo Administrador
- **Então** os relatórios e métricas são exibidos de forma responsiva diretamente no painel web, sem disponibilizar recursos ou botões de exportação para arquivos externos (PDF ou CSV).

## Fora de escopo

- Exportação de dados para arquivos PDF, CSV ou Excel no MVP.
- Integração com sistemas de contabilidade de terceiros ou emissão de nota fiscal eletrônica (NFC-e).

## Suposições

| ID      | Suposição                                                                                                                              | Status | Resolução |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| ASM-006 | Os gráficos do dashboard utilizam componentes leves de visualização React (ex: Recharts) alimentados pelas props passadas via Inertia. | aberta | —         |

## Perguntas em aberto

| ID    | Pergunta                                                                                                                           | Status     | Resposta        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- |
| Q-005 | As consultas agregadas do dashboard devem ser otimizadas utilizando views de banco de dados ou índices dedicados na tabela `tabs`? | respondida | Utilize índices |
