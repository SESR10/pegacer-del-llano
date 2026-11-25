-- Ley 1581 de 2012 y Decreto 1377 de 2013: prueba de la autorización del titular para tratar sus datos.
-- Se guarda la fecha y la versión de la Política de Tratamiento de Datos que aceptó cada usuario.
-- Si la empresa cambia la política (app.privacidad.version), todos deben aceptarla de nuevo al entrar.
ALTER TABLE users
    ADD COLUMN privacy_accepted_at TIMESTAMPTZ,
    ADD COLUMN privacy_version     VARCHAR(20);
