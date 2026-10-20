# Tasks: Tab session

> feature: tab-session

## T-001 — Modelos e Migrações de Mesa, Comanda e Membro da Mesa [pendente]

- Refs: US-001, US-002, AC-001, AC-004, AC-005
- Arquivos: app/modules/tab_session/models/table.ts, app/modules/tab_session/models/tab.ts, app/modules/tab_session/models/tab_member.ts, database/migrations/01_create_tables_and_tabs.ts
- Notas: Implementar enums dos status da mesa (`LIVRE`, `OCUPADA`, `CONTA_PEDIDA`) e da comanda (`ABERTA`, `FECHADA`).

## T-002 — Serviço TabSessionService [pendente]

- Refs: US-001, US-002, AC-001, AC-002, AC-003, AC-004, AC-005
- Arquivos: app/modules/tab_session/services/tab_session_service.ts
- Notas: Encapsular lógica de transição de status da mesa, verificação/sufixo de unicidade de Alias e encerramento/arquivamento da comanda.

## T-003 — Middleware de Sessão do Cliente [pendente]

- Refs: US-001, AC-001, AC-003, AC-005
- Arquivos: app/http/middleware/client_session_middleware.ts
- Notas: Gerenciar a leitura e gravação do cookie HttpOnly criptografado contendo `member_id` e `tab_id`, invalidando-o se a comanda estiver encerrada.

## T-004 — Controllers de Sessão e Rotas Inertia [pendente]

- Refs: US-001, US-002, AC-001, AC-004, AC-005
- Arquivos: app/http/controllers/client/menu_controller.ts, app/http/controllers/staff/table_grid_controller.ts, start/routes.ts
- Notas: Prover endpoints HTTP para registro de Alias na mesa, solicitação de conta pelo cliente e liberação da mesa pelo garçom.
