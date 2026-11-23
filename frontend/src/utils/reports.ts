import type { Batch, Product, Snapshot } from '../services/types';
import { formulaOf } from './metrics';
import { MOVEMENT_LABEL, unit } from './format';

/**
 * Fase 14: reportes. Cada reporte es una lista de tablas que se muestran en pantalla
 * y se exportan igual a CSV, Excel y PDF (impresión).
 */
export type Kind = 'text' | 'num' | 'money' | 'pct' | 'date';
export interface RCol { label: string; kind?: Kind; digits?: number }
export type Cell = string | number | null;
export interface RTable { name: string; columns: RCol[]; rows: Cell[][]; total?: Cell[]; note?: string }
export interface RKpi { label: string; value: string; sub?: string }
export interface Report { title: string; kpis: RKpi[]; tables: RTable[]; warnings: string[] }

export interface Period { from: Date; to: Date } // [from, to)
export const inPeriod = (iso: string, p: Period) => { const t = new Date(iso).getTime(); return t >= p.from.getTime() && t < p.to.getTime(); };

const fmtN = (n: number, d = 1) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: d }).format(n);
const fmtMoney = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export type Group = 'dia' | 'semana' | 'mes';
function groupKey(iso: string, g: Group): { key: string; label: string } {
  const d = new Date(iso);
  if (g === 'mes') return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
  if (g === 'semana') {
    const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); // lunes
    return { key: dayKey(m), label: `Semana del ${m.getDate()} de ${MONTHS[m.getMonth()].slice(0, 3)}` };
  }
  return { key: dayKey(d), label: `${d.getDate()} de ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` };
}

const batchesIn = (s: Snapshot, p: Period) => s.batches.filter((b) => inPeriod(b.producedAt, p)).sort((a, b) => a.producedAt.localeCompare(b.producedAt));
const prod = (s: Snapshot, id: number) => s.products.find((x) => x.id === id);
const bagKg = (s: Snapshot, b: Batch) => formulaOf(s, b)?.bagWeightKg || 25;

/** Producción por día, semana o mes y por producto. */
export function productionReport(s: Snapshot, p: Period, g: Group): Report {
  const batches = batchesIn(s, p);
  const groups = new Map<string, { label: string; batches: number; bags: number; kg: number }>();
  batches.forEach((b) => {
    const { key, label } = groupKey(b.producedAt, g);
    const r = groups.get(key) ?? { label, batches: 0, bags: 0, kg: 0 };
    r.batches++; r.bags += b.bags; r.kg += b.bags * bagKg(s, b);
    groups.set(key, r);
  });
  const byProduct = new Map<string, { batches: number; bags: number }>();
  batches.forEach((b) => {
    const name = formulaOf(s, b)?.product ?? '—';
    const r = byProduct.get(name) ?? { batches: 0, bags: 0 };
    r.batches++; r.bags += b.bags; byProduct.set(name, r);
  });
  const bags = batches.reduce((t, b) => t + b.bags, 0);
  const kg = batches.reduce((t, b) => t + b.bags * bagKg(s, b), 0);
  const label = g === 'dia' ? 'Día' : g === 'semana' ? 'Semana' : 'Mes';
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, r]) => [r.label, r.batches, r.bags, r.kg / 1000, r.bags / r.batches]);
  return {
    title: 'Producción',
    warnings: [],
    kpis: [
      { label: 'Cochadas', value: fmtN(batches.length, 0) },
      { label: 'Bolsas', value: fmtN(bags, 0) },
      { label: 'Toneladas', value: fmtN(kg / 1000, 1) },
      { label: 'Promedio por cochada', value: batches.length ? fmtN(bags / batches.length, 1) : '—', sub: 'bolsas' },
    ],
    tables: [
      { name: `Producción por ${label.toLowerCase()}`, columns: [{ label }, { label: 'Cochadas', kind: 'num', digits: 0 }, { label: 'Bolsas', kind: 'num', digits: 0 },
        { label: 'Toneladas', kind: 'num', digits: 2 }, { label: 'Bolsas por cochada', kind: 'num', digits: 1 }],
        rows, total: ['Total', batches.length, bags, kg / 1000, batches.length ? bags / batches.length : null] },
      { name: 'Producción por producto', columns: [{ label: 'Producto' }, { label: 'Cochadas', kind: 'num', digits: 0 }, { label: 'Bolsas', kind: 'num', digits: 0 }],
        rows: [...byProduct.entries()].map(([n, r]) => [n, r.batches, r.bags]) },
      { name: 'Cochadas', columns: [{ label: 'Código' }, { label: 'Fecha', kind: 'date' }, { label: 'Producto' }, { label: 'Bolsas', kind: 'num', digits: 0 }, { label: 'Operario' }],
        rows: batches.map((b) => [b.code, b.producedAt, formulaOf(s, b)?.product ?? '—', b.bags, b.operator ?? '—']) },
    ],
  };
}

