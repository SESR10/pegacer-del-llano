import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { apiFetch, apiFetchFull } from './auth';
import { DEMO_ONLY, demoSnapshot } from './data';
import type { AdjustInput, Alert, Batch, BatchInput, Catalogs, Category, DispatchInput, Formula, FormulaInput, Movement, Product, ProductInput, PurchaseInput, Snapshot, Supplier, SupplierInput, WasteInput } from './types';

/**
 * Datos de la aplicación (Fase 6 en adelante).
 * Con servidor: se leen del API y se recargan después de cada registro.
 * En la compilación de demostración (sin servidor) se usa la foto DEMO y los registros se simulan en memoria.
 */
interface Page<T> { content: T[] }
const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapProduct = (p: any): Product => ({ id: p.id, code: p.code, name: p.name, category: p.category as Category, unit: p.unit, stock: n(p.stock), minStock: n(p.minStock), unitCost: p.unitCost === null || p.unitCost === undefined ? null : Number(p.unitCost) });
const mapFormula = (f: any): Formula => ({
  id: f.id, name: f.name, version: f.version, product: f.productName, productId: f.productId, active: f.active, createdAt: f.createdAt,
  expectedBags: n(f.expectedBags), minBags: n(f.minBags), maxBags: n(f.maxBags), bagWeightKg: n(f.bagWeightKg),
  items: f.items.map((i: any) => ({ productId: i.productId, quantity: n(i.quantity) })),
});
const mapBatch = (b: any): Batch => ({
  id: b.id, code: b.code, producedAt: b.producedAt, bags: n(b.bagsProduced), operator: b.operator, formulaId: b.formulaId, notes: b.notes,
  consumptions: b.consumptions.map((c: any) => ({ productId: c.productId, theoretical: n(c.theoretical), real: n(c.real), variationPct: n(c.variationPct) })),
});
const mapSupplier = (s: any): Supplier => ({ id: s.id, nit: s.nit, name: s.name, phone: s.phone ?? '—', city: s.city ?? '—', email: s.email ?? null, active: s.active });
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
      code: p.code, at: p.purchasedAt, supplier: p.supplierName, supplierId: p.supplierId, invoice: p.invoiceNumber ?? '—', productId: i.productId, quantity: n(i.quantity),
      unitCost: i.unitCost === null || i.unitCost === undefined ? null : Number(i.unitCost),
    }))),
    dispatches: dispatches.content.flatMap((d) => d.items.map((i: any) => ({
      code: d.code, at: d.dispatchedAt, customer: d.customerName, productId: i.productId, quantity: n(i.quantity),
    }))),
    waste: waste.content.map((w) => ({ productId: w.productId, quantity: n(w.quantity), reason: w.reason, at: w.recordedAt })),
    suppliers: suppliers.map(mapSupplier),
    alerts: alerts.map((a): Alert => ({ id: a.id, type: a.type, severity: a.severity, message: a.message, at: a.createdAt })),
    settings,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Catálogos fijos de la base (V1__esquema_inicial.sql), para la demostración sin servidor. */
const DEMO_CATALOGS: Catalogs = {
  categories: [{ code: 'MATERIA_PRIMA', name: 'Materia prima' }, { code: 'INSUMO', name: 'Insumo' }, { code: 'PRODUCTO_TERMINADO', name: 'Producto terminado' }],
  units: [{ code: 'BULTO', name: 'Bulto' }, { code: 'M3', name: 'Metro cúbico' }, { code: 'KG', name: 'Kilogramo' }, { code: 'UND', name: 'Unidad' }, { code: 'BOLSA', name: 'Bolsa 25 kg' }],
};

