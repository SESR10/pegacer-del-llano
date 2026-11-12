import raw from '../demo/demo-data.json';
import type { Health, Snapshot } from './types';

/**
 * Fuente de datos del frontend.
 * Mientras se construyen los endpoints de negocio (Fases 3–14) las pantallas leen una foto de los
 * datos DEMO exportada de PostgreSQL (database/scripts/exportar-demo-json.sql). Las fechas se
 * desplazan para que la última actividad quede en el día de hoy.
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

export const data: Snapshot = shiftDates(raw as unknown as Snapshot);

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

export const productById = (id: number) => data.products.find((p) => p.id === id);
