import type { IconType } from 'react-icons';
import {
  LuLayoutDashboard, LuFactory, LuBarChart3, LuFlaskConical, LuWarehouse, LuPackageCheck, LuTrash2,
  LuPackage, LuMountain, LuShoppingCart, LuTruck, LuBell, LuFileBarChart, LuUsers, LuSettings,
} from 'react-icons/lu';

export interface NavItem { path: string; label: string; icon: IconType; phase?: number; }
export interface NavGroup { title: string; items: NavItem[]; }

export const NAV: NavGroup[] = [
  { title: 'Operación', items: [
    { path: '/', label: 'Dashboard', icon: LuLayoutDashboard },
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
    { path: '/reportes', label: 'Reportes', icon: LuFileBarChart, phase: 14 },
  ] },
  { title: 'Sistema', items: [
    { path: '/usuarios', label: 'Usuarios', icon: LuUsers, phase: 4 },
    { path: '/configuracion', label: 'Configuración', icon: LuSettings, phase: 9 },
  ] },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);

export const PHASES: { n: number; title: string; status: 'hecha' | 'en curso' | 'pendiente' }[] = [
  { n: 1, title: 'Configurar proyecto', status: 'hecha' },
  { n: 2, title: 'Base de datos', status: 'hecha' },
  { n: 3, title: 'Backend (entidades y servicios)', status: 'pendiente' },
  { n: 4, title: 'Autenticación y roles', status: 'pendiente' },
  { n: 5, title: 'Frontend base', status: 'hecha' },
  { n: 6, title: 'Dashboard', status: 'en curso' },
  { n: 7, title: 'Productos', status: 'en curso' },
  { n: 8, title: 'Inventario', status: 'en curso' },
  { n: 9, title: 'Fórmulas', status: 'en curso' },
  { n: 10, title: 'Cochadas', status: 'en curso' },
  { n: 11, title: 'Producción', status: 'en curso' },
  { n: 12, title: 'Compras', status: 'en curso' },
  { n: 13, title: 'Alertas', status: 'en curso' },
  { n: 14, title: 'Reportes', status: 'pendiente' },
  { n: 15, title: 'Responsive (ajuste final)', status: 'pendiente' },
  { n: 16, title: 'Pruebas', status: 'pendiente' },
];
