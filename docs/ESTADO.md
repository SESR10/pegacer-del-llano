# Estado del proyecto (20 de noviembre de 2026)

| Parte | Estado |
|---|---|
| Base de datos (Fase 2) | 19 tablas con Flyway; datos DEMO probados en PostgreSQL 16. El stock de cada producto cuadra exacto con el kardex. |
| Backend base (Fase 1) | Spring Boot 3.3 + Java 21. |
| Backend de negocio (Fase 3) | Entidades JPA de las 19 tablas, repositorios, servicios y endpoints. Productos (crear, editar, eliminar), kardex con ajustes manuales, proveedores, consultas de fórmulas, cochadas, compras, despachos, desperdicios y alertas. Alertas de stock automáticas. |
| Login y roles (Fase 4) | Login con JWT, contraseñas con BCrypt, permisos por rol, administración de usuarios y auditoría de cada operación. Pantalla de login en el frontend. |
| Frontend (Fase 5) | React + Vite + TypeScript. Diseño industrial responsive y 12 pantallas con datos DEMO. |
| Pruebas | 33 pruebas automáticas (`mvn test`), todas pasan. |
| Formularios de negocio (Fases 6–13) | Pendiente. Las pantallas todavía leen la foto de datos DEMO; el API ya está listo para conectarlas. |

## Permisos por rol

Todos los usuarios con sesión pueden **consultar** todo. Para **modificar**:

| Rol | Puede |
|---|---|
| Administrador | Todo, incluidos usuarios y auditoría |
| Producción | Cochadas y fórmulas (Fases 9–10), atender alertas |
| Inventario | Productos, ajustes de inventario, desperdicios, atender alertas |
| Compras | Proveedores y compras, atender alertas |
| Gerencia | Solo consulta y reportes |

## Decisiones de esta etapa

- **Eliminar un producto** con historial en el kardex lo **desactiva** (no lo borra) para no perder la trazabilidad.
- **El stock nunca se edita a mano**: solo cambia con movimientos. Desde Inventario solo se registran ajustes
  (`AJUSTE_POS`/`AJUSTE_NEG`) con motivo obligatorio; compras, cochadas, despachos y desperdicios tendrán su propio formulario.
- Los endpoints de fórmulas se llaman `/api/formulas` (el prompt maestro los nombra `/api/recipes` como ejemplo).
- Las pruebas reinician la base `pegacer_test` en cada corrida (no tocan la base `pegacer`).

## Siguiente paso

Fases 6–10: conectar el Dashboard y las pantallas al API real, y construir los formularios de productos, inventario,
fórmulas y **registro de cochadas** (descuenta materia prima, suma producto terminado y genera alertas de consumo y
producción fuera de rango).
