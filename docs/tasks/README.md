# Roadmap de Desenvolvimento e Matriz de Paralelismo

Este documento apresenta a decomposição técnica da aplicação **QR-Order (AdonisJS v6 + InertiaJS React)** em features e tarefas atômicas para execução paralela pela equipe de engenharia.

---

## 👥 Estratégia de Alocação de Desenvolvedores

A arquitetura orientada a **Deep Modules** (ADR-002) permite que o núcleo de domínio do sistema seja desenvolvido de forma isolada e simultânea por 3 desenvolvedores fullstack, minimizando conflitos de merge e dependências bloqueantes:

```
                                  ┌────────────────────────┐
                                  │ Task 01: Fundação/RBAC │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
            │   Dev-1: Trilha A │   │   Dev-2: Trilha B │   │   Dev-3: Trilha C │
            │   CatalogModule   │   │  TabSessionModule │   │ OrderEngineModule │
            ├───────────────────┤   ├───────────────────┤   ├───────────────────┤
            │ Task 02: Backend  │   │ Task 04: Backend  │   │ Task 06: Backend  │
            │ Task 03: Admin UI │   │ Task 05: Zero-Auth│   │ Task 07: KDS UI   │
            └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
                      │                       │                       │
                      └───────────────────────┼───────────────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │ Integração e Operação   │
                                 ├─────────────────────────┤
                                 │ Task 08: Menu Cliente   │ (Dev-1)
                                 │ Task 09: Extrato Mesa   │ (Dev-2)
                                 │ Task 10: Painel Garçom  │ (Dev-3)
                                 │ Task 11: Admin QR/Staff │ (Dev-1)
                                 │ Task 12: Dashboard BI   │ (Dev-2)
                                 │ Task 13: Seed Inicial   │ (Dev-1)
                                 │ Task 14: Hubs & Redirect│ (Dev-3)
                                 │ Task 15: Comandas Indiv.│ (Dev-2)
                                 └─────────────────────────┘
```

---

## 📋 Resumo das Tarefas do Projeto

| ID          | Task                                                                                                    | Trilha / Feature      | Responsável Sugerido | Paralelizável?        | Dependências            |
| ----------- | ------------------------------------------------------------------------------------------------------- | --------------------- | -------------------- | --------------------- | ----------------------- |
| **TASK-01** | [Fundação, Infraestrutura, Tailwind CSS e RBAC de Staff](./task-01-fundacao-infra-e-rbac.md)            | Fundação & Infra      | Equipe / Dev-1       | ⚠️ Base inicial       | Nenhuma                 |
| **TASK-02** | [CatalogModule: Models, Migrations e CatalogService](./task-02-catalogo-models-e-servico.md)            | Trilha A: Catálogo    | **Dev-1**            | ✅ Sim (com 04 e 06)  | TASK-01                 |
| **TASK-03** | [Painel Admin de Categorias, Produtos e Disponibilidade](./task-03-catalogo-admin-painel.md)            | Trilha A: Catálogo    | **Dev-1**            | ✅ Sim (com 05 e 07)  | TASK-02                 |
| **TASK-04** | [TabSessionModule: Mesas, Comandas e TabSessionService](./task-04-mesas-e-comandas-servico.md)          | Trilha B: Sessão/Mesa | **Dev-2**            | ✅ Sim (com 02 e 06)  | TASK-01                 |
| **TASK-05** | [Zero-Auth via QR Code, Cookies e ClientSessionMiddleware](./task-05-zero-auth-e-sessao-cliente.md)     | Trilha B: Sessão/Mesa | **Dev-2**            | ✅ Sim (com 03 e 07)  | TASK-04                 |
| **TASK-06** | [OrderEngineModule: Models, Transação Atômica e Serviço](./task-06-pedidos-e-order-engine-servico.md)   | Trilha C: Pedidos     | **Dev-3**            | ✅ Sim (com 02 e 04)  | TASK-01                 |
| **TASK-07** | [Máquina de Estados de Pedidos e Display KDS da Cozinha](./task-07-kds-cozinha-e-maquina-estados.md)    | Trilha C: Pedidos     | **Dev-3**            | ✅ Sim (com 03 e 05)  | TASK-06                 |
| **TASK-08** | [Interface Mobile do Cliente: Cardápio, Carrinho e Pedido](./task-08-cardapio-mobile-e-carrinho.md)     | Experiência Cliente   | **Dev-1**            | ✅ Sim (com 09 e 10)  | TASK-02, 05, 06         |
| **TASK-09** | [Extrato Mobile da Mesa, Subtotais por Alias e Pedir Conta](./task-09-extrato-comanda-e-pedir-conta.md) | Experiência Cliente   | **Dev-2**            | ✅ Sim (com 08 e 10)  | TASK-04, 05, 06         |
| **TASK-10** | [Painel Garçom: Grid de Mesas, Lançamento e Baixa](./task-10-painel-garcom-e-grid-mesas.md)             | Operação Salão        | **Dev-3**            | ✅ Sim (com 08 e 09)  | TASK-04, 06, 07         |
| **TASK-11** | [Admin: Gestão de Mesas, Impressão A4 e Staff](./task-11-admin-mesas-qr-codes-e-staff.md)               | Administração         | **Dev-1**            | ✅ Sim (com 12)       | TASK-01, 04             |
| **TASK-12** | [Dashboard Analítico & Relatórios Financeiros (MVP)](./task-12-dashboard-analitico-e-metricas.md)       | Inteligência Negócio  | **Dev-2**            | ✅ Sim (com 11)       | TASK-04, 06             |
| **TASK-13** | [Seeder Inicial e Configuração do Sistema](./task-13-seeder-inicial-e-configuracao-do-sistema.md)       | Configuração & Seed   | **Dev-1**            | ✅ Sim (Independente) | TASK-01, 02, 04         |
| **TASK-14** | [Redirecionamento Pós-Login e Hubs por Papel](./task-14-redirecionamento-pos-login-e-hubs-por-papel.md) | Operações & Acesso    | **Dev-3**            | ✅ Sim (Independente) | TASK-01, 03, 07, 10, 11 |
| **TASK-15** | [Comandas Individuais e Liberação de Mesas](./task-15-comandas-individuais-e-bloqueio-liberacao.md)      | Sessão & Operações    | **Dev-2**            | ✅ Sim (Independente) | TASK-04, 05, 07, 09, 10 |

---

## 🎯 Proposta de Arranque Imediato

Após o alinhamento da **TASK-01** (Fundação):

1. **Dev-1** inicia a **TASK-02** (`CatalogModule`: Models, Migrations e CatalogService).
2. **Dev-2** inicia a **TASK-04** (`TabSessionModule`: Mesas, Comandas, Membros e TabSessionService).
3. **Dev-3** inicia a **TASK-06** (`OrderEngineModule`: Pedidos, Itens, Transação Atômica e Congelamento de Preço).

Dessa forma, cada programador opera dentro do seu próprio submódulo em `app/modules/*` e suas próprias tabelas de banco, com **zero conflito de código**.
