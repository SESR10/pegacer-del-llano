# Modelo de datos

19 tablas (migración `V1__esquema_inicial.sql`):

- **Seguridad:** `roles`, `users`, `audit_log`
- **Catálogos:** `units`, `product_categories`, `products`, `suppliers`, `settings`
- **Fórmulas:** `formulas`, `formula_items`
- **Producción:** `batches` (cochadas), `batch_consumptions`
- **Kardex:** `inventory_movements`
- **Compras:** `purchases`, `purchase_items`
- **Salidas:** `dispatches`, `dispatch_items`
- **Otros:** `waste`, `alerts`

## Reglas que garantiza la base de datos

- `products.stock >= 0`: el stock nunca queda negativo.
- Todas las cantidades de fórmulas, compras, consumos y despachos deben ser mayores que cero.
- Cada movimiento del kardex guarda `stock_before` y `stock_after`, y un CHECK verifica que cuadren con el tipo de movimiento.
- `batch_consumptions.variation_qty` y `variation_pct` (real vs teórico) los calcula PostgreSQL (columnas generadas).

## Decisiones

- **Producto terminado** no es tabla aparte: es una categoría de `products` y se consulta con la vista `v_finished_goods`. Así no se duplica el stock.
- **Producción** sale de `batches` (vista `v_batch_summary`), no de una tabla propia.
- **Flyway** versiona el esquema. Los datos DEMO van en `db/demo` y solo se cargan con el perfil `demo`.
- La **tolerancia de consumo** (5 %) y las fórmulas son configurables, no están en el código.
