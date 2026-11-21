import { useData } from '../services/store';
import type { Dispatch, Purchase, Supplier, Waste } from '../services/types';
import { Card, Kpi, PageHead, Table, type Column } from '../components/ui';
import { date, dateTime, num, unit } from '../utils/format';
import { productionByDay, recentBatches } from '../utils/metrics';
import InventarioPage from './InventarioPage';

export function ComprasPage() {
  const data = useData();
  const product = (id: number) => data.products.find((p) => p.id === id);
  const columns: Column<Purchase>[] = [
    { key: 'product', label: 'Producto', primary: true, render: (p) => <span className="strong">{product(p.productId)?.name}</span> },
    { key: 'code', label: 'Orden', render: (p) => <span className="mono">{p.code}</span> },
    { key: 'at', label: 'Fecha', render: (p) => date(p.at) },
    { key: 'supplier', label: 'Proveedor', render: (p) => p.supplier },
    { key: 'qty', label: 'Cantidad', num: true, render: (p) => <>{num(p.quantity)} <span className="muted">{unit(product(p.productId)?.unit ?? '')}</span></> },
    { key: 'invoice', label: 'Factura', hideSm: true, render: (p) => p.invoice },
  ];
  return (
    <>
      <PageHead title="Compras" subtitle="Entradas de materia prima e insumos. Cada compra suma al inventario y queda en el kardex." />
      <div className="notice">El formulario para registrar compras llega en la Fase 12.</div>
      <Card flush><Table columns={columns} rows={data.purchases} rowKey={(p) => `${p.code}-${p.productId}`} empty="No hay compras registradas." /></Card>
    </>
  );
}

export function ProveedoresPage() {
  const data = useData();
  const columns: Column<Supplier>[] = [
    { key: 'name', label: 'Nombre', primary: true, render: (s) => <span className="strong">{s.name}</span> },
    { key: 'nit', label: 'NIT', render: (s) => <span className="mono">{s.nit}</span> },
    { key: 'city', label: 'Ciudad', render: (s) => s.city },
    { key: 'phone', label: 'Teléfono', render: (s) => s.phone },
    { key: 'n', label: 'Compras', num: true, render: (s) => data.purchases.filter((p) => p.supplier === s.name).length },
  ];
  return (
    <>
      <PageHead title="Proveedores" subtitle="Proveedores de cemento, arena, químicos y empaques." />
      <Card flush><Table columns={columns} rows={data.suppliers} rowKey={(s) => s.nit} empty="No hay proveedores registrados." /></Card>
    </>
  );
}

export function DesperdiciosPage() {
  const data = useData();
  const product = (id: number) => data.products.find((p) => p.id === id);
  const columns: Column<Waste & { i: number }>[] = [
    { key: 'product', label: 'Producto', primary: true, render: (w) => <span className="strong">{product(w.productId)?.name}</span> },
    { key: 'at', label: 'Fecha', render: (w) => date(w.at) },
    { key: 'qty', label: 'Cantidad', num: true, render: (w) => <>{num(w.quantity)} <span className="muted">{unit(product(w.productId)?.unit ?? '')}</span></> },
    { key: 'reason', label: 'Motivo', render: (w) => w.reason },
  ];
  return (
    <>
      <PageHead title="Desperdicios" subtitle="Material perdido por daños o defectos. Se descuenta del inventario." />
      <Card flush><Table columns={columns} rows={data.waste.map((w, i) => ({ ...w, i }))} rowKey={(w) => w.i} empty="No hay desperdicios registrados." /></Card>
    </>
  );
}

export function ProductoTerminadoPage() {
  const data = useData();
  const sold = data.dispatches.reduce((s, d) => s + d.quantity, 0);
  const columns: Column<Dispatch>[] = [
    { key: 'customer', label: 'Cliente', primary: true, render: (d) => <span className="strong">{d.customer}</span> },
    { key: 'code', label: 'Despacho', render: (d) => <span className="mono">{d.code}</span> },
    { key: 'at', label: 'Fecha', render: (d) => dateTime(d.at) },
    { key: 'qty', label: 'Bolsas', num: true, render: (d) => num(d.quantity, 0) },
  ];
  return (
    <>
      <InventarioPage only={['PRODUCTO_TERMINADO']} title="Producto terminado" subtitle="Bolsas listas para despacho y sus salidas." />
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
      <Card className="mt" flush title="Por semana"><Table columns={columns} rows={weeks} rowKey={(w) => w.label} /></Card>
    </>
  );
}

export const ProductosPage = () => <InventarioPage title="Productos" subtitle="Catálogo de materias primas, insumos y productos terminados." />;
export const MateriasPrimasPage = () => <InventarioPage only={['MATERIA_PRIMA', 'INSUMO']} title="Materias primas" subtitle="Cemento, arena, químicos y empaques disponibles." />;
