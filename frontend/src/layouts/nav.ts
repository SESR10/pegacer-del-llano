import type { IconType } from 'react-icons';
import {
  LuLayoutDashboard, LuFactory, LuBarChart3, LuFlaskConical, LuWarehouse, LuPackageCheck, LuTrash2,
  LuPackage, LuMountain, LuShoppingCart, LuTruck, LuBell, LuFileBarChart, LuUsers, LuSettings,
} from 'react-icons/lu';

export interface NavItem { path: string; label: string; icon: IconType; phase?: number; }
export interface NavGroup { title: string; items: NavItem[]; }

export const NAV: NavGroup[] = [
  { title: 'Operación', items: [
    { path: '/', label: 'Inicio', icon: LuLayoutDashboard },
    { path: '/cochadas', label: 'Cochadas', icon: LuFactory },
    { path: '/produccion', label: 'Producción', icon: LuBarChart3 },
    { path: '/formulas', label: 'Fórmulas', icon: LuFlaskConical },
    { path: '/inventario', label: 'Inventario', icon: LuWarehouse },
    { path: '/producto-terminado', label: 'Producto terminado', icon: LuPackageCheck },
    { path: '/desperdicios', label: 'Desperdicios', icon: LuTrash2 },
  ] },
  { title: 'Abastecimiento', items: [
    { path: '/productos', label: 'Productos', icon: LuPackage },
    { path: '/materias-primas', label: 'Materias primas', icon: LuMountain },
    { path: '/compras', label: 'Compras', icon: LuShoppingCart },
    { path: '/proveedores', label: 'Proveedores', icon: LuTruck },
  ] },
  { title: 'Análisis', items: [
    { path: '/alertas', label: 'Alertas', icon: LuBell },
    { path: '/reportes', label: 'Reportes', icon: LuFileBarChart },
  ] },
  { title: 'Sistema', items: [
    { path: '/usuarios', label: 'Usuarios', icon: LuUsers, phase: 15 },
    { path: '/configuracion', label: 'Configuración', icon: LuSettings, phase: 15 },
  ] },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);

/** Barra inferior del celular: los accesos del día a día. El resto queda en el menú. */
export const MOBILE_TABS = ['/', '/cochadas', '/inventario', '/alertas'];
