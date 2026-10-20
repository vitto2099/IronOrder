# Tasks: Order engine

> feature: order-engine

## T-008 — Modelos, Migrações e Máquina de Estados de Pedidos [pendente]

- Refs: US-005, US-006, AC-010, AC-011, AC-012, AC-014, AC-015
- Arquivos: app/modules/order_engine/models/order.ts, app/modules/order_engine/models/order_item.ts, app/modules/order_engine/state_machine/order_state_machine.ts, database/migrations/03_create_orders_and_order_items.ts
- Notas: Implementar enums dos status do pedido (`ENVIADO`, `EM_PREPARO`, `PRONTO`, `ENTREGUE`, `CANCELADO`) e validações de transição de estado.

## T-009 — Serviço OrderEngineService [pendente]

- Refs: US-005, US-006, US-007, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016
- Arquivos: app/modules/order_engine/services/order_engine_service.ts
- Notas: Implementar `submitBatchOrder` (com transação atômica), `transitionOrderStatus`, `cancelOrder` e `calculateTabSplit`.

## T-010 — Controllers HTTP Inertia e Views Operacionais [pendente]

- Refs: US-005, US-006, US-007, AC-010, AC-011, AC-013, AC-016, AC-017, AC-018
- Arquivos: app/http/controllers/client/order_controller.ts, app/http/controllers/staff/kds_controller.ts, start/routes.ts
- Notas: Endpoints de envio de pedido pelo cliente, recarga do KDS pela cozinha, lançamento de pedidos pelo garçom e página de impressão A4 de QR Codes.
