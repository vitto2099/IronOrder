# Glossário de Domínio (Linguagem Ubíqua)

Este glossário estabelece o vocabulário padronizado entre o negócio (operação do restaurante) e a engenharia de software, baseado nos princípios do _Domain-Driven Design (DDD)_.

---

### **1. Estrutura Física & Atendimento**

- **Mesa (Table):** Entidade física do salão onde os clientes se acomodam. Possui identificador único, número visível e QR Code estático afixado.
- **Status da Mesa:**
  - `LIVRE`: Mesa sem comanda ativa, disponível para novos clientes.
  - `OCUPADA`: Mesa com comanda aberta e clientes associados.
  - `CONTA_PEDIDA`: Clientes solicitaram o encerramento da conta; nenhum novo pedido de cliente é aceito.
- **Membro da Mesa / Alias (Tab Member):** Identidade efêmera do cliente em uma comanda (ex: "Carlos", "Mariana"). Não exige usuário cadastrado; existe apenas durante o ciclo de vida daquela sessão de mesa.

---

### **2. Catálogo & Cardápio**

- **Categoria (Category):** Agrupamento temático de produtos (ex: "Bebidas", "Porções", "Hambúrgueres", "Sobremesas").
- **Produto (Product):** Item comercializável no estabelecimento. Contém nome, descrição, preço unitário, foto e status de disponibilidade.
- **Disponibilidade (Availability):** Flag booleana (`ativo`/`inativo` ou `disponível`/`esgotado`) controlada pela administração para impedir pedidos de produtos sem estoque.
- **Observação do Item (Item Note):** Texto livre opcional inserido pelo cliente ao adicionar um item (ex: "Sem cebola", "Gelo e limão").

---

### **3. Comanda & Sessão**

- **Comanda da Mesa (Tab):** Agregador financeiro e operacional de todos os pedidos realizados em uma mesa desde a sua abertura até o fechamento.
- **Subtotal Individual (Member Subtotal):** Somatório financeiro apenas dos itens pedidos por um determinado Alias.
- **Total da Comanda (Tab Total):** Somatório de todos os pedidos confirmados de todos os membros da mesa.
- **Extrato da Comanda (Tab Statement):** Visualização discriminada de todos os itens consumidos, organizados por Alias e agrupados por status de entrega.

---

### **4. Pedidos & Cozinha**

- **Carrinho Local (Local Cart):** Estrutura mantida localmente no navegador do cliente antes do envio. Permite acumular itens e revisar observações.
- **Lote de Pedido (Order Batch / Order):** Conjunto atômico de itens disparados simultaneamente por um Alias para a cozinha.
- **Item do Pedido (Order Item):** Linha individual de um lote contendo produto, quantidade, preço congelado no momento da compra e observações.
- **Máquina de Estados do Pedido (Order Lifecycle):**
  - `ENVIADO (SUBMITTED)`: Pedido registrado no banco e enfileirado no KDS da cozinha.
  - `EM_PREPARO (PREPARING)`: Cozinha aceitou o pedido e iniciou a confecção.
  - `PRONTO (READY)`: Pedido finalizado na cozinha, aguardando entrega no salão.
  - `ENTREGUE (DELIVERED)`: Garçom entregou o item na mesa física.
  - `CANCELADO (CANCELLED)`: Pedido estornado por operador autorizado (Garçom/Admin).

---

### **5. Operação & Perfis de Usuário (Staff)**

- **Staff User:** Usuário autenticado do sistema com credenciais de acesso e perfil definido.
- **Perfis (Roles):**
  - `ADMIN`: Acesso total a configurações, catálogo, mesas, relatórios e controle de usuários.
  - `GARÇOM (WAITER)`: Acesso ao Grid de Mesas, lançamento manual de pedidos, marcação de entrega e encerramento de comandas.
  - `COZINHA (KITCHEN)`: Acesso exclusivo ao display KDS para gestão da fila de produção.
- **KDS (Kitchen Display System):** Interface operacional em formato Kanban que exibe os pedidos em ordem cronológica de chegada para controle de produção dos cozinheiros/bartenders.
- **PDV / Caixa Físico (POS):** Ponto de atendimento presencial onde ocorre o pagamento real da conta (dinheiro, cartão, Pix físico).
