# TASK-03: CatalogModule - Painel Administrativo de Categorias e Produtos

- **ID:** `TASK-03`
- **Feature:** `FEATURE-02: CatalogModule (Gestão de Categorias, Produtos e Disponibilidade)`
- **Responsável Sugerido:** Dev-1
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-05 de Onboarding e TASK-07 de KDS)
- **Dependências:** TASK-01, TASK-02

---

## 1. Objetivo e Contexto

Desenvolver a interface administrativa e os controllers de backend para gestão completa do catálogo de produtos e categorias do restaurante. Permite que gestores e administradores criem pratos, atualizem preços, organizem a hierarquia do cardápio e realizem a alteração imediata de disponibilidade com **1 clique** (indisponibilizando pratos esgotados em tempo real, conforme **RN-02.1**).

---

## 2. Regras de Negócio e Referências

- **RN-02.1 (Produtos Indisponíveis):** Gestores devem poder ligar/desligar a disponibilidade de qualquer prato a qualquer instante.
- **RN-02.3 (Exclusão Segura):** Ação de exclusão pelo painel deve acionar a rotina segura do `CatalogService`, prevenindo erros de chave estrangeira em itens já faturados.
- **RN-07.1 / RN-07.4:** Painel restrito exclusivamente aos perfis `ADMIN` e `GERENTE`.

---

## 3. Escopo Técnico Backend

### 3.1. Rotas do AdonisJS (`start/routes.ts`)

```typescript
router
  .group(() => {
    router.get('/catalog', [controllers.CatalogAdmin, 'index']).as('admin.catalog.index')
    router
      .post('/catalog/categories', [controllers.CatalogAdmin, 'storeCategory'])
      .as('admin.catalog.categories.store')
    router
      .put('/catalog/categories/:id', [controllers.CatalogAdmin, 'updateCategory'])
      .as('admin.catalog.categories.update')
    router
      .post('/catalog/products', [controllers.CatalogAdmin, 'storeProduct'])
      .as('admin.catalog.products.store')
    router
      .put('/catalog/products/:id', [controllers.CatalogAdmin, 'updateProduct'])
      .as('admin.catalog.products.update')
    router
      .patch('/catalog/products/:id/availability', [controllers.CatalogAdmin, 'toggleAvailability'])
      .as('admin.catalog.products.toggle')
    router
      .delete('/catalog/products/:id', [controllers.CatalogAdmin, 'destroyProduct'])
      .as('admin.catalog.products.destroy')
  })
  .prefix('/admin')
  .use([middleware.auth(), middleware.role(['ADMIN', 'GERENTE'])])
```

### 3.2. Controller (`app/controllers/admin/catalog_admin_controller.ts`)

- `index({ inertia })`: Invoca `CatalogService.getCatalogTree({ onlyAvailable: false })` e renderiza `admin/catalog/index`.
- `toggleAvailability({ params, request, response })`: Lê o boolean `isAvailable` e chama `CatalogService.updateProductAvailability(params.id, isAvailable)`. Redireciona de volta com flash message de sucesso.
- `storeProduct({ request, response })`: Valida via `productValidator`, envia ao `CatalogService.upsertProduct` e redireciona.
- `updateProduct({ params, request, response })`: Valida e atualiza o item via `CatalogService`.
- `destroyProduct({ params, response })`: Executa `CatalogService.deleteProduct(params.id)`.

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Página Principal (`inertia/pages/admin/catalog/index.tsx`)

- Utilizar o layout mestre `inertia/layouts/staff_layout.tsx`.
- **Barra de Ferramentas Superior:**
  - Campo de busca em tempo real de produtos por nome.
  - Botão "+ Nova Categoria" (abre modal de categoria).
  - Botão "+ Novo Produto" (abre drawer/modal de produto).
- **Lista / Tabela de Produtos Agrupada por Categoria:**
  - Cabeçalho de categoria com emoji e ação de editar categoria.
  - Cards ou linhas de tabela com:
    - Foto miniatura (`image_url` com fallback elegante).
    - Nome do produto e descrição resumida.
    - Preço formatado em BRL (`Intl.NumberFormat`).
    - Badges das tags (`Vegano`, `Sem Glúten`, etc.).
    - **Toggle Switch de Disponibilidade:** Componente interativo que dispara requisição rápida via `router.patch` mantendo o scroll da página (`preserveScroll: true`).
    - Botões de ação rápida: Editar e Excluir.

### 4.2. Modais e Componentes Reutilizáveis

- `ProductFormModal.tsx`:
  - Formulário com campos: Nome, Categoria (select populado com categorias existentes), Preço, Imagem URL, Descrição e Tags (tags dinâmicas com input facilitado).
  - Tratamento de erros de validação retornados pelo AdonisJS (`errors.name`, `errors.price`).
- `CategoryFormModal.tsx`:
  - Formulário para Nome, Emoji e Ordem de exibição.
- `AvailabilitySwitch.tsx`:
  - Switch animado com feedback imediato de loading (desabilita durante o request para evitar duplo clique).

---

## 5. Critérios de Aceitação

1. **Controle de Acesso:** Usuário autenticado como `GARCOM` que tentar acessar `/admin/catalog` recebe HTTP 403.
2. **Toggle Instantâneo:** Ao clicar no switch de disponibilidade, o estado do produto no banco de dados é invertido e o componente reflete o novo status sem reload completo de tela.
3. **Criação com Sucesso:** Cadastro de um novo produto persiste no banco e é exibido na categoria correta imediatamente.
4. **Validações Amigáveis:** Tentativas de salvar produtos com preço inválido (<= 0) ou sem nome exibem alertas vermelhos específicos sob o campo.
5. **Responsividade:** O painel deve ser operável tanto em desktop quanto em tablets de gerência.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Rotas administrativas registradas com middleware RBAC (`ADMIN`, `GERENTE`).
- [ ] `CatalogAdminController` implementado consumindo o `CatalogService`.
- [ ] Página React `inertia/pages/admin/catalog/index.tsx` funcional e estilizada com Tailwind CSS.
- [ ] Testes funcionais HTTP cobrindo CRUD de produtos e rota de toggle (`tests/functional/admin/catalog_admin.spec.ts`).
- [ ] Tipos TypeScript estritos sem `any`.
