# TASK-11: Gestão Administrativa de Mesas, Impressão A4 de QR Codes e Cadastro de Staff

- **ID:** `TASK-11`
- **Feature:** `FEATURE-08: Gestão Administrativa de Mesas, QR Codes e Staff`
- **Responsável Sugerido:** Dev-1
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-12 de Dashboard BI)
- **Dependências:** TASK-01, TASK-04

---

## 1. Objetivo e Contexto

Desenvolver o módulo administrativo para gestão da infraestrutura física do restaurante (mesas), a geração e **diagramação de etiquetas de QR Code prontas para impressão em padrão A4** (conforme **RN-06.3** e **ADR-001**), e o controle e cadastro de colaboradores da equipe com seus respectivos papéis de acesso (**RN-07.2, RN-07.3**).

---

## 2. Regras de Negócio e Referências

- **RN-06.3 (Impressão de QR Codes):** Página administrativa de impressão deve renderizar as etiquetas de mesa diagramadas para folhas A4, incluindo o número legível da mesa e o QR Code direcionando para a URL pública configurada do túnel Cloudflare.
- **RN-07.1 / RN-07.4:** Painel restrito exclusivamente ao perfil `ADMIN`.
- **RN-07.2 (Cadastro de Colaboradores):** Administrador cadastra colaboradores inserindo Nome, E-mail, Senha Inicial e Papel (`ADMIN`, `GERENTE`, `GARCOM`, `CAIXA`, `COZINHA`).
- **RN-07.3 (Unicidade de Identificação):** E-mail único no sistema com validação rígida.

---

## 3. Escopo Técnico Backend

### 3.1. Bibliotecas Auxiliares

- Utilizar biblioteca leve de geração de QR Code em SVG ou DataURI (ex: `qrcode` ou helper próprio) para renderização direta sem requisições a APIs externas.

### 3.2. Rotas HTTP (`start/routes.ts`)

```typescript
router
  .group(() => {
    // Gestão de Mesas
    router.get('/tables', [controllers.TablesAdmin, 'index']).as('admin.tables.index')
    router.post('/tables', [controllers.TablesAdmin, 'store']).as('admin.tables.store')
    router.delete('/tables/:id', [controllers.TablesAdmin, 'destroy']).as('admin.tables.destroy')
    router.get('/tables/print', [controllers.TablesAdmin, 'printLabels']).as('admin.tables.print')

    // Gestão de Staff (Colaboradores)
    router.get('/staff', [controllers.StaffAdmin, 'index']).as('admin.staff.index')
    router.post('/staff', [controllers.StaffAdmin, 'store']).as('admin.staff.store')
    router
      .patch('/staff/:id/status', [controllers.StaffAdmin, 'toggleStatus'])
      .as('admin.staff.status')
    router
      .patch('/staff/:id/reset-password', [controllers.StaffAdmin, 'resetPassword'])
      .as('admin.staff.password')
  })
  .prefix('/admin')
  .use([middleware.auth(), middleware.role(['ADMIN'])])
```

### 3.3. Controllers

- `app/controllers/admin/tables_admin_controller.ts`:
  - `index({ inertia })`: Lista todas as mesas com capacidade e status.
  - `store({ request, response })`: Valida número único da mesa e capacidade. Cria mesa.
  - `destroy({ params, response })`: Exclui mesa apenas se estiver no status `LIVRE` e sem pedidos pendentes.
  - `printLabels({ inertia })`: Gera os links de acesso público (ex: `${env.APP_URL}/m/${table.number}`) e gera os QR codes correspondentes em formato SVG/Data-URL para cada mesa cadastrada. Renderiza `admin/tables/print`.
- `app/controllers/admin/staff_admin_controller.ts`:
  - `index({ inertia })`: Lista usuários cadastrados com seus papéis e status.
  - `store({ request, response })`: Valida e cria colaborador criptografando a senha inicial.
  - `toggleStatus({ params, response })`: Ativa/inativa o usuário no sistema.
  - `resetPassword({ params, request, response })`: Altera a senha do operador.

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Página de Gestão de Mesas (`inertia/pages/admin/tables/index.tsx`)

- Tabela com número da mesa, capacidade em assentos, status atual e ações.
- Botão de destaque: **"🖨️ Imprimir Etiquetas A4 de QR Code"** (abre `/admin/tables/print` em nova aba).
- Modal para cadastro de novas mesas (única ou em lote, ex: Mesas 1 a 20).

### 4.2. Página Diagramada para Impressão A4 (`inertia/pages/admin/tables/print.tsx`)

- Layout especial sem cabeçalhos do sistema (`staff_layout` desativado).
- Regras CSS `@media print`:
  - Ocultar botões de navegação, definir margens de impressão de 10mm.
  - Grade de etiquetas 2x3 ou 3x4 (ajustada para padrão folha A4 com corte fácil).
- Design da Etiqueta:
  - Borda pontilhada para corte.
  - Logo elegante "Mesa+".
  - Número destacado da mesa (ex: **MESA 12**).
  - Imagem nítida do QR Code gerado.
  - Chamada amigável: _"Aponte a câmera do seu celular para ver o cardápio e pedir."_
  - URL textual de suporte logo abaixo.
- Botão fixo no topo: "Imprimir Folhas A4" acionando `window.print()`.

### 4.3. Página de Gestão de Staff (`inertia/pages/admin/staff/index.tsx`)

- Tabela de colaboradores com colunas: Nome, E-mail, Papel (com badges coloridas para `ADMIN`, `GARCOM`, `COZINHA`, etc.), Status e Data de Cadastro.
- Modal de Cadastro de Colaborador:
  - Campos: Nome Completo, E-mail, Senha Inicial, Papel (Select) e confirmação.
  - Validação inline de e-mail duplicado e senha mínima de 8 caracteres.

---

## 5. Critérios de Aceitação

1. **Diagramação A4 Perfeita:** Ao acionar `window.print()` na tela de etiquetas, o navegador renderiza exatamente as etiquetas centralizadas e alinhadas em folhas no formato A4, sem quebras indesejadas de página no meio de uma etiqueta.
2. **Leitura do QR Code:** O QR Code gerado aponta corretamente para a URL `/m/:number` configurada no ambiente.
3. **Unicidade de E-mail:** O cadastro de um usuário com e-mail já existente é bloqueado com mensagem clara.
4. **Proteção de Acesso:** Apenas usuários com perfil `ADMIN` conseguem visualizar e manipular essas telas.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Rotas administrativas de mesas e staff cadastradas sob middleware `role(['ADMIN'])`.
- [ ] Página de impressão A4 estilizada e testada via emulação de impressão no Chrome/Firefox.
- [ ] Geração de QR Code local (sem dependência de APIs externas de terceiros).
- [ ] CRUD de colaboradores com validação VineJS funcional.
- [ ] Testes funcionais das rotas em `tests/functional/admin/staff_admin.spec.ts`.
