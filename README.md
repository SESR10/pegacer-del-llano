# PEGACER DEL LLANO — Sistema Integral de Control de Producción e Inventario

Aplicación web para controlar materias primas, cochadas, producción, producto terminado, compras, desperdicios, alertas y reportes de la fábrica.

> **Estado actual: Fases 1, 2 y 5 terminadas** (estructura, base de datos con datos DEMO y frontend base).
> El frontend ya muestra en modo demostración el Dashboard, Cochadas, Producción, Fórmulas, Inventario con kardex,
> Producto terminado, Compras, Proveedores, Desperdicios y Alertas. Las pantallas leen una foto de los datos DEMO
> mientras se construyen los endpoints de negocio (Fases 3–14).

## Tecnología

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript, CSS propio (sin framework), React Router, React Icons |
| Backend | Java 21, Spring Boot 3.3 (Web, Data JPA, Security, Validation), JWT (jjwt) |
| Base de datos | PostgreSQL 16 + migraciones Flyway |
| Documentación API | Swagger / OpenAPI (springdoc) |

Cambio respecto al documento maestro: **se agregó Flyway** para versionar el esquema (más seguro que `ddl-auto=update` en producción). En el frontend se usa `fetch` en lugar de axios: una dependencia menos y el mismo resultado.

## Requisitos

- Java 21 y Maven 3.9+
- Node.js 20+ y npm
- PostgreSQL 14+ (o Docker para levantarlo con un comando)

## Instalación y ejecución

### 1. Base de datos

Con Docker:

```bash
docker compose up -d
```

Sin Docker, en `psql` como administrador:

```sql
CREATE ROLE pegacer LOGIN PASSWORD 'pegacer';
CREATE DATABASE pegacer OWNER pegacer;
CREATE DATABASE pegacer_test OWNER pegacer;
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Al arrancar, Flyway crea las tablas y (perfil `demo`, activo por defecto) carga los datos de demostración.

- API: http://localhost:8080
- Salud: http://localhost:8080/api/health
- Swagger: http://localhost:8080/swagger-ui.html

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173 (las llamadas a `/api` se redirigen al backend).

Versión de demostración, sin backend (para mostrar al cliente):

```bash
cd frontend
npm run build:demo   # genera frontend/dist/
```

Para refrescar la foto de datos DEMO que usa el frontend:

```bash
psql -d pegacer -qAt -f database/scripts/exportar-demo-json.sql > frontend/src/demo/demo-data.json
```

## Variables de entorno (backend)

| Variable | Por defecto | Descripción |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/pegacer` | Conexión a PostgreSQL |
| `DB_USER` / `DB_PASSWORD` | `pegacer` / `pegacer` | Credenciales |
| `SPRING_PROFILES_ACTIVE` | `demo` | `demo` carga datos de demostración; usar `prod` en producción |
| `JWT_SECRET` | (valor de desarrollo) | **Cambiar en producción** (mínimo 32 caracteres) |
| `JWT_EXPIRATION_MINUTES` | `480` | Duración de la sesión |
| `CORS_ORIGINS` | `http://localhost:5173` | Orígenes permitidos del frontend (separados por coma) |
| `PORT` | `8080` | Puerto del backend |

Frontend: `VITE_API_URL` (vacío en desarrollo) y `VITE_DEMO_ONLY=true` para la compilación de demostración.

## Usuarios demo

Contraseña de todos: **`Demo2026*`** (el login se habilita en la Fase 4).

| Usuario | Rol |
|---|---|
| `admin` | Administrador |
| `produccion` | Producción |
| `inventario` | Inventario |
| `compras` | Compras |
| `gerencia` | Gerencia |

## Datos DEMO

Todo lo cargado por el perfil `demo` está marcado con `is_demo = TRUE` y los proveedores llevan "DEMO" en el nombre y NIT. Incluye:
6 productos, la fórmula de referencia informada por la empresa (3 bultos de cemento, 0,51 m³ de arena, 1,8 kg de químico, 45–47 bolsas de 25 kg), ~35 cochadas de los últimos 30 días, compras, despachos, desperdicios y alertas reales derivadas de los datos (cemento en stock crítico, pegante premium agotado, consumos fuera de rango y producción baja).
**No se cargan costos** ni fórmula para el pegante premium: la empresa debe ingresarlos.

## Arquitectura

```
backend/   controller · service · repository · entity · dto · config · security · exception
frontend/  components · pages · layouts · services · hooks · utils · assets · styles
database/  scripts de apoyo (la fuente del esquema son las migraciones Flyway)
docs/      modelo de datos y decisiones
```

Respuesta estándar del API:

```json
{ "success": false, "message": "No hay suficiente cemento para registrar la cochada." }
```

## Endpoints disponibles

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | Público — estado del sistema y la base de datos |
| GET | `/swagger-ui.html` | Público — documentación |

Los endpoints de negocio (`/api/products`, `/api/batches`, …) se agregan en las fases 3–14.

## Pruebas

Requieren PostgreSQL con la base `pegacer_test`:

```bash
cd backend
mvn test
```

Cubren: endpoint de salud, protección de endpoints con mensaje claro, Swagger, datos base, coherencia de los datos demo (el stock de cada producto es exactamente la suma de sus movimientos), cálculo de variación, y rechazo de stock negativo y fórmulas con cantidad cero.

## Plan de desarrollo

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Configurar proyecto | ✅ |
| 2 | Base de datos | ✅ |
| 3 | Backend (entidades, repositorios, servicios) | ⏳ |
| 4 | Autenticación JWT y roles | ⏳ |
| 5 | Frontend base | ✅ |
| 6–13 | Dashboard, Productos, Inventario, Fórmulas, Cochadas, Producción, Compras, Alertas | 🟡 pantallas en modo demo; faltan API y formularios |
| 14 | Reportes | ⏳ |
| 15–16 | Responsive final y pruebas | ⏳ |
