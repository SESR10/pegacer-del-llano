import { useState } from 'react';
import { LuAlertTriangle, LuFactory, LuMinusCircle, LuPencil, LuPlus, LuShoppingCart, LuTruck } from 'react-icons/lu';
import { useData } from '../services/store';
import { useAuth } from '../services/auth';
import type { Dispatch, Purchase, Supplier, Waste } from '../services/types';
import { Card, Chip, Kpi, PageHead, Table, type Column } from '../components/ui';
import DispatchForm from '../components/DispatchForm';
import WasteForm from '../components/WasteForm';
import PurchaseForm from '../components/PurchaseForm';
import SupplierForm from '../components/SupplierForm';
import { date, dateTime, money, num, unit } from '../utils/format';
import { can, capacity, productionByDay, recentBatches } from '../utils/metrics';
import InventarioPage from './InventarioPage';

export function ComprasPage() {
  const data = useData();
  const { user } = useAuth();
  const [form, setForm] = useState(false);
  const product = (id: number) => data.products.find((p) => p.id === id);
  const since = Date.now() - 30 * 86_400_000;
  const recent = data.purchases.filter((p) => new Date(p.at).getTime() >= since);
  const value = recent.reduce((s, p) => s + p.quantity * (p.unitCost ?? product(p.productId)?.unitCost ?? 0), 0);
  const columns: Column<Purchase>[] = [
    { key: 'product', label: 'Producto', primary: true, render: (p) => <span className="strong">{product(p.productId)?.name}</span> },
    { key: 'code', label: 'Orden', render: (p) => <span className="mono">{p.code}</span> },
    { key: 'at', label: 'Fecha', render: (p) => date(p.at) },
    { key: 'supplier', label: 'Proveedor', render: (p) => p.supplier },
    { key: 'qty', label: 'Cantidad', num: true, render: (p) => <>{num(p.quantity)} <span className="muted">{unit(product(p.productId)?.unit ?? '')}</span></> },
    { key: 'cost', label: 'Costo unitario', num: true, hideSm: true, render: (p) => (p.unitCost != null ? money(p.unitCost) : <span className="muted">—</span>) },
    { key: 'invoice', label: 'Factura', hideSm: true, render: (p) => p.invoice },
  ];
  return (
    <>
      <PageHead title="Compras" subtitle="Entradas de materia prima e insumos. Cada compra suma al inventario y queda en el kardex."
        actions={can(user?.role, 'compras') && <button type="button" className="btn-primary" onClick={() => setForm(true)}><LuShoppingCart /> Registrar compra</button>} />
      <PurchaseForm open={form} onClose={() => setForm(false)} />
      <div className="grid kpis small-kpis">
        <Kpi label="Compras (30 días)" value={new Set(recent.map((p) => p.code)).size} />
        <Kpi label="Valor (30 días)" value={value ? money(value) : '—'} sub="según costo registrado" />
        <Kpi label="Proveedores activos" value={data.suppliers.filter((s) => s.active !== false).length} />
      </div>
      <Card className="mt" flush><Table columns={columns} rows={data.purchases} rowKey={(p) => `${p.code}-${p.productId}`} empty="No hay compras registradas." pageSize={25} /></Card>
    </>
  );
}

