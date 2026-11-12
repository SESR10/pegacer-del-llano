# Estado del proyecto (12 de noviembre de 2026)

| Parte | Estado |
|---|---|
| Base de datos (Fase 2) | 19 tablas con Flyway; datos DEMO probados en PostgreSQL 16. El stock de cada producto cuadra exacto con el kardex. |
| Backend (Fase 1) | Spring Boot 3.3 + Java 21. Compila y pasan las 8 pruebas automáticas (`mvn test`). |
| Frontend (Fase 5) | React + Vite + TypeScript. Diseño industrial responsive y 12 pantallas con datos DEMO. |
| Login y roles (Fase 4) | Pendiente. |
| Endpoints de negocio y formularios (Fases 3, 6–13) | Pendiente. Las pantallas ya existen y leen datos DEMO. |

## Nota sobre la reconstrucción

El código original de las Fases 1 y 2 venía en un zip del chat anterior que no se pudo recuperar.
Se reconstruyó desde el prompt maestro (`docs/prompt-maestro.md`) y el README, y esta vez el backend
sí se compiló y probó.

## Siguiente paso

Fases 3 y 4: entidades JPA, servicios, login con JWT y roles. Después, registrar cochadas desde la
aplicación (descuenta materia prima, suma producto terminado y genera alertas).