/** Consumo de cada material: teórico (fórmula) contra real. */
export function consumptionReport(s: Snapshot, p: Period): Report {
  const batches = batchesIn(s, p);
  const acc = new Map<number, { theo: number; real: number }>();
  batches.forEach((b) => b.consumptions.forEach((c) => {
    const r = acc.get(c.productId) ?? { theo: 0, real: 0 };
    r.theo += c.theoretical; r.real += c.real; acc.set(c.productId, r);
  }));
  const rows = [...acc.entries()].map(([id, r]) => {
    const pr = prod(s, id);
    return [pr?.name ?? '—', unit(pr?.unit ?? ''), r.theo, r.real, r.real - r.theo, r.theo ? ((r.real - r.theo) / r.theo) * 100 : null] as Cell[];
  });
  const worst = rows.reduce<Cell[] | null>((m, r) => (!m || Math.abs(Number(r[5])) > Math.abs(Number(m[5])) ? r : m), null);
  return {
    title: 'Consumo de materias primas',
    warnings: [],
    kpis: [
      { label: 'Cochadas analizadas', value: fmtN(batches.length, 0) },
      { label: 'Mayor variación', value: worst ? `${Number(worst[5]) > 0 ? '+' : ''}${fmtN(Number(worst[5]), 1)} %` : '—', sub: worst ? String(worst[0]) : undefined },
    ],
    tables: [{ name: 'Consumo por material', columns: [{ label: 'Material' }, { label: 'Unidad' }, { label: 'Teórico', kind: 'num', digits: 2 },
      { label: 'Real', kind: 'num', digits: 2 }, { label: 'Diferencia', kind: 'num', digits: 2 }, { label: 'Variación', kind: 'pct' }], rows,
      note: 'Teórico = lo que pide la fórmula de cada cochada. Real = lo que se registró.' }],
  };
}

/** Costo por cochada y por bolsa con el costo unitario actual de cada material. No se inventan costos que falten. */
export function costReport(s: Snapshot, p: Period): Report {
  const batches = batchesIn(s, p);
  const other = Number(s.settings['costo.otros_por_cochada'] ?? 0) || 0;
  const missing = new Set<string>();
  const materials = new Map<number, { qty: number; cost: number | null }>();
  const rows = batches.map((b) => {
    let mat = 0; let complete = true;
    b.consumptions.forEach((c) => {
      const pr = prod(s, c.productId);
      const r = materials.get(c.productId) ?? { qty: 0, cost: pr?.unitCost ?? null };
      r.qty += c.real; materials.set(c.productId, r);
      if (pr?.unitCost == null) { complete = false; if (pr) missing.add(pr.name); } else mat += c.real * pr.unitCost;
    });
    const total = complete ? mat + other : null;
    return [b.code, b.producedAt, b.bags, complete ? mat : null, other, total, total !== null && b.bags ? total / b.bags : null] as Cell[];
  });
  const ok = rows.filter((r) => r[5] !== null);
  const sumTotal = ok.reduce((t, r) => t + Number(r[5]), 0);
  const sumBags = ok.reduce((t, r) => t + Number(r[2]), 0);
  const matRows = [...materials.entries()].map(([id, r]) => {
    const pr = prod(s, id);
    return [pr?.name ?? '—', unit(pr?.unit ?? ''), r.qty, r.cost, r.cost !== null ? r.qty * r.cost : null] as Cell[];
  });
  const matTotal = matRows.every((r) => r[4] !== null) ? matRows.reduce((t, r) => t + Number(r[4]), 0) : null;
  return {
    title: 'Costos de producción',
    warnings: missing.size ? [`Falta el costo unitario de: ${[...missing].join(', ')}. Escríbalo en Productos o regístrelo en una compra; mientras tanto esas cochadas no se costean.`] : [],
    kpis: [
      { label: 'Costo promedio por cochada', value: ok.length ? fmtMoney(sumTotal / ok.length) : '—' },
      { label: 'Costo aproximado por bolsa', value: sumBags ? fmtMoney(sumTotal / sumBags) : '—' },
      { label: 'Materias primas del periodo', value: matTotal !== null ? fmtMoney(matTotal) : '—', sub: matTotal === null ? 'faltan costos' : undefined },
      { label: 'Otros costos por cochada', value: fmtMoney(other) },
    ],
    tables: [
      { name: 'Costo por cochada', columns: [{ label: 'Cochada' }, { label: 'Fecha', kind: 'date' }, { label: 'Bolsas', kind: 'num', digits: 0 },
        { label: 'Materiales', kind: 'money' }, { label: 'Otros', kind: 'money' }, { label: 'Total', kind: 'money' }, { label: 'Costo por bolsa', kind: 'money' }],
        rows, total: ['Total', '', sumBags, null, null, ok.length ? sumTotal : null, sumBags ? sumTotal / sumBags : null],
        note: 'Se usa el costo unitario actual de cada material (el de la última compra o el escrito en Productos).' },
      { name: 'Costo de materias primas', columns: [{ label: 'Material' }, { label: 'Unidad' }, { label: 'Cantidad usada', kind: 'num', digits: 2 },
        { label: 'Costo unitario', kind: 'money' }, { label: 'Costo total', kind: 'money' }], rows: matRows, total: ['Total', '', null, null, matTotal] },
    ],
  };
}

