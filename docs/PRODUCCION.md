# Pasar a producción (datos reales)

El sistema tiene dos perfiles:

| Perfil | Para qué | Base de datos |
|---|---|---|
| `demo` (por defecto) | Mostrar el sistema | Esquema + datos DEMO (usuarios `admin`, `produccion`… con clave `demo123`) |
| `prod` | Uso real | Solo el esquema: sin productos, sin movimientos, sin usuarios DEMO |

Con el perfil `prod` el sistema **no arranca** si:

- falta `JWT_SECRET` o es el de desarrollo (debe tener 32 caracteres o más);
- la base tiene usuarios DEMO o la migración DEMO (Flyway responde *"Detected applied migration not resolved locally: 2"*).
  Por eso producción necesita **una base nueva**;
- la base no tiene usuarios y faltan `ADMIN_USUARIO` / `ADMIN_CONTRASENA` (10 caracteres o más).

En `prod` tampoco se publica Swagger (`/swagger-ui.html`).

## Paso a paso en Railway

1. **Base nueva.** En el proyecto de Railway: *+ New → Database → PostgreSQL*. Railway le pone un nombre como `Postgres-AbCd`.
   La base DEMO actual se deja quieta hasta comprobar que todo funciona; después se puede borrar.
2. **Variables del servicio del sistema** (pestaña *Variables*). Al escribir `${{` Railway sugiere los nombres;
   use los de la base **nueva**:

   | Variable | Valor |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `DB_URL` | `jdbc:postgresql://${{Postgres-AbCd.PGHOST}}:${{Postgres-AbCd.PGPORT}}/${{Postgres-AbCd.PGDATABASE}}` |
   | `DB_USER` | `${{Postgres-AbCd.PGUSER}}` |
   | `DB_PASSWORD` | `${{Postgres-AbCd.PGPASSWORD}}` |
   | `JWT_SECRET` | Texto aleatorio largo (32 caracteres o más), por ejemplo el resultado de `openssl rand -base64 48` |
   | `ADMIN_USUARIO` | Usuario del primer administrador, por ejemplo `santiago` |
   | `ADMIN_CONTRASENA` | Su contraseña (10 caracteres o más) |
   | `ADMIN_NOMBRE` | Nombre completo que se muestra en la pantalla |

3. **Desplegar** (Railway despliega al guardar las variables). En *Deploy Logs* debe aparecer
   `Primer Administrador creado: <usuario>`. Si el sistema no arranca, el registro dice qué variable falta.
4. **Entrar** con ese usuario. En **Usuarios** crear a las demás personas con su rol, y en **Configuración**
   revisar el nombre de la empresa, la tolerancia de consumo y los otros costos por cochada.
5. **Borrar `ADMIN_CONTRASENA`** de las variables (ya no se usa; si se deja, el registro avisa).
6. Cargar los datos iniciales: productos con su stock inicial (pantalla Productos), proveedores y fórmulas.

## Copias de seguridad

En Railway, servicio de la base **nueva** → pestaña *Backups*:

1. Programar copias **diarias** y **semanales** (la opción depende del plan de Railway).
2. Hacer una copia manual apenas se carguen los datos iniciales.

### Restaurar

En la misma pestaña *Backups*, elegir la copia y *Restore*. Railway restaura el volumen de la base;
el sistema vuelve a conectarse solo. Conviene probarlo una vez (por ejemplo, antes de cargar datos reales)
para no descubrir problemas el día que haga falta.

### Copia manual fuera de Railway

Desde cualquier computador con PostgreSQL instalado, usando la `DATABASE_PUBLIC_URL` de la base:

```bash
pg_dump --format=custom --no-owner --no-privileges --dbname="<DATABASE_PUBLIC_URL>" --file=pegacer-AAAA-MM-DD.dump
# Restaurar en una base vacía:
pg_restore --no-owner --no-privileges --dbname="<URL de la base vacía>" pegacer-AAAA-MM-DD.dump
```

Ese archivo contiene todos los datos de la empresa (incluidos los usuarios con su contraseña cifrada): guárdelo en un lugar privado.
