# Cumplimiento legal (Colombia) y seguridad

Qué hace el sistema para cumplir la ley de protección de datos y protegerse de ataques, y qué
**debe hacer la empresa** (eso no lo resuelve el código).

> Esto es una guía técnica, no asesoría jurídica. La política de datos es un texto base: debe revisarla
> un abogado antes de usar el sistema con datos reales.

## 1. Lo que ya hace el sistema

### Protección de datos (Ley 1581 de 2012, Decreto 1377 de 2013)

| Exigencia | Cómo se cumple |
|---|---|
| Política de Tratamiento de Datos publicada (Decreto 1377, art. 13) | Pantalla **Privacidad y datos** dentro del sistema y enlace público desde el inicio de sesión (`/#/privacidad`). Texto en `frontend/src/legal/PoliticaTexto.tsx`. |
| Autorización previa, expresa e informada del titular (Ley 1581, art. 9) | La primera vez que cada usuario entra debe marcar la casilla y aceptar. Sin aceptar no puede usar el sistema. |
| Conservar prueba de la autorización (Decreto 1377, art. 8) | Se guarda fecha y versión aceptada en `users.privacy_accepted_at` / `privacy_version`, y queda en la auditoría como *"Aceptó la política de datos"* con la IP. |
| Cambios a la política | Al cambiar la versión (ver §3), todos deben aceptarla de nuevo al entrar. |
| Seguridad de los datos (Ley 1581, art. 4 lit. g) | Ver la sección siguiente. |
| No datos sensibles ni de menores | El sistema no los pide. No agregar campos de ese tipo sin revisar la política. |

### Cookies

El sistema **no usa cookies** (ni de publicidad, ni analítica, ni de terceros). Solo guarda la sesión en el
almacenamiento local del navegador, lo cual es estrictamente necesario, así que **no se necesita banner de
cookies**. Las fuentes tipográficas se sirven desde el propio sistema (antes se cargaban de Google, lo que
enviaba la IP de cada usuario a un tercero).

Si algún día se agrega Google Analytics, un chat externo o publicidad, sí habría que poner un aviso de
cookies con opción de rechazarlas y actualizar la política.

### Seguridad (OWASP)

| Riesgo | Protección |
|---|---|
| Adivinar contraseñas | Tras **5 intentos fallidos** el usuario queda bloqueado **15 minutos**; tras 20 fallos desde una misma IP, esa IP también. Configurable: `LOGIN_MAX_POR_USUARIO`, `LOGIN_MAX_POR_IP`, `LOGIN_BLOQUEO_MINUTOS`. |
| Robo de contraseñas guardadas | Solo se guarda el hash BCrypt. Mínimo 8 caracteres (10 para el primer administrador). |
| Saber qué usuarios existen | Mismo mensaje y mismo tiempo de respuesta si el usuario no existe o la clave es mala. |
| Inyección de código (XSS) | React escapa todo el texto; además la cabecera **Content-Security-Policy** solo permite scripts del propio sistema. |
| Meter el sistema en otra página (clickjacking) | `X-Frame-Options: DENY` y `frame-ancestors 'none'`. |
| Conexión sin cifrar | Railway sirve HTTPS; `Strict-Transport-Security` obliga al navegador a usar siempre HTTPS. |
| Inyección SQL | Todas las consultas usan JPA/parámetros, nunca texto armado a mano. |
| Acceso sin permiso | Cada operación revisa el rol en el servidor (`@PreAuthorize`), no solo en la pantalla. |
| Filtrar detalles técnicos | Los errores no muestran trazas ni mensajes internos. Swagger apagado en producción. |
| Otras | `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy` (sin cámara, micrófono ni ubicación). |

Las pruebas automáticas comprueban el bloqueo por intentos, las cabeceras y la autorización de datos
(`ApiIntegrationTests`).

## 2. Lo que debe hacer la empresa

### Antes de usar el sistema con datos reales

1. **Llenar los datos del responsable** en `frontend/src/legal/empresa.ts`: razón social, NIT, domicilio,
   dirección, correo y teléfono para peticiones de datos, y el área o persona que las atiende.
2. **Revisión por un abogado** del texto de la política (`frontend/src/legal/PoliticaTexto.tsx`).
3. **Confirmar la región del servidor en Railway** (Settings del servicio → Region) y ajustar `paisServidor`.
   Guardar datos en el exterior es una *transmisión internacional* (Ley 1581, art. 26): ya se menciona en la
   política. Revisar y aceptar el acuerdo de tratamiento de datos (DPA) de Railway y guardarlo.
4. **Autorización en los contratos de trabajo**: es buena práctica incluir una cláusula de tratamiento de
   datos en el contrato de cada trabajador, además de la aceptación en el sistema.

### Obligaciones de la empresa como responsable

- **Atender consultas y reclamos** de los titulares por el correo publicado: consultas en máximo 10 días
  hábiles (+5), reclamos en 15 días hábiles (+8).
- **Registro Nacional de Bases de Datos (RNBD) de la SIC**: obligatorio solo para sociedades con **activos
  totales de más de 100.000 UVT** (Decreto 090 de 2018). Si aplica, inscribir las bases "Usuarios del sistema"
  y "Proveedores" y actualizarlas cada año.
- **Incidentes de seguridad**: si hay una filtración de datos personales, reportarla a la SIC (a través del
  RNBD, o por los canales de la SIC si no está obligada a inscribirse) dentro de los **15 días hábiles**
  siguientes a detectarla, y avisar a los afectados.
- **Conservación**: libros y papeles del comerciante, 10 años (Código de Comercio art. 60; Ley 962 de 2005
  art. 28). Por eso los usuarios retirados se **desactivan**, no se borran.

### Buenas prácticas de operación

- Una cuenta por persona; nunca compartir usuarios. Desactivar la cuenta el mismo día que alguien se retira.
- Contraseñas largas (frases de 12+ caracteres) y distintas a las de otros servicios.
- Activar la **verificación en dos pasos** en las cuentas de Railway y GitHub, que son las llaves de todo.
- `JWT_SECRET` largo y aleatorio; si se sospecha que se filtró, cambiarlo (cierra la sesión de todos).
- Revisar de vez en cuando la auditoría en **Configuración** (inicios de sesión y cambios).
- Copias de seguridad diarias y probar una restauración (ver `docs/PRODUCCION.md`).
- Mantener las dependencias al día (el flujo de pruebas de GitHub corre en cada cambio).

## 3. Cambiar la política

1. Editar el texto en `frontend/src/legal/PoliticaTexto.tsx` (y los datos en `empresa.ts`).
2. Cambiar la versión a la fecha del cambio en **dos lugares**, con el mismo valor:
   - `POLITICA_VERSION` en `frontend/src/legal/empresa.ts`;
   - `app.privacidad.version` en `backend/src/main/resources/application.yml`
     (o la variable `PRIVACIDAD_VERSION` en Railway).
3. Al desplegar, cada usuario verá la nueva política al entrar y deberá aceptarla.

## 4. Pendiente (no incluido)

- **Verificación en dos pasos** para los usuarios del sistema: recomendable cuando haya acceso desde fuera
  de la planta.
- **Cerrar sesión en el servidor**: hoy el token vence a las 8 horas; cerrar sesión lo borra del navegador,
  pero el token sigue siendo válido hasta que vence. Para cortar todas las sesiones de inmediato, cambiar `JWT_SECRET`.
- **Facturación electrónica (DIAN)**: el sistema no factura; si se quiere, sería otro módulo con un
  proveedor tecnológico autorizado.
