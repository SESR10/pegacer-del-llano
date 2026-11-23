import raw from '../demo/demo-data.json';
import type { Health, Snapshot } from './types';

/**
 * Foto de los datos DEMO exportada de PostgreSQL (database/scripts/exportar-demo-json.sql).
 * Solo se usa en la compilación de demostración (VITE_DEMO_ONLY), que no tiene servidor.
 * Las fechas se desplazan para que la última actividad quede en el día de hoy.
 */
const DATE_KEYS = new Set(['at', 'producedAt']);

function shiftDates(snapshot: Snapshot): Snapshot {
  const offset = Date.now() - new Date(snapshot.generatedAt).getTime();
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) =>
        DATE_KEYS.has(k) && typeof v === 'string' ? [k, new Date(new Date(v).getTime() + offset).toISOString()] : [k, walk(v)]));
    }
    return value;
  };
  return walk(snapshot) as Snapshot;
}

export const demoSnapshot = (): Snapshot => {
  const s = shiftDates(structuredClone(raw) as unknown as Snapshot);
  s.suppliers = s.suppliers.map((x, i) => ({ ...x, id: x.id ?? i + 1, active: x.active ?? true }));
  return s;
};

export const DEMO_ONLY = import.meta.env.VITE_DEMO_ONLY === 'true';
const API = import.meta.env.VITE_API_URL ?? '';

export async function fetchHealth(): Promise<Health | null> {
  if (DEMO_ONLY) return null;
  try {
    const res = await fetch(`${API}/api/health`);
    const body = await res.json();
    return body.success ? (body.data as Health) : null;
  } catch {
    return null;
  }
}
