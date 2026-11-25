/**
 * Datos del Responsable del Tratamiento (Ley 1581 de 2012, art. 17 y Decreto 1377 de 2013, art. 13).
 * DEBEN LLENARSE con los datos reales de la empresa antes de usar el sistema con datos reales,
 * y la política debe revisarla un abogado. Ver docs/LEGAL-Y-SEGURIDAD.md.
 */
export const EMPRESA = {
  razonSocial: 'PEGACER DEL LLANO [completar razón social: S.A.S., Ltda., etc.]',
  nit: '[NIT POR DEFINIR]',
  domicilio: '[Ciudad, departamento]',
  direccion: '[Dirección física]',
  correoDatos: '[correo para peticiones de datos personales]',
  telefono: '[Teléfono]',
  /** Área o persona que atiende consultas y reclamos (Decreto 1377, art. 13 num. 5). */
  areaResponsable: '[Área o cargo responsable, por ejemplo: Gerencia]',
  /** País donde está el servidor del proveedor de nube (Railway). Confirmar la región en Railway. */
  paisServidor: 'Estados Unidos de América',
};

/**
 * Versión vigente de la política. Debe ser IGUAL a app.privacidad.version del backend (application.yml).
 * Si se cambia el texto de la política, cambie ambas: todos los usuarios la aceptarán de nuevo al entrar.
 */
export const POLITICA_VERSION = '2026-11-25';
