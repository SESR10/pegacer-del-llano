# Estado del proyecto (21 de noviembre de 2026)

| Parte | Estado |
|---|---|
| Base de datos (Fase 2) | 19 tablas con Flyway; datos DEMO probados en PostgreSQL 16. El stock de cada producto cuadra exacto con el kardex. |
| Backend base (Fase 1) | Spring Boot 3.3 + Java 21. |
| Backend de negocio (Fase 3) | Entidades JPA de las 19 tablas, repositorios, servicios y endpoints. Productos (crear, editar, eliminar), kardex con ajustes manuales, proveedores, consultas de fórmulas, cochadas, compras, despachos, desperdicios y alertas. Alertas de stock automáticas. |
| Login y roles (Fase 4) | Login con JWT, contraseñas con BCrypt, permisos por rol, administración de usuarios y auditoría de cada operación. Pantalla de login en el frontend. |
| Frontend (Fase 5) | React + Vite + TypeScript. Diseño profesional y responsive: en el celular hay barra inferior, menú deslizable, tablas convertidas en tarjetas y formularios en hoja inferior. |
| Pantallas conectadas (Fase 6) | Todas las pantallas leen los datos reales del servidor (inventario, kardex, fórmulas, cochadas, compras, despachos, desperdicios, proveedores, alertas). Las alertas se pueden marcar como atendidas. |
| Registro de cochadas (Fase 10) | Formulario y endpoint `POST /api/batches`: descuenta la materia prima, suma las bolsas al producto terminado, calcula la variación frente a la fórmula y crea alertas de consumo fuera de rango y de producción baja. Código consecutivo por año (C-2026-0001). Si un material no alcanza, no se guarda nada. |
| Pruebas | 50 pruebas de backend y 27 en el navegador (ver `docs/PRUEBAS.md`); todas pasan y corren solas en GitHub en cada PR (`mvn test` y `npm run test:e2e`). |
| Productos (Fase 7) | Crear, editar y eliminar productos desde la pantalla Productos (roles Administrador e Inventario). Al crear se puede dar un stock inicial, que queda en el kardex. Un producto con historial se desactiva en lugar de borrarse. |
| Inventario (Fase 8) | Ajustes de inventario (sumar o restar) con motivo obligatorio y vista previa del stock que quedará. Quedan en el kardex y en la auditoría. |
| Fórmulas (Fase 9) | Crear y editar fórmulas desde la pantalla Fórmulas (Administrador y Producción). Cada cambio se guarda como **versión nueva** y la anterior queda en el historial: las cochadas ya registradas conservan su receta. Se puede volver a una versión anterior. La tolerancia de consumo se cambia en la misma pantalla. |
| Producción (Fase 11) | La pantalla Producción calcula **cuántas cochadas completas se pueden fabricar** con el inventario actual por cada fórmula activa, cuál material limita y cuántas bolsas saldrían (`GET /api/production/capacity`). |
| Despachos y desperdicios (Fase 11) | Registrar despachos de producto terminado (uno o varios productos, código D-2026-0001) y desperdicios con motivo (opcional: cochada asociada). Ambos descuentan del inventario, quedan en el kardex y en la auditoría. Roles: Administrador, Inventario y Producción. |
| Compras y proveedores (Fase 12) | Registrar compras con uno o varios productos, factura y costo (`POST /api/purchases`, código OC-2026-0001). Cada producto entra al inventario (`ENTRADA_COMPRA`, kardex y auditoría) y, si se escribe el costo, actualiza el costo del producto. No se acepta la misma factura dos veces del mismo proveedor ni comprar producto terminado. Proveedores: crear, editar y desactivar; desde cada proveedor se puede registrar una compra. Roles: Administrador y Compras. |
| Alertas (Fase 13) | Activas e historial de **atendidas** (quién y cuándo; las de stock se cierran solas al reponer). Filtros por gravedad y tipo, y **atender varias a la vez** (`POST /api/alerts/resolve`). Tarjeta "¿Para cuántos días alcanza?" con los días de inventario de cada materia prima al ritmo de consumo de los últimos 30 días. Migración V3: `alerts.resolved_at` y `resolved_by`. |
| Reportes (Fase 14) | Pantalla Reportes con periodo (últimos 30 días, este mes, mes anterior u otro) y cinco reportes: **producción** (por día, semana o mes, por producto y cochadas), **consumo** (teórico contra real por material), **costos** (por cochada, por bolsa y de materias primas, con "otros costos por cochada" configurable; si falta el costo de un material se avisa y no se inventa), **inventario** (saldo inicial, entradas y salidas por tipo, saldo final y valor; `GET /api/reports/inventory`) y **rendimiento** (bolsas esperadas contra obtenidas y desperdicio). Se exportan a **Excel (.xlsx)**, **CSV** (punto y coma, para Excel en español) y **PDF** (impresión con encabezado de la empresa). Migración V4: parámetro `costo.otros_por_cochada`. |
| Usuarios y configuración (Fase 15) | Pantalla **Usuarios** (solo Administrador): crear, editar rol y datos, activar o desactivar y asignar contraseña nueva; tabla de qué puede hacer cada rol. Pantalla **Configuración**: parámetros (nombre de la empresa, tolerancia de consumo, otros costos por cochada), cambio de la contraseña propia (todos los usuarios) y registro de **auditoría** (Administrador). Ya no quedan módulos "en construcción". |
| Pruebas finales (Fase 16) | Pruebas de punta a punta en el navegador con Playwright (`frontend/e2e`) sobre la demostración: productos, compras, despachos, ajustes, fórmulas, cochadas, inventario insuficiente, alertas, reportes y que ninguna pantalla se desborde en el celular. Flujo de GitHub Actions `Pruebas` que corre backend y frontend en cada PR. Plan y cobertura en `docs/PRUEBAS.md`. |

## Permisos por rol

Todos los usuarios con sesión pueden **consultar** todo. Para **modificar**:

| Rol | Puede |
|---|---|
| Administrador | Todo, incluidos usuarios y auditoría |
| Producción | Cochadas, fórmulas, despachos y desperdicios, atender alertas |
| Inventario | Productos, ajustes de inventario, despachos y desperdicios, atender alertas |
| Compras | Proveedores y compras, atender alertas |
| Gerencia | Solo consulta y reportes |

## Decisiones de esta etapa

- **Eliminar un producto** con historial en el kardex lo **desactiva** (no lo borra) para no perder la trazabilidad.
- **El stock nunca se edita a mano**: solo cambia con movimientos. Desde Inventario solo se registran ajustes
  (`AJUSTE_POS`/`AJUSTE_NEG`) con motivo obligatorio; compras, cochadas, despachos y desperdicios tendrán su propio formulario.
- **Las fórmulas no se sobrescriben**: editar crea la versión siguiente (`POST /api/formulas`) y desactiva la anterior; `PATCH /api/formulas/{id}/activate` vuelve a una versión anterior.
- Los endpoints de fórmulas se llaman `/api/formulas` (el prompt maestro los nombra `/api/recipes` como ejemplo).
- Las pruebas reinician la base `pegacer_test` en cada corrida (no tocan la base `pegacer`).

## Siguiente paso

Las 16 fases del plan están hechas. Antes de usarlo con datos reales: perfil de producción, usuarios reales (cambiar las contraseñas DEMO) y copias de seguridad de PostgreSQL.
Antes de usarlo con datos reales: perfil de producción, usuarios reales y copias de seguridad de PostgreSQL.
