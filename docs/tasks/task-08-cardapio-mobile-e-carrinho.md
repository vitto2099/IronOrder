# TASK-08: Interface Mobile do Cliente - Cardápio Interativo, Carrinho e Disparo de Pedidos

- **ID:** `TASK-08`
- **Feature:** `FEATURE-05: Interface Mobile do Cliente (Cardápio, Carrinho e Pedidos)`
- **Responsável Sugerido:** Dev-1
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-09 de Extrato da Mesa e TASK-10 de Painel Garçom)
- **Dependências:** TASK-01, TASK-02, TASK-05, TASK-06

---

## 1. Objetivo e Contexto

Construir a experiência principal de visualização e compra do cliente em seu próprio smartphone. Integra o design de alta fidelidade desenvolvido em [menu-example.tsx](../../design/menu-example.tsx) ao ecossistema **Inertia.js (React)** e **AdonisJS v6**, permitindo busca em tempo real, navegação fluida por categorias com emojis, modal de produto com observações personalizadas (ex: _"sem cebola"_), carrinho flutuante com cálculo instantâneo e disparo atômico de pedidos para a cozinha (**RN-02, RN-03**).

---

## 2. Regras de Negócio e Referências

- **Design de Referência:** Seguir rigorosamente a estética, espaçamentos e componentes de [menu-example.tsx](../../design/menu-example.tsx).
- **RN-02.1 (Produtos Indisponíveis):** Pratos marcados como indisponíveis não podem ser adicionados ao carrinho.
- **RN-03.1 (Atomicidade do Lote):** O carrinho deve ser enviado como um lote único em transação.
- **RN-03.2 (Imutabilidade pelo Cliente):** Uma vez enviado, o pedido não pode ser editado pelo cliente.
- **RN-05.1:** Bloquear envio caso a mesa esteja no status `CONTA_PEDIDA`.

---

## 3. Escopo Técnico Backend

### 3.1. Rotas HTTP (`start/routes.ts`)

```typescript
router
  .group(() => {
    router.get('/m/:tableNumber/menu', [controllers.ClientMenu, 'index']).as('client.menu.index')
    router
      .post('/m/:tableNumber/orders', [controllers.ClientOrder, 'store'])
      .as('client.order.store')
  })
  .use(middleware.clientSession())
```

### 3.2. Controllers

- `app/controllers/client/menu_controller.ts`:
  - Utiliza `CatalogService.getCatalogTree({ onlyAvailable: true })`.
  - Envia props para o Inertia:
    - `tableNumber`: número da mesa física.
    - `member`: `{ id, alias }` extraído do cookie de sessão (`clientSession`).
    - `categories`: lista de categorias com pratos disponíveis.
    - `tableStatus`: status da mesa (`LIVRE`, `OCUPADA`, `CONTA_PEDIDA`).
- `app/controllers/client/order_controller.ts`:
  - Valida o payload de itens via `batchOrderValidator` (aceitando `productId`, `quantity`, `notes`).
  - Chama `OrderEngineService.submitBatchOrder({ tabId, memberId, items })`.
  - Retorna redirect de volta ou para a aba de extrato com mensagem de confirmação via flash session.

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Página Principal do Cardápio (`inertia/pages/client/menu.tsx`)

- Container mobile restrito centralizado (`max-w-md mx-auto bg-[#F6F6F6] min-h-screen`).
- **Header:**
  - Título "Mesa+" / "Restaurante Bê".
  - Badge indicador da Mesa (ex: "Mesa 12").
  - Saudação personalizada ao cliente: _"Olá, {member.alias} 👋"_.
  - Link de navegação para a tela de Extrato da Comanda / Conta da Mesa.
- **Busca Rápida:**
  - Input interativo com ícone de lupa e botão de limpar busca (`search !== ""`).
  - Filtro instantâneo no cliente por nome e descrição do prato.
- **Carrossel Horizontal de Categorias:**
  - Botões circulares/pills com emojis ("✦ Todos", "🥗 Entradas", "🍽 Principais", "🍫 Sobremesas", "🍷 Bebidas").
  - Scroll suave horizontal com highlight na categoria selecionada.
- **Listagem de Pratos em Cards:**
  - Renderização fiel de `MenuCard`:
    - Nome, descrição com corte de linha (`line-clamp-2`), preço formatado em BRL (`R$ XX,XX`).
    - Badges de tags estilizadas (`Vegano`, `Sem Glúten`, etc.).
    - Imagem em miniatura com bordas arredondadas.
    - Botão circular de adição rápida ou contador de quantidade se já estiver no carrinho.
- **Modal de Detalhes do Produto (`ProductModal.tsx`):**
  - Imagem expandida no topo com botão de fechar.
  - Título, descrição completa, preço unitário.
  - **Campo de Observação do Item:** textarea para o cliente digitar instruções à cozinha (ex: _"Ao ponto para mal passada, sem salada"_).
  - Controle de quantidade (`+` / `-`) e botão "Adicionar ao pedido".
- **Barra Flutuante de Carrinho (`CartFloatingBar.tsx`):**
  - Aparece suavemente no rodapé quando `cartCount > 0`.
  - Botão preto contrastante: indicador numérico de itens, label "Ver pedido" e valor acumulado.
- **Modal de Revisão do Carrinho (`CartModal.tsx`):**
  - Drawer deslizante inferior com lista discriminada de itens e observações.
  - Ajuste rápido de quantidades ou remoção de itens.
  - Exibição do total a pagar do lote.
  - Botão de ação: **"Enviar pedido para a cozinha"** (com loading state contra cliques duplos).
  - Alerta caso a mesa tenha entrado em `CONTA_PEDIDA`.

### 4.2. Persistência do Carrinho

- Manter o carrinho no estado do React com persistência opcional no `localStorage` por chave de mesa (`qr_order_cart_m12`), garantindo que se o celular recarregar, os itens selecionados não sejam perdidos antes do envio.

---

## 5. Critérios de Aceitação

1. **Fidelidade Visual:** A tela do cardápio renderiza com o mesmo padrão visual, tipografia e espaçamento de `menu-example.tsx`.
2. **Envio do Pedido com Sucesso:** Clicar em "Enviar pedido para a cozinha" grava o pedido com sucesso via transação no backend e limpa o carrinho local.
3. **Observações Gravadas:** O texto inserido na observação é salvo no `order_items.notes` e disponibilizado para a cozinha.
4. **Alerta de Mesa Fechando:** Se a mesa estiver em `CONTA_PEDIDA`, o botão de envio é desabilitado com aviso explicativo.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Rotas `/m/:tableNumber/menu` e `/m/:tableNumber/orders` funcionais.
- [ ] Interface React `menu.tsx` implementada e testada em viewport mobile (375px a 430px).
- [ ] Modal de produto e modal de carrinho funcionando sem falhas de scroll.
- [ ] Testes funcionais simulando envio de pedido do cliente via HTTP.
- [ ] Zero erros de lint e typecheck.
