# Spec: Catalog management

> feature: catalog-management
> status: pronta

## Contexto

Gestão do catálogo de produtos e categorias do estabelecimento, controle de disponibilidade de itens em estoque, congelamento de preços em pedidos e exclusão segura com soft delete.

## Histórias

### US-003 — Gestão de Categorias e Produtos com Controle de Disponibilidade

Como administrador ou gerente, quero gerenciar o catálogo de produtos e marcar itens como indisponíveis quando esgotarem, para impedir pedidos indevidos de itens sem estoque.

#### AC-006 — Bloqueio de Produtos Indisponíveis no Cardápio e no Backend

- **Dado** um produto marcado como `indisponível` pelo Admin no painel de gerenciamento
- **Quando** o cliente visualiza o cardápio ou tenta enviar um pedido contendo esse item
- **Então** o item é exibido como "Esgotado" com botão de adição desabilitado na interface, e qualquer requisição direta no backend contendo o item é rejeitada com erro HTTP 422.

#### AC-007 — Estruturação Hierárquica de Categorias e Produtos

- **Dado** o painel de gerenciamento do catálogo no módulo administrativo
- **Quando** o administrador cadastra uma nova categoria e insere produtos vinculados com foto, nome, descrição e preço
- **Então** a árvore hierárquica do catálogo é atualizada e disponibilizada na interface pública do cliente.

### US-004 — Congelamento de Preços e Exclusão Segura de Produtos

Como sistema e administrador, quero garantir a integridade dos valores cobrados e do histórico de vendas, congelando o preço no pedido e impedindo a exclusão física de produtos já vendidos.

#### AC-008 — Congelamento de Preço Unitário no Item do Pedido

- **Dado** um produto cadastrado no catálogo com valor unitário de R$ 25,00
- **Quando** um cliente confirma um pedido contendo esse item e posteriormente o Administrador altera o preço do produto no catálogo para R$ 30,00
- **Então** o valor unitário gravado no registro do pedido original permanece inalterado em R$ 25,00.

#### AC-009 — Exclusão Segura (Soft Delete) de Produtos com Histórico

- **Dado** um produto vinculado a pedidos históricos finalizados no banco de dados
- **Quando** o Administrador aciona a exclusão desse produto no painel do catálogo
- **Então** o sistema realiza _soft delete_ (ou marcação de inativado), ocultando o produto das listagens ativas sem violar as chaves estrangeiras ou a integridade dos pedidos passados.

## Fora de escopo

- Gestão avançada de ficha técnica ou controle de estoque por ingredientes/gramas.
- Edição de preços em tempo real com propagação dinâmica para carrinhos não disparados.

## Suposições

| ID      | Suposição                                                                                                                    | Status | Resolução |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| ASM-003 | O upload e armazenamento de fotos de produtos utiliza o AdonisJS Drive local no diretório `tmp/uploads` ou `public/uploads`. | aberta | —         |

## Perguntas em aberto

| ID    | Pergunta                                                                                                          | Status     | Resposta                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| Q-002 | Produtos indisponíveis devem ser mantidos visíveis como "Esgotado" ou completamente ocultados da tela do cliente? | respondida | Não devem ser ocultados, devem ser mantidos visíveis, mas com a opção de adicionar ao carrinho desabilitada. |