/** Resultado del API /api/reports/inventory (o su cálculo en la demostración). */
export interface InvRow { productId: number; code: string; name: string; category: string; unit: string; unitCost: number | null; opening: number; entries: number; exits: number; closing: number; movements: Record<string, number> }

export function inventoryReport(rows: InvRow[], products: Product[]): Report {
  const value = products.reduce((t, x) => t + (x.unitCost != null ? Math.max(0, x.stock) * x.unitCost : 0), 0);
  const noCost = products.filter((x) => x.unitCost == null && x.category !== 'PRODUCTO_TERMINADO').length;
  const m = (r: InvRow, k: string) => r.movements[k] ?? 0;
  // Solo las columnas de tipos que tuvieron movimiento en el periodo (para que la tabla quepa).
  const types = ['ENTRADA_COMPRA', 'PRODUCCION', 'AJUSTE_POS', 'CONSUMO_COCHADA', 'SALIDA_DESPACHO', 'DESPERDICIO', 'AJUSTE_NEG']
    .filter((t) => rows.some((r) => (r.movements[t] ?? 0) !== 0));
  return {
    title: 'Inventario',
    warnings: [],
    kpis: [
      { label: 'Valor aproximado del inventario', value: fmtMoney(value), sub: noCost ? `${noCost} materiales sin costo` : 'con el costo actual' },
      { label: 'Productos con stock bajo', value: fmtN(products.filter((x) => x.stock > 0 && x.stock < x.minStock).length, 0) },
      { label: 'Productos agotados', value: fmtN(products.filter((x) => x.stock <= 0).length, 0) },
    ],
    tables: [
      { name: 'Movimiento del inventario', columns: [{ label: 'Producto' }, { label: 'Unidad' }, { label: 'Saldo inicial', kind: 'num', digits: 2 },
        ...types.map((t): RCol => ({ label: MOVEMENT_LABEL[t] ?? t, kind: 'num', digits: 2 })), { label: 'Saldo final', kind: 'num', digits: 2 }],
        rows: rows.map((r) => [r.name, unit(r.unit), r.opening, ...types.map((t) => m(r, t) || null), r.closing]) },
      { name: 'Inventario actual', columns: [{ label: 'Código' }, { label: 'Producto' }, { label: 'Unidad' }, { label: 'Stock', kind: 'num', digits: 2 },
        { label: 'Mínimo', kind: 'num', digits: 2 }, { label: 'Costo unitario', kind: 'money' }, { label: 'Valor', kind: 'money' }],
        rows: products.map((x) => [x.code, x.name, unit(x.unit), x.stock, x.minStock, x.unitCost ?? null, x.unitCost != null ? Math.max(0, x.stock) * x.unitCost : null]),
        total: ['Total', '', '', null, null, null, value] },
    ],
  };
}

/** Rendimiento: bolsas esperadas contra obtenidas y desperdicio. */
export function performanceReport(s: Snapshot, p: Period): Report {
  const batches = batchesIn(s, p);
  const rows = batches.map((b) => {
    const f = formulaOf(s, b);
    const exp = f?.expectedBags ?? 0;
    return [b.code, b.producedAt, exp, b.bags, b.bags - exp, exp ? ((b.bags - exp) / exp) * 100 : null,
      f && (b.bags < f.minBags || b.bags > f.maxBags) ? 'Fuera de rango' : 'En rango'] as Cell[];
  });
  const expT = rows.reduce((t, r) => t + Number(r[2]), 0);
  const realT = rows.reduce((t, r) => t + Number(r[3]), 0);
  const out = rows.filter((r) => r[6] === 'Fuera de rango').length;
  const waste = s.waste.filter((w) => inPeriod(w.at, p));
  const wasteRows = waste.map((w) => { const pr = prod(s, w.productId); return [w.at, pr?.name ?? '—', w.quantity, unit(pr?.unit ?? ''), w.reason] as Cell[]; });
  return {
    title: 'Rendimiento',
    warnings: [],
    kpis: [
      { label: 'Bolsas esperadas', value: fmtN(expT, 0) },
      { label: 'Bolsas obtenidas', value: fmtN(realT, 0), sub: expT ? `${realT >= expT ? '+' : ''}${fmtN(((realT - expT) / expT) * 100, 1)} % frente a lo esperado` : undefined },
      { label: 'Cochadas fuera de rango', value: fmtN(out, 0), sub: `de ${batches.length}` },
      { label: 'Registros de desperdicio', value: fmtN(waste.length, 0) },
    ],
    tables: [
      { name: 'Producción esperada y real', columns: [{ label: 'Cochada' }, { label: 'Fecha', kind: 'date' }, { label: 'Esperadas', kind: 'num', digits: 0 },
        { label: 'Obtenidas', kind: 'num', digits: 0 }, { label: 'Diferencia', kind: 'num', digits: 0 }, { label: 'Variación', kind: 'pct' }, { label: 'Estado' }],
        rows, total: ['Total', '', expT, realT, realT - expT, expT ? ((realT - expT) / expT) * 100 : null, ''] },
      { name: 'Desperdicio', columns: [{ label: 'Fecha', kind: 'date' }, { label: 'Producto' }, { label: 'Cantidad', kind: 'num', digits: 3 }, { label: 'Unidad' }, { label: 'Motivo' }], rows: wasteRows },
    ],
  };
}

