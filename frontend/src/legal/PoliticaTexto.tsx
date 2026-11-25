import { EMPRESA as E, POLITICA_VERSION } from './empresa';

/**
 * Política de Tratamiento de Datos Personales, uso de cookies y términos de uso del sistema.
 * Marco: Constitución Política art. 15, Ley 1581 de 2012, Decreto 1377 de 2013 (compilado en el
 * Decreto 1074 de 2015), Ley 1273 de 2009 y Ley 527 de 1999. Texto base: debe revisarlo un abogado.
 */
export default function PoliticaTexto() {
  return (
    <article className="legal">
      <p className="legal-meta">Versión {POLITICA_VERSION} · Vigente desde el {fecha(POLITICA_VERSION)}</p>

      <h3>1. Responsable del tratamiento</h3>
      <dl className="legal-dl">
        <dt>Razón social</dt><dd>{E.razonSocial}</dd>
        <dt>NIT</dt><dd>{E.nit}</dd>
        <dt>Domicilio</dt><dd>{E.domicilio}</dd>
        <dt>Dirección</dt><dd>{E.direccion}</dd>
        <dt>Correo para datos personales</dt><dd>{E.correoDatos}</dd>
        <dt>Teléfono</dt><dd>{E.telefono}</dd>
      </dl>

      <h3>2. Alcance</h3>
      <p>
        Esta política aplica a los datos personales que se registran en el Sistema Integral de Producción de {E.razonSocial}{' '}
        (en adelante, "el sistema"), una herramienta de uso interno para controlar la producción, el inventario y las compras.
        Se expide en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas que los modifiquen o complementen.
      </p>

      <h3>3. Datos que se tratan</h3>
      <ul>
        <li><strong>Usuarios del sistema</strong> (trabajadores y colaboradores): nombre completo, usuario, correo electrónico, rol o cargo,
          contraseña (guardada solo cifrada, nadie puede leerla), y el registro de las acciones que hace en el sistema con su fecha y hora.
          Al aceptar esta política se guarda la fecha, la versión aceptada y la dirección IP como prueba de la autorización.</li>
        <li><strong>Proveedores</strong>: razón social o nombre, NIT o cédula, teléfono, correo y ciudad de contacto.</li>
      </ul>
      <p>El sistema <strong>no</strong> recoge datos sensibles (salud, origen racial, orientación política o religiosa, biométricos) ni datos de niñas, niños o adolescentes.</p>

      <h3>4. Finalidades</h3>
      <ul>
        <li>Identificar a cada usuario, darle acceso al sistema y asignarle permisos según su rol.</li>
        <li>Dejar trazabilidad (auditoría) de quién registra cochadas, compras, despachos, ajustes de inventario y demás operaciones.</li>
        <li>Gestionar las compras y la relación comercial con los proveedores.</li>
        <li>Proteger la seguridad del sistema y de la información de la empresa.</li>
        <li>Cumplir obligaciones legales, contables y tributarias, y atender requerimientos de autoridades competentes.</li>
      </ul>
      <p>Los datos no se venden ni se ceden a terceros para publicidad.</p>

      <h3>5. Derechos del titular</h3>
      <p>De acuerdo con el artículo 8 de la Ley 1581 de 2012, usted tiene derecho a:</p>
      <ul>
        <li>Conocer, actualizar y rectificar sus datos personales.</li>
        <li>Pedir prueba de la autorización que otorgó.</li>
        <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley, después de haber agotado el trámite ante la empresa.</li>
        <li>Revocar la autorización o pedir que se borren sus datos, cuando no exista un deber legal o contractual de conservarlos.</li>
        <li>Acceder gratuitamente a sus datos personales.</li>
      </ul>

      <h3>6. Cómo ejercer sus derechos</h3>
      <p>
        Escriba a <strong>{E.correoDatos}</strong> o entregue su solicitud por escrito en {E.direccion}, indicando su nombre, documento,
        lo que pide y un medio de respuesta. La atiende: <strong>{E.areaResponsable}</strong>.
      </p>
      <ul>
        <li><strong>Consultas</strong> (conocer sus datos): se responden en máximo 10 días hábiles, prorrogables por 5 días hábiles más avisándole el motivo (Ley 1581, art. 14).</li>
        <li><strong>Reclamos</strong> (corregir, actualizar, borrar o revocar): se responden en máximo 15 días hábiles, prorrogables por 8 días hábiles más (Ley 1581, art. 15).
          Si el reclamo está incompleto se le pedirá completarlo dentro de los 5 días siguientes; si pasan 2 meses sin respuesta, se entiende que desistió.</li>
      </ul>

      <h3>7. Dónde se guardan los datos y quién más los trata</h3>
      <p>
        El sistema funciona en servidores de un proveedor de nube (Railway Corporation) ubicados en {E.paisServidor}.
        Este proveedor actúa como <em>Encargado del Tratamiento</em>: guarda la información por cuenta de la empresa y no puede usarla para fines propios.
        Esto constituye una transmisión internacional de datos (Ley 1581, art. 26; Decreto 1377, arts. 24 y 25), amparada en el contrato y el acuerdo de tratamiento de datos con ese proveedor.
      </p>

      <h3>8. Seguridad de la información</h3>
      <ul>
        <li>Conexión cifrada (HTTPS) y contraseñas guardadas con cifrado de una sola vía (BCrypt).</li>
        <li>Permisos por rol: cada persona solo puede modificar lo que corresponde a su trabajo.</li>
        <li>Bloqueo temporal del acceso después de varios intentos fallidos de inicio de sesión.</li>
        <li>Registro de auditoría de las operaciones y copias de seguridad de la base de datos.</li>
      </ul>

      <h3>9. Cookies y almacenamiento en el navegador</h3>
      <p>
        El sistema <strong>no usa cookies</strong> de publicidad, de analítica ni de terceros, y no rastrea su navegación.
        Solo guarda en el almacenamiento local de su navegador la sesión iniciada (un código que vence a las 8 horas), que es
        estrictamente necesaria para que el sistema funcione. Se borra al cerrar sesión. Los tipos de letra se cargan desde el
        propio sistema, sin enviar información a otros sitios.
      </p>

      <h3>10. Conservación</h3>
      <p>
        Los datos se conservan mientras la persona sea usuaria del sistema o proveedora de la empresa, y después durante el tiempo que
        exijan las normas contables y comerciales (por regla general, 10 años para libros y papeles del comerciante). Un usuario
        retirado se desactiva en lugar de borrarse, para no perder la trazabilidad de las operaciones que registró.
      </p>

      <h3>11. Términos de uso del sistema</h3>
      <ul>
        <li>El sistema es solo para las labores de la empresa. Su usuario y contraseña son personales e intransferibles: no los comparta.</li>
        <li>Lo que registre queda a su nombre en la auditoría. Estos registros electrónicos tienen valor probatorio (Ley 527 de 1999).</li>
        <li>La información del sistema (fórmulas, costos, inventarios, proveedores) es confidencial y no puede sacarse ni divulgarse sin autorización.</li>
        <li>Entrar sin autorización, o usar el sistema para fines distintos, puede constituir delito informático (Ley 1273 de 2009).</li>
        <li>Si sospecha que alguien conoce su contraseña, cámbiela en Configuración y avise al administrador.</li>
      </ul>

      <h3>12. Cambios a esta política</h3>
      <p>
        Cualquier cambio importante se informará en el sistema y se pedirá aceptar la nueva versión al iniciar sesión.
        Esta versión rige desde la fecha indicada arriba.
      </p>
    </article>
  );
}

function fecha(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}
