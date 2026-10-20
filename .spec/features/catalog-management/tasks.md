# Tasks: Catalog management

> feature: catalog-management

## T-005 — Modelos e Migrações de Categorias e Produtos [pendente]

- Refs: US-003, US-004, AC-006, AC-007, AC-009
- Arquivos: app/modules/catalog/models/category.ts, app/modules/catalog/models/product.ts, app/modules/catalog/validators/product_validator.ts, database/migrations/02_create_categories_and_products.ts
- Notas: Incluir suporte a soft delete (campo `deleted_at`) e flag booleana de disponibilidade.

## T-006 — Serviço CatalogService [pendente]

- Refs: US-003, US-004, AC-006, AC-007, AC-008, AC-009
- Arquivos: app/modules/catalog/services/catalog_service.ts
- Notas: Implementar `getCatalogTree`, `updateProductAvailability`, `upsertProduct` e `softDeleteProduct`.

## T-007 — Controller Admin do Catálogo e Uploads [pendente]

- Refs: US-003, US-004, AC-006, AC-007, AC-009
- Arquivos: app/http/controllers/admin/catalog_admin_controller.ts, start/routes.ts
- Notas: Endpoints CRUD para categorias e produtos com suporte a upload de imagem via Drive e alteração rápida de disponibilidade.
