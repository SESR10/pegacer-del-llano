import type { Batch, Formula, Product, Snapshot } from '../services/types';

export const toleranceOf = (s: Snapshot) => Number(s.settings['consumo.tolerancia_pct'] ?? 5);
export const formulaOf = (s: Snapshot, b?: Batch): Formula | undefined =>
  (b?.formulaId && s.formulas.find((f) => f.id === b.formulaId)) || s.formulas[0];

export type StockStatus = 'AGOTADO' | 'CRITICO' | 'OK';
export function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return 'AGOTADO';
  if (p.stock < p.minStock) return 'CRITICO';
  return 'OK';
}

export type Tone = 'ok' | 'warn' | 'bad';
export function batchStatus(b: Batch, f: Formula | undefined, tolerance: number): { label: string; tone: Tone } {
  const maxVar = Math.max(0, ...b.consumptions.map((c) => Math.abs(c.variationPct)));
  const low = !!f && b.bags < f.minBags;
  if (maxVar > tolerance && low) return { label: 'Revisar', tone: 'bad' };
  if (maxVar > tolerance) return { label: 'Consumo alto', tone: 'warn' };
  if (low) return { label: 'Producción baja', tone: 'warn' };
  return { label: 'En rango', tone: 'ok' };
}

export function maxVariation(b: Batch) {
  return b.consumptions.reduce((m, c) => (Math.abs(c.variationPct) > Math.abs(m) ? c.variationPct : m), 0);
}

export const daysAgo = (days: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - days + 1); return d; };
export const recentBatches = (s: Snapshot, days = 30) => {
  const from = daysAgo(days).getTime();
  return s.batches.filter((b) => new Date(b.producedAt).getTime() >= from);
};

/** Bolsas producidas por día en los últimos N días. */
export function productionByDay(batches: Batch[], days = 30) {
  const out: { day: Date; bags: number; batches: number }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    out.push({ day: d, bags: 0, batches: 0 });
  }
  for (const b of batches) {
    const d = new Date(b.producedAt); d.setHours(0, 0, 0, 0);
    const slot = out.find((o) => o.day.getTime() === d.getTime());
    if (slot) { slot.bags += b.bags; slot.batches += 1; }
  }
  return out;
}

/** Permisos de la pantalla: iguales a los del servidor (security/Roles.java). Sin sesión (demostración) se permite todo. */
export const can = (role: string | undefined, action: 'cochadas' | 'alertas' | 'inventario') => {
  if (!role) return true;
  if (action === 'cochadas') return ['ADMIN', 'PRODUCCION'].includes(role);
  if (action === 'inventario') return ['ADMIN', 'INVENTARIO'].includes(role);
  return ['ADMIN', 'INVENTARIO', 'PRODUCCION', 'COMPRAS'].includes(role);
};
