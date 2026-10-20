# Spec: Order engine

> feature: order-engine
> status: pronta

## Contexto

Motor de processamento de pedidos, ciclo de vida e máquina de estados dos lotes, extrato discriminado com divisão de contas por Alias e operação das telas de Garçom e Cozinha (KDS).

## Histórias

### US-005 — Processamento Atômico e Imutabilidade de Pedidos de Clientes

Como cliente, quero enviar meu lote de itens do carrinho de forma segura, para que a cozinha receba meu pedido exatamente como solicitado e sem risco de alterações posteriores por terceiros.

#### AC-010 — Processamento de Lote em Transação Única com Congelamento de Preço

- **Dado** um carrinho contendo múltiplos itens associados a um Alias de comanda ativa
- **Quando** o cliente confirma o envio do lote de pedidos
- **Então** o sistema grava a ordem e seus itens em uma transação única de banco de dados (`DB.transaction`) fixando os preços unitários atuais; se qualquer item falhar, nenhum dado é persistido (rollback).

#### AC-011 — Imutabilidade de Pedidos Enviados pelo Cliente

- **Dado** um pedido já disparado com status `ENVIADO (SUBMITTED)`
- **Quando** o cliente tenta alterar quantidades, editar observações ou excluir o pedido pela interface mobile
- **Então** o sistema impede a modificação na interface e rejeita requisições diretas de alteração feitas pelo cliente.

#### AC-012 — Restrição de Cancelamento de Pedidos a Perfis Autorizados

- **Dado** um pedido em qualquer status da comanda ativa
- **Quando** um usuário autenticado com perfil `GARCOM` ou `ADMIN` aciona o cancelamento do pedido ou item
- **Então** a máquina de estados altera o status para `CANCELADO`, registrando o colaborador responsável e liberando a recomposição financeira da comanda.

### US-006 — Extrato da Comanda, Divisão de Contas e Cálculo Financeiro

Como cliente na mesa, quero consultar o extrato discriminado dos meus consumos e do total da mesa, para acompanhar os gastos e facilitar a divisão da conta no momento do pagamento.

#### AC-013 — Transparência de Consumo por Alias e Total da Mesa

- **Dado** uma mesa ativa com múltiplos Aliases ("Carlos", "Mariana") e diversos pedidos enviados
- **Quando** qualquer cliente da mesa abre a tela "Extrato da Comanda"
- **Então** o sistema exibe o valor total geral acumulado da mesa e o subtotal individual pertencente a cada Alias discriminadamente.

#### AC-014 — Desconsideração Financeira de Itens Cancelados

- **Dado** um pedido contendo itens com status `CANCELADO`
- **Quando** o cálculo do extrato da comanda ou do subtotal de um Alias é realizado
- **Então** os itens cancelados são exibidos com identificação visual de estorno e seus valores são zerados, não compondo nenhum subtotal ou total.

#### AC-015 — Inclusão de Itens nos Status Ativos no Cálculo do Extrato

- **Dado** itens nos status `ENVIADO`, `EM_PREPARO`, `PRONTO` e `ENTREGUE`
- **Quando** o extrato financeiro da mesa é atualizado
- **Então** todos esses itens ativos são somados e contabilizados nos totais da comanda e do respectivo Alias.

### US-007 — Operação do Salão, Lançamento Manual e Display da Cozinha (KDS)

Como garçom ou cozinheiro, quero visualizar e atualizar os pedidos em tempo real, para manter a produção organizada e garantir a entrega rápida nas mesas.

#### AC-016 — Lançamento Manual de Pedidos pelo Garçom com Alias Avulso

- **Dado** um Garçom operando o painel de controle do salão
- **Quando** seleciona uma mesa ocupada e envia itens escolhendo um Alias existente ou criando um Alias avulso (ex: "Balcão")
- **Então** o pedido é inserido na comanda da mesa e enviado diretamente para a fila de produção da cozinha.

#### AC-017 — Sequenciamento Cronológico no KDS da Cozinha

- **Dado** a tela KDS da cozinha recebendo pedidos de diversas mesas do salão
- **Quando** novos lotes são registrados no sistema
- **Então** o KDS exibe os cards de pedidos em ordem cronológica de envio (`created_at ASC`) destacando visualmente o tempo decorrido desde a criação.

#### AC-018 — Impressão de QR Codes de Mesas no Padrão A4

- **Dado** a página administrativa de gestão de mesas
- **Quando** o administrador solicita a impressão das etiquetas de QR Code
- **Então** o sistema renderiza uma página formatada para impressão A4 contendo o número da mesa em destaque e o QR Code direcionando para a URL configurada do túnel.

## Fora de escopo

- Integração com impressoras térmicas de cupom fisicamente conectadas por cabo serial/USB (foco do MVP é KDS digital em tela).
- Roteamento inteligente de itens para múltiplas praças (ex: dividir bar vs cozinha em portas separadas).

## Suposições

| ID      | Suposição                                                                                                                                                          | Status | Resolução |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------- |
| ASM-004 | O mecanismo de polling parcial do Inertia (`router.reload({ only: [...] })`) atualiza a tela do KDS e o extrato a cada 5 segundos com baixo impacto no SQLite WAL. | aberta | —         |

## Perguntas em aberto

| ID    | Pergunta                                                                                                           | Status     | Resposta |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ---------- | -------- |
| Q-003 | O painel KDS da cozinha deve emitir um aviso sonoro (beep de áudio) sempre que um novo pedido der entrada na fila? | respondida | Sim      |