/* ---------- Formato y exportación ---------- */

export function formatCell(v: Cell, c: RCol): string {
  if (v === null || v === '') return '—';
  if (typeof v === 'string') return c.kind === 'date' ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : v;
  if (c.kind === 'money') return fmtMoney(v);
  if (c.kind === 'pct') return `${v > 0 ? '+' : ''}${fmtN(v, 1)} %`;
  return fmtN(v, c.digits ?? 2);
}

const fileBase = (r: Report, p: Period) => `${r.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}_${dayKey(p.from)}_${dayKey(new Date(p.to.getTime() - 1))}`;

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** CSV con punto y coma y coma decimal, como lo abre Excel en español. */
export function exportCsv(r: Report, p: Period, company: string) {
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const raw = (v: Cell, c: RCol) => {
    if (v === null || v === '') return '';
    if (typeof v === 'number') return String(Math.round(v * 1000) / 1000).replace('.', ',');
    return c.kind === 'date' ? dayKey(new Date(v)) : v;
  };
  const lines = [esc(`${company} · ${r.title}`), esc(periodLabel(p)), ''];
  r.tables.forEach((t) => {
    lines.push(esc(t.name), t.columns.map((c) => esc(c.label)).join(';'));
    t.rows.forEach((row) => lines.push(row.map((v, i) => esc(raw(v, t.columns[i]))).join(';')));
    if (t.total) lines.push(t.total.map((v, i) => esc(raw(v, t.columns[i]))).join(';'));
    lines.push('');
  });
  download(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${fileBase(r, p)}.csv`);
}

/** Excel (.xlsx): una hoja por tabla, con encabezados en negrilla y formatos de número. */
export async function exportExcel(r: Report, p: Period, company: string) {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const fmt = (c: RCol) => (c.kind === 'money' ? '"$"#,##0' : c.kind === 'pct' ? '0.0" %"' : c.kind === 'num' ? (c.digits === 0 ? '#,##0' : '#,##0.00') : undefined);
  const cell = (v: Cell, c: RCol, bold = false) => {
    if (v === null || v === '') return null;
    const out: Record<string, unknown> = c.kind === 'date' && typeof v === 'string' ? { value: new Date(v), format: 'dd/mm/yyyy' } : { value: v };
    if (typeof v === 'number' && fmt(c)) out.format = fmt(c);
    if (bold) out.fontWeight = 'bold';
    return out;
  };
  const used = new Set<string>();
  const sheets = r.tables.map((t) => {
    let name = t.name.slice(0, 31); let i = 2;
    while (used.has(name)) name = `${t.name.slice(0, 28)} ${i++}`;
    used.add(name);
    const data = [
      [{ value: `${company} · ${r.title} · ${t.name}`, fontWeight: 'bold' }],
      [{ value: periodLabel(p) }],
      [],
      t.columns.map((c) => ({ value: c.label, fontWeight: 'bold', backgroundColor: '#E8EDF3' })),
      ...t.rows.map((row) => row.map((v, k) => cell(v, t.columns[k]))),
      ...(t.total ? [t.total.map((v, k) => cell(v, t.columns[k], true))] : []),
    ];
    return { sheet: name, data, columns: t.columns.map((c, k) => ({ width: k === 0 ? 30 : c.kind === 'text' || !c.kind ? 22 : 16 })) };
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await (writeExcelFile as any)(sheets).toBlob();
  download(blob, `${fileBase(r, p)}.xlsx`);
}

export function periodLabel(p: Period) {
  const f = (d: Date) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  return `Del ${f(p.from)} al ${f(new Date(p.to.getTime() - 1))}`;
}