export function ProveedoresPage() {
  const data = useData();
  const { user } = useAuth();
  const allowed = can(user?.role, 'compras');
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined);
  const [buyFrom, setBuyFrom] = useState<number | undefined>(undefined);
  const stats = (s: Supplier) => {
    const rows = data.purchases.filter((p) => (p.supplierId ?? -1) === s.id || p.supplier === s.name);
    const last = rows.reduce<string | null>((m, p) => (!m || p.at > m ? p.at : m), null);
    return { n: new Set(rows.map((p) => p.code)).size, last };
  };
  const columns: Column<Supplier>[] = [
    { key: 'name', label: 'Nombre', primary: true, render: (s) => <span className="strong">{s.name} {s.active === false && <Chip tone="neutral">Inactivo</Chip>}</span> },
    { key: 'nit', label: 'NIT', render: (s) => <span className="mono">{s.nit}</span> },
    { key: 'city', label: 'Ciudad', render: (s) => s.city },
    { key: 'phone', label: 'Teléfono', render: (s) => (s.phone && s.phone !== '—' ? <a href={`tel:${s.phone}`}>{s.phone}</a> : '—') },
    { key: 'n', label: 'Compras', num: true, render: (s) => stats(s).n },
    { key: 'last', label: 'Última compra', hideSm: true, render: (s) => { const l = stats(s).last; return l ? date(l) : '—'; } },
  ];
  if (allowed) {
    columns.push({ key: 'edit', label: '', width: 96, action: true, render: (s) => (
      <div className="row-actions">
        {s.active !== false && <button type="button" className="icon-btn sm" aria-label={`Comprar a ${s.name}`} title="Registrar compra"
          onClick={(e) => { e.stopPropagation(); setBuyFrom(s.id); }}><LuShoppingCart /></button>}
        <button type="button" className="icon-btn sm" aria-label={`Editar ${s.name}`} title="Editar"
          onClick={(e) => { e.stopPropagation(); setEditing(s); }}><LuPencil /></button>
      </div>
    ) });
  }
  return (
    <>
      <PageHead title="Proveedores" subtitle="Proveedores de cemento, arena, químicos y empaques."
        actions={allowed && <button type="button" className="btn-primary" onClick={() => setEditing(null)}><LuPlus /> Nuevo proveedor</button>} />
      <SupplierForm open={editing !== undefined} supplier={editing ?? null} onClose={() => setEditing(undefined)} />
      <PurchaseForm open={buyFrom !== undefined} supplierId={buyFrom} onClose={() => setBuyFrom(undefined)} />
      <Card flush><Table columns={columns} rows={data.suppliers} rowKey={(s) => s.id} empty="No hay proveedores registrados." /></Card>
    </>
  );
}

export function DesperdiciosPage() {
  const data = useData();
  const { user } = useAuth();
  const [form, setForm] = useState(false);
  const product = (id: number) => data.products.find((p) => p.id === id);
  const columns: Column<Waste & { i: number }>[] = [
    { key: 'product', label: 'Producto', primary: true, render: (w) => <span className="strong">{product(w.productId)?.name}</span> },
    { key: 'at', label: 'Fecha', render: (w) => date(w.at) },
    { key: 'qty', label: 'Cantidad', num: true, render: (w) => <>{num(w.quantity)} <span className="muted">{unit(product(w.productId)?.unit ?? '')}</span></> },
    { key: 'reason', label: 'Motivo', render: (w) => w.reason },
  ];
  return (
    <>
      <PageHead title="Desperdicios" subtitle="Material perdido por daños o defectos. Se descuenta del inventario."
        actions={can(user?.role, 'operaciones') && <button type="button" className="btn-primary" onClick={() => setForm(true)}><LuMinusCircle /> Registrar desperdicio</button>} />
      <WasteForm open={form} onClose={() => setForm(false)} />
      <Card flush><Table columns={columns} rows={data.waste.map((w, i) => ({ ...w, i }))} rowKey={(w) => w.i} empty="No hay desperdicios registrados." /></Card>
    </>
  );
}

export function ProductoTerminadoPage() {
  const data = useData();
  const { user } = useAuth();
  const [form, setForm] = useState(false);
  const sold = data.dispatches.reduce((s, d) => s + d.quantity, 0);
  const columns: Column<Dispatch>[] = [
    { key: 'customer', label: 'Cliente', primary: true, render: (d) => <span className="strong">{d.customer}</span> },
    { key: 'code', label: 'Despacho', render: (d) => <span className="mono">{d.code}</span> },
    { key: 'at', label: 'Fecha', render: (d) => dateTime(d.at) },
    { key: 'qty', label: 'Bolsas', num: true, render: (d) => num(d.quantity, 0) },
  ];
  return (
    <>
      <InventarioPage only={['PRODUCTO_TERMINADO']} title="Producto terminado" subtitle="Bolsas listas para despacho y sus salidas."
        actions={can(user?.role, 'operaciones') && <button type="button" className="btn-primary" onClick={() => setForm(true)}><LuTruck /> Registrar despacho</button>} />
      <DispatchForm open={form} onClose={() => setForm(false)} />
      <div className="grid kpis small-kpis mt">
        <Kpi label="Despachos" value={data.dispatches.length} />
        <Kpi label="Bolsas despachadas" value={num(sold, 0)} sub={`${num(sold * 25 / 1000, 1)} toneladas`} />
      </div>
      <Card className="mt" flush title="Últimos despachos">
        <Table columns={columns} rows={data.dispatches.slice(0, 15)} rowKey={(d) => `${d.code}-${d.productId}`} empty="No hay despachos registrados." />
      </Card>
    </>
  );
}

