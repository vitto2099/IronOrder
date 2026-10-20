# Tasks: Analytics dashboard

> feature: analytics-dashboard

## T-014 — Serviço de Agregação AnalyticsService [pendente]

- Refs: US-010, US-011, AC-022, AC-023, AC-024
- Arquivos: app/services/analytics_service.ts
- Notas: Implementar consultas SQL otimizadas para faturamento acumulado em comandas `FECHADA`, mix de vendas por item/categoria, ticket médio e agrupamento por faixas horárias.

## T-015 — Controller do Dashboard Analítico e Rotas [pendente]

- Refs: US-010, US-011, AC-022, AC-023, AC-024, AC-025
- Arquivos: app/http/controllers/admin/dashboard_controller.ts, start/routes.ts
- Notas: Renderizar a página Inertia do Dashboard com filtros de intervalo de datas (dia, semana, mês, custom) protegida pelo middleware de Admin.
