# database/

La fuente del esquema son las migraciones Flyway en `backend/src/main/resources/db/`:

- `migration/V1__esquema_inicial.sql`: las 19 tablas, vistas y datos base (roles, unidades, categorías, configuración).
- `demo/V2__datos_demo.sql`: datos de demostración, solo con el perfil `demo`.

Para probarlas a mano sin el backend:

```bash
psql -d pegacer -f backend/src/main/resources/db/migration/V1__esquema_inicial.sql
psql -d pegacer -f backend/src/main/resources/db/demo/V2__datos_demo.sql
```
