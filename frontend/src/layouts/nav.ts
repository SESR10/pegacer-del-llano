import type { IconType } from 'react-icons';
import {
  LuLayoutDashboard, LuFactory, LuBarChart3, LuFlaskConical, LuWarehouse, LuPackageCheck, LuTrash2,
  LuPackage, LuMountain, LuShoppingCart, LuTruck, LuBell, LuFileBarChart, LuUsers, LuSettings, LuShieldCheck,
} from 'react-icons/lu';

/** roles: cargos que ven la opción en el menú. Sin roles, la ven todos. La página sigue abierta a todos por dirección. */
export interface NavItem { path: string; label: string; icon: IconType; roles?: string[]; }
export interface NavGroup { title: string; items: NavItem[]; }

const PROD = ['ADMIN', 'PRODUCCION'];
const BODEGA = ['ADMIN', 'INVENTARIO', 'PRODUCCION'];
const COMPRAS = ['ADMIN', 'COMPRAS'];

/**
 * Menú agrupado por lo que la persona va a hacer, no por módulo del sistema.
 * Cada cargo ve solo lo que usa en su trabajo; el Administrador ve todo.
 */
export const NAV: NavGroup[] = [
  { title: 'Día a día', items: [
    { path: '/', label: 'Inicio', icon: LuLayoutDashboard },
    { path: '/cochadas', label: 'Cochadas', icon: LuFactory, roles: [...PROD, 'GERENCIA'] },
    { path: '/inventario', label: 'Inventario', icon: LuWarehouse },
    { path: '/producto-terminado', label: 'Bodega y despachos', icon: LuPackageCheck, roles: [...BODEGA, 'GERENCIA'] },
    { path: '/desperdicios', label: 'Desperdicios', icon: LuTrash2, roles: BODEGA },
    { path: '/compras', label: 'Compras', icon: LuShoppingCart, roles: [...COMPRAS, 'INVENTARIO', 'GERENCIA'] },
  ] },
  { title: 'Consultar', items: [
    { path: '/alertas', label: 'Alertas', icon: LuBell },
    { path: '/produccion', label: 'Producción', icon: LuBarChart3, roles: [...PROD, 'GERENCIA'] },
    { path: '/reportes', label: 'Reportes', icon: LuFileBarChart, roles: ['ADMIN', 'GERENCIA', 'PRODUCCION', 'INVENTARIO', 'COMPRAS'] },
  ] },
  { title: 'Catálogos', items: [
    { path: '/formulas', label: 'Fórmulas', icon: LuFlaskConical, roles: [...PROD, 'GERENCIA'] },
    { path: '/productos', label: 'Productos', icon: LuPackage, roles: ['ADMIN', 'INVENTARIO'] },
    { path: '/materias-primas', label: 'Materias primas', icon: LuMountain, roles: ['ADMIN', 'INVENTARIO', 'COMPRAS'] },
    { path: '/proveedores', label: 'Proveedores', icon: LuTruck, roles: COMPRAS },
  ] },
  { title: 'Sistema', items: [
    { path: '/usuarios', label: 'Usuarios', icon: LuUsers, roles: ['ADMIN'] },
    { path: '/configuracion', label: 'Configuración', icon: LuSettings, roles: ['ADMIN'] },
    { path: '/privacidad', label: 'Privacidad y datos', icon: LuShieldCheck },
  ] },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);

/** ¿Ve este cargo la opción? Sin cargo (demostración) se ve todo. */
export const visibleTo = (item: NavItem, role: string | undefined) => !role || !item.roles || item.roles.includes(role);

/** Menú filtrado para el cargo: grupos vacíos desaparecen. */
export const navFor = (role: string | undefined): NavGroup[] =>
  NAV.map((g) => ({ ...g, items: g.items.filter((i) => visibleTo(i, role)) })).filter((g) => g.items.length);

/** Barra inferior del celular: los 4 accesos más usados por cada cargo. El resto queda en "Más". */
export const mobileTabs = (role: string | undefined): string[] => {
  switch (role) {
    case 'PRODUCCION': return ['/', '/cochadas', '/inventario', '/alertas'];
    case 'INVENTARIO': return ['/', '/inventario', '/producto-terminado', '/alertas'];
    case 'COMPRAS': return ['/', '/compras', '/inventario', '/alertas'];
    case 'GERENCIA': return ['/', '/reportes', '/inventario', '/alertas'];
    default: return ['/', '/cochadas', '/inventario', '/alertas'];
  }
};