export function ProduccionPage() {
  const data = useData();
  const days = productionByDay(recentBatches(data, 30), 30);
  const weeks: { label: string; bags: number; batches: number }[] = [];
  days.forEach((d, i) => {
    const w = Math.floor(i / 7);
    if (!weeks[w]) weeks[w] = { label: `Semana del ${date(d.day.toISOString())}`, bags: 0, batches: 0 };
    weeks[w].bags += d.bags; weeks[w].batches += d.batches;
  });
  const total = days.reduce((s, d) => s + d.bags, 0);
  const caps = capacity(data);
  const columns: Column<(typeof weeks)[number]>[] = [
    { key: 'w', label: 'Semana', primary: true, render: (w) => <span className="strong">{w.label}</span> },
    { key: 'b', label: 'Cochadas', num: true, render: (w) => w.batches },
    { key: 'bags', label: 'Bolsas', num: true, render: (w) => num(w.bags, 0) },
    { key: 'avg', label: 'Promedio', num: true, render: (w) => (w.batches ? num(w.bags / w.batches, 1) : '—') },
  ];
  return (
    <>
      <PageHead title="Producción" subtitle="Bolsas de pegante obtenidas de las cochadas en los últimos 30 días." />
      <div className="grid kpis small-kpis">
        <Kpi label="Bolsas" value={num(total, 0)} />
        <Kpi label="Toneladas" value={num(total * 25 / 1000, 1)} />
        <Kpi label="Días con producción" value={days.filter((d) => d.bags).length} />
        <Kpi label="Mejor día" value={num(Math.max(...days.map((d) => d.bags)), 0)} sub="bolsas" />
      </div>
      {caps.map((c) => (
        <Card key={c.formula.id} className="mt capacity" title={<><LuFactory /> ¿Cuántas cochadas puedo fabricar?</>}
          extra={<span className="muted small">{c.formula.name}</span>}>
          <div className="capacity-head">
            <div><span className="capacity-n mono">{num(c.batches, 0)}</span><span className="muted">cochadas completas</span></div>
            <div><span className="capacity-n mono">{num(c.estimatedBags, 0)}</span><span className="muted">bolsas estimadas ({num(c.estimatedBags * c.formula.bagWeightKg / 1000, 1)} t)</span></div>
            {c.limiting && (
              <div className="capacity-limit">
                <Chip tone={c.batches === 0 ? 'bad' : c.batches < 5 ? 'warn' : 'info'}><LuAlertTriangle /> Limita: {c.limiting.name}</Chip>
                <span className="muted small">Con más {c.limiting.name.toLowerCase()} se podría producir más.</span>
              </div>
            )}
          </div>
          <div className="capacity-list">
            {c.materials.map((m) => {
              const max = Math.max(...c.materials.map((x) => (Number.isFinite(x.batches) ? x.batches : 0)), 1);
              return (
                <div key={m.productId} className={`capacity-row ${m.limiting ? 'limiting' : ''}`}>
                  <div className="capacity-name"><strong>{m.name}</strong><span className="muted small">{num(m.stock, 2)} {unit(m.unit)} en bodega · {num(m.perBatch, 3)} por cochada</span></div>
                  <div className="capacity-bar"><span style={{ width: `${Math.min(100, (m.batches / max) * 100)}%` }} /></div>
                  <div className="capacity-val mono">{num(m.batches, 0)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      <Card className="mt" flush title="Por semana"><Table columns={columns} rows={weeks} rowKey={(w) => w.label} /></Card>
    </>
  );
}

export const ProductosPage = () => <InventarioPage catalog title="Productos" subtitle="Catálogo de materias primas, insumos y productos terminados. Cree, edite o elimine productos aquí." />;
export const MateriasPrimasPage = () => <InventarioPage only={['MATERIA_PRIMA', 'INSUMO']} title="Materias primas" subtitle="Cemento, arena, químicos y empaques disponibles." />;
