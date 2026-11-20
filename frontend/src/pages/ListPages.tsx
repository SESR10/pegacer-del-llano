import { data, productById } from '../services/data';
import { Kpi, PageHead } from '../components/ui';
import { date, dateTime, num, unit } from '../utils/format';
import { productionByDay } from '../utils/metrics';
import InventarioPage from './InventarioPage';

export function ComprasPage() {
  return (
    <>
      <PageHead title="Compras" subtitle="Entradas de materia prima e insumos. Cada compra suma al inventario y queda en el kardex." />
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Orden</th><th>Fecha</th><th>Proveedor</th><th>Producto</th><th className="num">Cantidad</th><th className="hide-sm">Factura</th></tr></thead>
        <tbody>{data.purchases.map((p) => {
          const pr = productById(p.productId);
          return <tr key={p.code}><td style={{ fontFamily: 'var(--mono)' }}>{p.code}</td><td>{date(p.at)}</td><td>{p.supplier}</td><td>{pr?.name}</td><td className="num">{num(p.quantity)} <span className="kpi-sub">{unit(pr?.unit ?? '')}</span></td><td className="hide-sm">{p.invoice}</td></tr>;
        })}</tbody>
      </table></div></div>
    </>
  );
}

export function ProveedoresPage() {
  return (
    <>
      <PageHead title="Proveedores" subtitle="Proveedores de cemento, arena, químicos y empaques." />
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>NIT</th><th>Nombre</th><th>Ciudad</th><th className="hide-sm">Teléfono</th><th className="num">Compras</th></tr></thead>
        <tbody>{data.suppliers.map((s) => (
          <tr key={s.nit}><td style={{ fontFamily: 'var(--mono)' }}>{s.nit}</td><td>{s.name}</td><td>{s.city}</td><td className="hide-sm">{s.phone}</td>
            <td className="num">{data.purchases.filter((p) => p.supplier === s.name).length}</td></tr>
        ))}</tbody>
      </table></div></div>
    </>
  );
}

export function DesperdiciosPage() {
  return (
    <>
      <PageHead title="Desperdicios" subtitle="Material perdido por daños o defectos. Se descuenta del inventario." />
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Producto</th><th className="num">Cantidad</th><th>Motivo</th></tr></thead>
        <tbody>{data.waste.map((w, i) => {
          const p = productById(w.productId);
          return <tr key={i}><td>{date(w.at)}</td><td>{p?.name}</td><td className="num">{num(w.quantity)} <span className="kpi-sub">{unit(p?.unit ?? '')}</span></td><td>{w.reason}</td></tr>;
        })}</tbody>
      </table></div></div>
    </>
  );
}

export function ProductoTerminadoPage() {
  const sold = data.dispatches.reduce((s, d) => s + d.quantity, 0);
  return (
    <>
      <InventarioPage only={['PRODUCTO_TERMINADO']} title="Producto terminado" subtitle="Bolsas listas para despacho y sus salidas." />
      <div className="grid kpis mt">
        <Kpi label="Despachos (30 días)" value={data.dispatches.length} />
        <Kpi label="Bolsas despachadas" value={num(sold, 0)} sub={`${num(sold * 25 / 1000, 1)} toneladas`} />
      </div>
      <div className="card mt"><h3>Últimos despachos</h3><div className="table-wrap"><table>
        <thead><tr><th>Despacho</th><th>Fecha</th><th>Cliente</th><th className="num">Bolsas</th></tr></thead>
        <tbody>{data.dispatches.slice(0, 15).map((d) => (
          <tr key={d.code}><td style={{ fontFamily: 'var(--mono)' }}>{d.code}</td><td>{dateTime(d.at)}</td><td>{d.customer}</td><td className="num">{num(d.quantity, 0)}</td></tr>
        ))}</tbody>
      </table></div></div>
    </>
  );
}

export function ProduccionPage() {
  const days = productionByDay(30);
  const weeks: { label: string; bags: number; batches: number }[] = [];
  days.forEach((d, i) => {
    const w = Math.floor(i / 7);
    if (!weeks[w]) weeks[w] = { label: `Semana del ${date(d.day.toISOString())}`, bags: 0, batches: 0 };
    weeks[w].bags += d.bags; weeks[w].batches += d.batches;
  });
  const total = days.reduce((s, d) => s + d.bags, 0);
  return (
    <>
      <PageHead title="Producción" subtitle="Bolsas de pegante obtenidas de las cochadas." />
      <div className="grid kpis">
        <Kpi label="Bolsas (30 días)" value={num(total, 0)} />
        <Kpi label="Toneladas" value={num(total * 25 / 1000, 1)} />
        <Kpi label="Días con producción" value={days.filter((d) => d.bags).length} />
        <Kpi label="Mejor día" value={num(Math.max(...days.map((d) => d.bags)), 0)} sub="bolsas" />
      </div>
      <div className="card mt"><h3>Por semana</h3><div className="table-wrap"><table>
        <thead><tr><th>Semana</th><th className="num">Cochadas</th><th className="num">Bolsas</th><th className="num">Promedio</th></tr></thead>
        <tbody>{weeks.map((w) => (
          <tr key={w.label}><td>{w.label}</td><td className="num">{w.batches}</td><td className="num">{num(w.bags, 0)}</td><td className="num">{w.batches ? num(w.bags / w.batches, 1) : '—'}</td></tr>
        ))}</tbody>
      </table></div></div>
    </>
  );
}

export const ProductosPage = () => <InventarioPage title="Productos" subtitle="Catálogo de materias primas, insumos y productos terminados." />;
export const MateriasPrimasPage = () => <InventarioPage only={['MATERIA_PRIMA', 'INSUMO']} title="Materias primas" subtitle="Cemento, arena, químicos y empaques disponibles." />;
