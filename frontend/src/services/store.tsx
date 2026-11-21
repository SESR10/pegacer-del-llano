import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { apiFetch } from './auth';
import { DEMO_ONLY, demoSnapshot } from './data';
import type { Alert, Batch, BatchInput, Category, Formula, Movement, Product, Snapshot } from './types';

/**
 * Datos de la aplicación (Fase 6 en adelante).
 * Con servidor: se leen del API y se recargan después de cada registro.
 * En la compilación de demostración (sin servidor) se usa la foto DEMO y los registros se simulan en memoria.
 */
interface Page<T> { content: T[] }
const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapProduct = (p: any): Product => ({ id: p.id, code: p.code, name: p.name, category: p.category as Category, unit: p.unit, stock: n(p.stock), minStock: n(p.minStock) });
const mapFormula = (f: any): Formula => ({
  id: f.id, name: f.name, version: f.version, product: f.productName, productId: f.productId, active: f.active,
  expectedBags: n(f.expectedBags), minBags: n(f.minBags), maxBags: n(f.maxBags), bagWeightKg: n(f.bagWeightKg),
  items: f.items.map((i: any) => ({ productId: i.productId, quantity: n(i.quantity) })),
});
const mapBatch = (b: any): Batch => ({
  id: b.id, code: b.code, producedAt: b.producedAt, bags: n(b.bagsProduced), operator: b.operator, formulaId: b.formulaId, notes: b.notes,
  consumptions: b.consumptions.map((c: any) => ({ productId: c.productId, theoretical: n(c.theoretical), real: n(c.real), variationPct: n(c.variationPct) })),
});
const mapMovement = (m: any): Movement => ({
  id: m.id, productId: m.productId, type: m.type, quantity: n(m.quantity), before: n(m.stockBefore), after: n(m.stockAfter),
  refType: m.referenceType, at: m.createdAt, user: m.user, notes: m.notes,
});

async function loadLive(): Promise<Snapshot> {
  const [products, formulas, batches, purchases, dispatches, waste, suppliers, alerts, settings] = await Promise.all([
    apiFetch<any[]>('/api/inventory'),
    apiFetch<any[]>('/api/formulas'),
    apiFetch<Page<any>>('/api/batches?size=200'),
    apiFetch<Page<any>>('/api/purchases?size=100'),
    apiFetch<Page<any>>('/api/dispatches?size=100'),
    apiFetch<Page<any>>('/api/waste?size=100'),
    apiFetch<any[]>('/api/suppliers'),
    apiFetch<any[]>('/api/alerts?resolved=false'),
    apiFetch<Record<string, string>>('/api/settings'),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    products: products.map(mapProduct),
    formulas: formulas.map(mapFormula),
    batches: batches.content.map(mapBatch),
    movements: [],
    purchases: purchases.content.flatMap((p) => p.items.map((i: any) => ({
      code: p.code, at: p.purchasedAt, supplier: p.supplierName, invoice: p.invoiceNumber ?? '—', productId: i.productId, quantity: n(i.quantity),
    }))),
    dispatches: dispatches.content.flatMap((d) => d.items.map((i: any) => ({
      code: d.code, at: d.dispatchedAt, customer: d.customerName, productId: i.productId, quantity: n(i.quantity),
    }))),
    waste: waste.content.map((w) => ({ productId: w.productId, quantity: n(w.quantity), reason: w.reason, at: w.recordedAt })),
    suppliers: suppliers.map((s) => ({ nit: s.nit, name: s.name, phone: s.phone ?? '—', city: s.city ?? '—' })),
    alerts: alerts.map((a): Alert => ({ id: a.id, type: a.type, severity: a.severity, message: a.message, at: a.createdAt })),
    settings,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Store {
  data: Snapshot | null;
  error: string | null;
  live: boolean;
  reload: () => Promise<void>;
  registerBatch: (input: BatchInput) => Promise<Batch>;
  resolveAlert: (id: number) => Promise<void>;
  kardex: (productId: number) => Promise<Movement[]>;
}

const StoreContext = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(() => (DEMO_ONLY ? demoSnapshot() : null));
  const [error, setError] = useState<string | null>(null);
  const current = useRef(data);
  current.current = data;

  const reload = useCallback(async () => {
    if (DEMO_ONLY) return;
    try {
      setData(await loadLive());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const registerBatch = useCallback(async (input: BatchInput) => {
    if (!DEMO_ONLY) {
      const created = mapBatch(await apiFetch('/api/batches', { method: 'POST', body: JSON.stringify(input) }));
      await reload();
      return created;
    }
    // Demostración: se simula el registro en memoria (se pierde al recargar la página).
    const prev = current.current;
    if (!prev) throw new Error('Los datos todavía se están cargando.');
    const s = structuredClone(prev);
    const f = s.formulas.find((x) => x.id === input.formulaId);
    if (!f) throw new Error('La fórmula no existe.');
    for (const c of input.consumptions) {
      const p = s.products.find((x) => x.id === c.productId)!;
      if (p.stock < c.realQty) throw new Error(`No hay suficiente ${p.name.toLowerCase()}: hay ${p.stock} y se necesitan ${c.realQty}.`);
    }
    const at = input.producedAt ?? new Date().toISOString();
    const id = Math.max(0, ...s.batches.map((b) => b.id)) + 1;
    const created: Batch = {
      id, code: `C-${new Date(at).getFullYear()}-${String(id).padStart(4, '0')}`, producedAt: at, bags: input.bagsProduced,
      operator: 'Usuario DEMO', formulaId: f.id, notes: input.notes ?? null,
      consumptions: f.items.map((i) => {
        const real = input.consumptions.find((c) => c.productId === i.productId)!.realQty;
        return { productId: i.productId, theoretical: i.quantity, real, variationPct: Math.round(((real - i.quantity) * 10000) / i.quantity) / 100 };
      }),
    };
    for (const c of input.consumptions) s.products.find((x) => x.id === c.productId)!.stock -= c.realQty;
    const pt = s.products.find((x) => x.id === f.productId || x.name === f.product);
    if (pt) pt.stock += input.bagsProduced;
    s.batches = [created, ...s.batches].sort((a, b) => b.producedAt.localeCompare(a.producedAt));
    setData(s);
    return created;
  }, [reload]);

  const resolveAlert = useCallback(async (id: number) => {
    if (!DEMO_ONLY) await apiFetch(`/api/alerts/${id}/resolve`, { method: 'PATCH' });
    setData((prev) => prev && { ...prev, alerts: prev.alerts.filter((a) => a.id !== id) });
  }, []);

  const kardex = useCallback(async (productId: number) => {
    if (DEMO_ONLY) return (current.current?.movements ?? []).filter((m) => m.productId === productId).slice().reverse();
    const page = await apiFetch<Page<unknown>>(`/api/inventory/movements?productId=${productId}&size=60`);
    return page.content.map(mapMovement);
  }, []);

  return (
    <StoreContext.Provider value={{ data, error, live: !DEMO_ONLY, reload, registerBatch, resolveAlert, kardex }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore fuera de DataProvider');
  return s;
}

/** Para las pantallas: los datos ya cargados (el layout no muestra las pantallas hasta tenerlos). */
export function useData(): Snapshot {
  const { data } = useStore();
  if (!data) throw new Error('Datos no cargados');
  return data;
}
