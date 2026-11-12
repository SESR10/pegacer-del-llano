import { data } from '../services/data';
import type { Batch, Product } from '../services/types';

export const tolerance = Number(data.settings['consumo.tolerancia_pct'] ?? 5);
export const formula = data.formulas[0];

export type StockStatus = 'AGOTADO' | 'CRITICO' | 'OK';
export function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return 'AGOTADO';
  if (p.stock < p.minStock) return 'CRITICO';
  return 'OK';
}

export function batchStatus(b: Batch): { label: string; tone: 'ok' | 'warn' | 'bad' } {
  const maxVar = Math.max(...b.consumptions.map((c) => Math.abs(c.variationPct)));
  const low = formula && b.bags < formula.minBags;
  if (maxVar > tolerance && low) return { label: 'Revisar', tone: 'bad' };
  if (maxVar > tolerance) return { label: 'Consumo alto', tone: 'warn' };
  if (low) return { label: 'Producción baja', tone: 'warn' };
  return { label: 'En rango', tone: 'ok' };
}

export function maxVariation(b: Batch) {
  return b.consumptions.reduce((m, c) => (Math.abs(c.variationPct) > Math.abs(m) ? c.variationPct : m), 0);
}

/** Bolsas producidas por día en los últimos N días. */
export function productionByDay(days = 30) {
  const out: { day: Date; bags: number; batches: number }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    out.push({ day: d, bags: 0, batches: 0 });
  }
  for (const b of data.batches) {
    const d = new Date(b.producedAt); d.setHours(0, 0, 0, 0);
    const slot = out.find((o) => o.day.getTime() === d.getTime());
    if (slot) { slot.bags += b.bags; slot.batches += 1; }
  }
  return out;
}
