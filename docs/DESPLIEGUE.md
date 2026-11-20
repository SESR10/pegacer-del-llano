# Publicar el sistema

El `Dockerfile` de la raíz arma una sola imagen: el backend (Spring Boot) sirve también la pantalla (React).
Así la pantalla y el API quedan en la misma dirección y no hace falta configurar CORS ni `VITE_API_URL`.
Sirve igual en Railway, Render o un servidor propio con Docker.

## Qué se necesita

1. Un servicio que construya el `Dockerfile` desde GitHub (rama `main`).
2. Una base de datos PostgreSQL 14 o superior. Flyway crea las tablas al arrancar.

## Variables del servicio

| Variable | Valor |
|---|---|
| `DB_URL` | `jdbc:postgresql://<host>:<puerto>/<base>` (formato JDBC, no `postgres://`) |
| `DB_USER` / `DB_PASSWORD` | Usuario y contraseña de la base |
| `JWT_SECRET` | Texto aleatorio largo (mínimo 32 caracteres). Nunca el de desarrollo. |
| `SPRING_PROFILES_ACTIVE` | `demo` para la versión de prueba (carga datos y usuarios DEMO). |
| `PORT` | Lo pone el proveedor; el sistema lo respeta. |

`CORS_ORIGINS` no hace falta porque la pantalla se sirve desde el mismo servidor.

## Antes del uso real

- Con `SPRING_PROFILES_ACTIVE=prod` no se cargan datos ni usuarios DEMO: hay que crear el primer administrador.
- Activar copias de seguridad automáticas de la base de datos en el proveedor.
