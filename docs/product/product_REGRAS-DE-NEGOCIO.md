# Regras de Negócio do Produto

Este documento reúne todas as diretrizes funcionais e restrições comerciais que ditam o comportamento do sistema.

---

## RN-01: Abertura e Sessão de Mesa

- **RN-01.1 (Primeiro Acesso):** Se a mesa estiver no status `LIVRE`, a inserção do primeiro Alias pelo QR Code altera automaticamente o status da mesa para `OCUPADA` e inicializa uma nova `Comanda`.
- **RN-01.2 (Unicidade de Alias):** Em uma mesma comanda ativa, dois membros não podem possuir o mesmo apelido exato. Caso ocorra colisão, o sistema deve sugerir ou anexar um identificador (ex: "Bruno (2)").
- **RN-01.3 (Persistência da Sessão):** O cookie de identificação do cliente deve expirar automaticamente em 12 horas ou no momento em que a comanda for encerrada pelo caixa.

---

## RN-02: Catálogo e Disponibilidade

- **RN-02.1 (Produtos Indisponíveis):** Produtos marcados como `indisponíveis` pelo Admin não podem ser adicionados ao carrinho no frontend nem aceitos pelo backend.
- **RN-02.2 (Congelamento de Preço):** O preço unitário do item deve ser copiado e fixado no registro do `OrderItem` no momento do pedido. Alterações posteriores de preço no catálogo não afetam pedidos já enviados.
- **RN-02.3 (Exclusão Segura):** Produtos vinculados a pedidos existentes no histórico não podem ser excluídos fisicamente do banco de dados (devem utilizar _soft delete_ ou flag de inativação).

---

## RN-03: Carrinho e Disparo de Pedidos

- **RN-03.1 (Atomicidade do Lote):** O disparo de um carrinho contendo múltiplos itens deve ser processado em uma única transação de banco de dados. Se um item falhar, nenhum item do lote é gravado.
- **RN-03.2 (Imutabilidade pelo Cliente):** Após o clique em "Confirmar Pedido" e a transição para `ENVIADO`, o cliente não pode mais editar, alterar quantidades ou cancelar o pedido diretamente pelo celular.
- **RN-03.3 (Cancelamento de Pedidos):** Apenas usuários autenticados com perfil `GARÇOM` ou `ADMIN` têm permissão para cancelar pedidos ou itens após o envio.

---

## RN-04: Divisão de Contas e Cálculo Financeiro

- **RN-04.1 (Transparência de Consumo):** O extrato da comanda deve permitir que qualquer cliente da mesa visualize o total acumulado da mesa e o subtotal discriminado de cada Alias.
- **RN-04.2 (Itens Cancelados):** Itens com status `CANCELADO` não devem compor o subtotal de nenhum cliente nem o total geral da comanda.
- **RN-04.3 (Itens Entregues vs. Em Preparo):** Todos os itens com status `ENVIADO`, `EM_PREPARO`, `PRONTO` e `ENTREGUE` são contabilizados no extrato financeiro da comanda.

---

## RN-05: Encerramento e Liberação de Mesa

- **RN-05.1 (Solicitação de Conta):** Ao clicar em "Pedir Conta" no celular, a mesa transita para o status `CONTA_PEDIDA`, bloqueando novos pedidos de clientes e emitindo um aviso visual no painel dos Garçons.
- **RN-05.2 (Liquidação Presencial):** O sistema não processa cobranças financeiras online (sem gateway de pagamento). O pagamento é confirmado pelo Garçom/Caixa no PDV físico.
- **RN-05.3 (Liberação e Arquivamento):** Ao acionar a ação "Liberar Mesa", a comanda atual é marcada como `FECHADA`, todos os pedidos associados são arquivados para histórico, os cookies de clientes vinculados tornam-se inválidos e a mesa retorna ao status `LIVRE`.

---

## RN-06: Operação do Salão e Cozinha

- **RN-06.1 (Lançamento Manual pelo Garçom):** O Garçom pode adicionar pedidos a uma mesa ocupada selecionando um Alias existente ou criando um Alias avulso (ex: "Balcão", "Cliente Avulso").
- **RN-06.2 (Sequenciamento no KDS):** O display da cozinha deve ordenar os lotes de pedidos estritamente por ordem cronológica de recebimento (`created_at ASC`), destacando o tempo de espera decorrido.
- **RN-06.3 (Impressão de QR Codes):** A página administrativa de impressão deve renderizar as etiquetas de mesa diagramadas para folhas no padrão A4, incluindo o número legível da mesa e o QR Code direcionando para a URL configurada do túnel.

---

## RN-07: Autenticação de Staff e Permissões (RBAC)

- **RN-07.1 (Papéis de Acesso):** O sistema deve prover controle de acesso baseado em papéis fixos (`ADMIN`, `GERENTE`, `GARCOM`, `CAIXA`, `COZINHA`).
- **RN-07.2 (Cadastro de Colaboradores):** O Administrador realiza o cadastro direto de novos colaboradores inserindo Nome, E-mail, Senha Inicial e Papel.
- **RN-07.3 (Unicidade de Identificação):** Cada funcionário deve possuir um e-mail único no sistema, sendo recusada qualquer tentativa de colisão.
- **RN-07.4 (Proteção de Rotas Administrativas):** Perfis operacionais (`GARCOM`, `COZINHA`) não podem acessar rotas de configurações gerais, relatórios avançados ou gestão de funcionários (HTTP 403).

---

## RN-08: Dashboard Analítico e Relatórios Financeiros

- **RN-08.1 (Consolidação de Receita):** O painel deve consolidar o faturamento por períodos (Dia, Semana, Mês ou Customizado) considerando exclusivamente comandas com status `FECHADA` e pagas.
- **RN-08.2 (Mix de Vendas e Volume):** Exibição da quantidade e faturamento total arrecadado por item/categoria nos filtros de datas selecionados.
- **RN-08.3 (Indicadores de Performance):** Exibição do ticket médio (por comanda e por cliente) e gráfico contendo a distribuição de faixas horárias de pico de pedidos.
- **RN-08.4 (Restrição de Exportação):** O MVP contempla apenas a visualização em tela das métricas integradas do dashboard, sem recursos de exportação a arquivos externos (PDF/CSV).
