package co.pegacer.sistema.security;

/**
 * Permisos por rol (sección 22 del prompt maestro). Se usan en @PreAuthorize.
 * Todos los usuarios con sesión pueden consultar; solo estos roles pueden modificar.
 * <ul>
 *   <li>ADMIN: acceso completo, incluye usuarios y auditoría.</li>
 *   <li>PRODUCCION: cochadas y fórmulas.</li>
 *   <li>INVENTARIO: productos, movimientos de inventario y desperdicios.</li>
 *   <li>COMPRAS: proveedores y compras.</li>
 *   <li>GERENCIA: solo consulta y reportes.</li>
 * </ul>
 */
public final class Roles {
    public static final String ADMIN = "hasRole('ADMIN')";
    public static final String PRODUCTOS = "hasAnyRole('ADMIN','INVENTARIO')";
    public static final String INVENTARIO = "hasAnyRole('ADMIN','INVENTARIO')";
    public static final String PRODUCCION = "hasAnyRole('ADMIN','PRODUCCION')";
    public static final String COMPRAS = "hasAnyRole('ADMIN','COMPRAS')";
    /** Despachos de producto terminado: bodega (Inventario) o Producción. */
    public static final String DESPACHOS = "hasAnyRole('ADMIN','INVENTARIO','PRODUCCION')";
    /** Desperdicios: Inventario o Producción (se pierden en bodega o en la mezcla). */
    public static final String DESPERDICIOS = "hasAnyRole('ADMIN','INVENTARIO','PRODUCCION')";
    public static final String ALERTAS = "hasAnyRole('ADMIN','INVENTARIO','PRODUCCION','COMPRAS')";

    private Roles() { }
}
