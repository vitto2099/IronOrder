# Tasks: Staff auth

> feature: staff-auth

## T-011 — Modelo e Migração da Tabela de Usuários (Users/Staff) [pendente]

- Refs: US-008, AC-019, AC-020
- Arquivos: app/models/user.ts, database/migrations/04_create_users_table.ts
- Notas: Definir enum para a coluna `role` contendo `ADMIN`, `GERENTE`, `GARCOM`, `CAIXA` e `COZINHA`, além do índice único no campo `email`.

## T-012 — Middleware de Proteção por Papéis RoleGuardMiddleware [pendente]

- Refs: US-009, AC-021
- Arquivos: app/http/middleware/role_guard_middleware.ts
- Notas: Interceptar a requisição, validar o perfil do usuário logado contra a lista de papéis autorizados e retornar HTTP 403 em caso de falha.

## T-013 — Controllers de Autenticação e Gestão de Funcionários [pendente]

- Refs: US-008, US-009, AC-019, AC-020, AC-021
- Arquivos: app/http/controllers/auth_controller.ts, app/http/controllers/admin/users_admin_controller.ts, start/routes.ts
- Notas: Formulários e endpoints para login do staff, logout e CRUD de novos colaboradores pelo administrador.