interface Store {
  data: Snapshot | null;
  error: string | null;
  live: boolean;
  reload: () => Promise<void>;
  registerBatch: (input: BatchInput) => Promise<Batch>;
  resolveAlert: (id: number) => Promise<void>;
  kardex: (productId: number) => Promise<Movement[]>;
  catalogs: Catalogs;
  saveProduct: (input: ProductInput, id?: number) => Promise<Product>;
  deleteProduct: (id: number) => Promise<string>;
  adjust: (input: AdjustInput) => Promise<Movement>;
  saveFormula: (input: FormulaInput) => Promise<Formula>;
  activateFormula: (id: number) => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  registerDispatch: (input: DispatchInput) => Promise<string>;
  registerWaste: (input: WasteInput) => Promise<void>;
  registerPurchase: (input: PurchaseInput) => Promise<string>;
  saveSupplier: (input: SupplierInput, id?: number) => Promise<Supplier>;
}

const StoreContext = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(() => (DEMO_ONLY ? demoSnapshot() : null));
  const [error, setError] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<Catalogs>(DEMO_CATALOGS);
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
  useEffect(() => {
    if (!DEMO_ONLY) apiFetch<Catalogs>('/api/catalogs').then((c) => setCatalogs({ categories: c.categories, units: c.units })).catch(() => {});
  }, []);

  /** Demostración: aplica un cambio a una copia de los datos y la guarda. */
  const mutate = (fn: (s: Snapshot) => void) => {
    if (!current.current) throw new Error('Los datos todavía se están cargando.');
    const s = structuredClone(current.current);
    fn(s);
    current.current = s;
    setData(s);
  };
  const demoMove = (s: Snapshot, productId: number, type: string, quantity: number, notes: string | null) => {
    const p = s.products.find((x) => x.id === productId)!;
    const entry = ['INICIAL', 'ENTRADA_COMPRA', 'PRODUCCION', 'AJUSTE_POS'].includes(type);
    const after = entry ? p.stock + quantity : p.stock - quantity;
    if (after < 0) throw new Error(`No hay suficiente ${p.name.toLowerCase()}: hay ${p.stock} y se necesitan ${quantity}.`);
    const m: Movement = { id: Math.max(0, ...s.movements.map((x) => x.id)) + 1, productId, type, quantity, before: p.stock, after,
      refType: type.startsWith('AJUSTE') ? 'AJUSTE' : null, at: new Date().toISOString(), user: 'Usuario DEMO', notes };
    p.stock = after;
    s.movements.push(m);
    return m;
  };

  const saveProduct = useCallback(async (input: ProductInput, id?: number) => {
    if (!DEMO_ONLY) {
      const saved = mapProduct(await apiFetch(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(input) }));
      await reload();
      return saved;
    }
    let saved!: Product;
    mutate((s) => {
      const code = input.code.trim().toUpperCase();
      if (id) {
        const p = s.products.find((x) => x.id === id)!;
        Object.assign(p, { name: input.name.trim(), category: input.category, unit: input.unit, minStock: input.minStock, unitCost: input.unitCost ?? null });
        saved = p;
      } else {
        if (s.products.some((x) => x.code.toUpperCase() === code)) throw new Error(`Ya existe un producto con el código ${code}.`);
        saved = { id: Math.max(0, ...s.products.map((x) => x.id)) + 1, code, name: input.name.trim(), category: input.category, unit: input.unit,
          stock: 0, minStock: input.minStock, unitCost: input.unitCost ?? null };
        s.products.push(saved);
        if (input.initialStock) demoMove(s, saved.id, 'INICIAL', input.initialStock, 'Saldo inicial al crear el producto');
      }
    });
    return saved;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const deleteProduct = useCallback(async (id: number) => {
    if (!DEMO_ONLY) {
      const { message } = await apiFetchFull<null>(`/api/products/${id}`, { method: 'DELETE' });
      await reload();
      return message ?? 'Producto eliminado.';
    }
    let msg = 'Producto eliminado.';
    mutate((s) => {
      if (s.movements.some((m) => m.productId === id) || s.products.find((p) => p.id === id)!.stock > 0) {
        msg = 'El producto tiene historial de inventario, así que se desactivó en lugar de borrarse.';
      }
      s.products = s.products.filter((p) => p.id !== id);
    });
    return msg;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const adjust = useCallback(async (input: AdjustInput) => {
    if (!DEMO_ONLY) {
      const m = mapMovement(await apiFetch('/api/inventory/movements', { method: 'POST', body: JSON.stringify(input) }));
      await reload();
      return m;
    }
    let m!: Movement;
    mutate((s) => { m = demoMove(s, input.productId, input.type, input.quantity, input.notes); });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

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

  const saveFormula = useCallback(async (input: FormulaInput) => {
    if (!DEMO_ONLY) {
      const f = mapFormula(await apiFetch('/api/formulas', { method: 'POST', body: JSON.stringify(input) }));
      await reload();
      return f;
    }
    let f!: Formula;
    mutate((s) => {
      const product = s.products.find((p) => p.id === input.productId)!;
      const same = s.formulas.filter((x) => x.productId === input.productId || x.product === product.name);
      same.forEach((x) => { x.active = false; });
      f = { id: Math.max(0, ...s.formulas.map((x) => x.id)) + 1, name: input.name, version: Math.max(0, ...same.map((x) => x.version)) + 1,
        product: product.name, productId: product.id, active: true, expectedBags: input.expectedBags, minBags: input.minBags,
        maxBags: input.maxBags, bagWeightKg: input.bagWeightKg, items: input.items.map((i) => ({ ...i })) };
      s.formulas.push(f);
    });
    return f;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const activateFormula = useCallback(async (id: number) => {
    if (!DEMO_ONLY) {
      await apiFetch(`/api/formulas/${id}/activate`, { method: 'PATCH' });
      await reload();
      return;
    }
    mutate((s) => {
      const f = s.formulas.find((x) => x.id === id)!;
      s.formulas.filter((x) => x.product === f.product).forEach((x) => { x.active = x.id === id; });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    if (!DEMO_ONLY) {
      await apiFetch(`/api/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) });
      await reload();
      return;
    }
    const n = Number(value.replace(',', '.'));
    if (!(n > 0 && n <= 50)) throw new Error('La tolerancia debe ser un número mayor que 0 y hasta 50 (%).');
    mutate((s) => { s.settings[key] = String(n); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const registerDispatch = useCallback(async (input: DispatchInput) => {
    if (!DEMO_ONLY) {
      const d = await apiFetch<{ code: string }>('/api/dispatches', { method: 'POST', body: JSON.stringify(input) });
      await reload();
      return d.code;
    }
    let code = '';
    mutate((s) => {
      const missing = input.items.map((i) => ({ i, p: s.products.find((x) => x.id === i.productId)! })).filter(({ i, p }) => p.stock < i.quantity);
      if (missing.length) throw new Error(missing.map(({ i, p }) => `No hay suficiente ${p.name.toLowerCase()}: hay ${p.stock} y se necesitan ${i.quantity}.`).join(' '));
      const at = input.dispatchedAt ?? new Date().toISOString();
      const year = new Date(at).getFullYear();
      const last = Math.max(0, ...s.dispatches.filter((d) => d.code.startsWith(`D-${year}-`)).map((d) => Number(d.code.slice(7)) || 0));
      code = `D-${year}-${String(last + 1).padStart(4, '0')}`;
      for (const i of input.items) {
        demoMove(s, i.productId, 'SALIDA_DESPACHO', i.quantity, `Despacho ${code}`);
        s.dispatches.unshift({ code, at, customer: input.customerName.trim(), productId: i.productId, quantity: i.quantity });
      }
      s.dispatches.sort((a, b) => b.at.localeCompare(a.at));
    });
    return code;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const registerWaste = useCallback(async (input: WasteInput) => {
    if (!DEMO_ONLY) {
      await apiFetch('/api/waste', { method: 'POST', body: JSON.stringify(input) });
      await reload();
      return;
    }
    mutate((s) => {
      const notes = input.notes?.trim() ? `${input.reason} — ${input.notes.trim()}` : input.reason;
      demoMove(s, input.productId, 'DESPERDICIO', input.quantity, notes);
      s.waste.unshift({ productId: input.productId, quantity: input.quantity, reason: input.reason, at: input.recordedAt ?? new Date().toISOString() });
      s.waste.sort((a, b) => b.at.localeCompare(a.at));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const registerPurchase = useCallback(async (input: PurchaseInput) => {
    if (!DEMO_ONLY) {
      const p = await apiFetch<{ code: string }>('/api/purchases', { method: 'POST', body: JSON.stringify(input) });
      await reload();
      return p.code;
    }
    let code = '';
    mutate((s) => {
      const sup = s.suppliers.find((x) => x.id === input.supplierId)!;
      const invoice = input.invoiceNumber?.trim() || null;
      if (invoice && s.purchases.some((p) => p.supplier === sup.name && p.invoice.toUpperCase() === invoice.toUpperCase())) {
        throw new Error(`Ya se registró la factura ${invoice} de ${sup.name}${sup.name.endsWith('.') ? '' : '.'}`);
      }
      const at = input.purchasedAt ?? new Date().toISOString();
      const year = new Date(at).getFullYear();
      const last = Math.max(0, ...s.purchases.filter((p) => p.code.startsWith(`OC-${year}-`)).map((p) => Number(p.code.slice(8)) || 0));
      code = `OC-${year}-${String(last + 1).padStart(4, '0')}`;
      for (const i of input.items) {
        demoMove(s, i.productId, 'ENTRADA_COMPRA', i.quantity, `Compra ${code} a ${sup.name}`);
        if (i.unitCost != null) s.products.find((p) => p.id === i.productId)!.unitCost = i.unitCost;
        s.purchases.unshift({ code, at, supplier: sup.name, supplierId: sup.id, invoice: invoice ?? '—', productId: i.productId, quantity: i.quantity, unitCost: i.unitCost ?? null });
      }
      s.purchases.sort((a, b) => b.at.localeCompare(a.at));
    });
    return code;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const saveSupplier = useCallback(async (input: SupplierInput, id?: number) => {
    if (!DEMO_ONLY) {
      const saved = mapSupplier(await apiFetch(id ? `/api/suppliers/${id}` : '/api/suppliers', { method: id ? 'PUT' : 'POST', body: JSON.stringify(input) }));
      await reload();
      return saved;
    }
    let saved!: Supplier;
    mutate((s) => {
      const nit = input.nit.trim();
      if (s.suppliers.some((x) => x.id !== id && x.nit.toUpperCase() === nit.toUpperCase())) throw new Error(`Ya existe un proveedor con el NIT ${nit}.`);
      const fields = { nit, name: input.name.trim(), phone: input.phone?.trim() || '—', city: input.city?.trim() || '—', email: input.email?.trim() || null, active: input.active ?? true };
      if (id) {
        const x = s.suppliers.find((y) => y.id === id)!;
        s.purchases.filter((p) => p.supplier === x.name).forEach((p) => { p.supplier = fields.name; });
        Object.assign(x, fields);
        saved = x;
      } else {
        saved = { id: Math.max(0, ...s.suppliers.map((x) => x.id)) + 1, ...fields };
        s.suppliers.push(saved);
      }
      s.suppliers.sort((a, b) => a.name.localeCompare(b.name));
    });
    return saved;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  return (
    <StoreContext.Provider value={{ data, error, live: !DEMO_ONLY, reload, registerBatch, resolveAlert, kardex, catalogs, saveProduct, deleteProduct, adjust, saveFormula, activateFormula, updateSetting, registerDispatch, registerWaste, registerPurchase, saveSupplier }}>
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
