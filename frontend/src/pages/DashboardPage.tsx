import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuFactory, LuPackageCheck, LuTrendingUp, LuBell, LuAlertTriangle, LuAlertCircle, LuArrowRight, LuShoppingCart, LuTruck, LuMinusCircle, LuSlidersHorizontal, LuFileBarChart, LuWarehouse } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { useData } from '../services/store';
import { useAuth } from '../services/auth';
import { Card, Chip, Empty, Kpi, PageHead, StockBar } from '../components/ui';
import ProductionChart from '../components/ProductionChart';
import BatchForm from '../components/BatchForm';
import PurchaseForm from '../components/PurchaseForm';
import DispatchForm from '../components/DispatchForm';
import WasteForm from '../components/WasteForm';
import AdjustForm from '../components/AdjustForm';
import { num, unit, dateTime } from '../utils/format';
import { activeFormula, batchStatus, can, formulaOf, productionByDay, recentBatches, stockStatus, toleranceOf } from '../utils/metrics';

type FormKind = 'cochada' | 'compra' | 'despacho' | 'desperdicio' | 'ajuste';
type Tone = 'info' | 'ok' | 'warn' | 'bad' | 'neutral';

/** Lo que se registra en el día a día. Cada persona ve solo lo que su cargo puede hacer. */
const ACTIONS: { kind: FormKind; title: string; hint: string; icon: IconType; tone: Tone; permission: Parameters<typeof can>[1] }[] = [
  { kind: 'cochada', title: 'Registrar cochada', hint: 'Una mezcla terminada y lo que gastó', icon: LuFactory, tone: 'warn', permission: 'cochadas' },
  { kind: 'despacho', title: 'Despachar bolsas', hint: 'Bolsas que salen para un cliente', icon: LuTruck, tone: 'info', permission: 'operaciones' },
  { kind: 'compra', title: 'Registrar compra', hint: 'Material que llegó del proveedor', icon: LuShoppingCart, tone: 'ok', permission: 'compras' },
  { kind: 'desperdicio', title: 'Registrar desperdicio', hint: 'Material dañado o perdido', icon: LuMinusCircle, tone: 'bad', permission: 'operaciones' },
  { kind: 'ajuste', title: 'Corregir inventario', hint: 'Cuando el conteo no cuadra', icon: LuSlidersHorizontal, tone: 'neutral', permission: 'inventario' },
];

/** Para quien solo consulta (Gerencia). */
const CONSULT: { to: string; title: string; hint: string; icon: IconType; tone: Tone }[] = [
  { to: '/reportes', title: 'Ver reportes', hint: 'Producción, costos e inventario', icon: LuFileBarChart, tone: 'info' },
  { to: '/inventario', title: 'Ver inventario', hint: 'Cuánto hay de cada material', icon: LuWarehouse, tone: 'ok' },
  { to: '/alertas', title: 'Ver alertas', hint: 'Lo que necesita atención', icon: LuBell, tone: 'bad' },
];

export default function DashboardPage() {
  const data = useData();
  const { user } = useAuth();
  const [form, setForm] = useState<FormKind | null>(null);
  const role = user?.role;
  const actions = ACTIONS.filter((a) => can(role, a.permission));

  const batches = recentBatches(data, 30);
  const days = productionByDay(batches, 30);
  const formula = activeFormula(data);
  const tolerance = toleranceOf(data);
  const bags = batches.reduce((s, b) => s + b.bags, 0);
  const avg = batches.length ? bags / batches.length : 0;
  const workDays = new Set(batches.map((b) => new Date(b.producedAt).toDateString())).size;
  const finished = data.products.filter((p) => p.category === 'PRODUCTO_TERMINADO');
  const finishedStock = finished.reduce((s, p) => s + p.stock, 0);
  const materials = data.products.filter((p) => p.category !== 'PRODUCTO_TERMINADO');
  const high = data.alerts.filter((a) => a.severity === 'ALTA').length;
  const inTarget = formula && avg >= formula.minBags;

  return (
    <>
      <PageHead title={actions.length ? '¿Qué va a hacer hoy?' : '¿Qué quiere revisar hoy?'}
        subtitle={`Toque una opción para ${actions.length ? 'registrarla' : 'abrirla'}. Abajo está el resumen de la planta.`} />

      <div className="quick-actions">
        {actions.length ? actions.map((a) => (
          <button key={a.kind} type="button" className="quick-action" onClick={() => setForm(a.kind)}>
            <span className={`quick-icon ${a.tone}`}><a.icon /></span>
            <span className="quick-text"><strong>{a.title}</strong><span>{a.hint}</span></span>
          </button>
        )) : CONSULT.map((a) => (
          <Link key={a.to} to={a.to} className="quick-action">
            <span className={`quick-icon ${a.tone}`}><a.icon /></span>
            <span className="quick-text"><strong>{a.title}</strong><span>{a.hint}</span></span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Resumen de los últimos 30 días</h2>

      <div className="grid kpis">
        <Kpi icon={<LuPackageCheck />} tone="info" label="Bolsas producidas" value={num(bags, 0)}
             sub={`${num(bags * (formula?.bagWeightKg ?? 25) / 1000, 1)} toneladas`} />
        <Kpi icon={<LuFactory />} tone="neutral" label="Cochadas" value={batches.length}
             sub={workDays ? `${num(batches.length / workDays, 1)} por día trabajado` : 'Sin producción'} />
        <Kpi icon={<LuTrendingUp />} tone={inTarget ? 'ok' : 'warn'} label="Rendimiento promedio" value={num(avg, 1)}
             sub={`bolsas por cochada · meta ${formula?.minBags ?? '—'}–${formula?.maxBags ?? '—'}`} />
        <Kpi icon={<LuBell />} tone={high ? 'bad' : 'ok'} label="Alertas activas" value={data.alerts.length}
             sub={high ? `${high} de prioridad alta` : 'Ninguna urgente'} />
      </div>

      <div className="grid two mt">
        <Card title="Producción diaria" extra={<span className="muted">bolsas por día</span>}>
          <ProductionChart days={days} min={formula?.minBags ?? 45} />
        </Card>
        <Card title="Materias primas e insumos" extra={<Link to="/inventario" className="link">Inventario <LuArrowRight /></Link>}>
          {materials.map((p) => (
            <div className="stock-row" key={p.id}>
              <div className="stock-name">{p.name}</div>
              <StockBar stock={p.stock} min={p.minStock} />
              <div className="stock-val">{num(p.stock)} <span className="muted">{unit(p.unit)}</span></div>
            </div>
          ))}
          <div className="legend"><span><i style={{ background: 'var(--green)' }} />Normal</span><span><i style={{ background: 'var(--amber)' }} />Bajo el mínimo</span><span><i style={{ background: 'var(--ink)', width: 2 }} />Stock mínimo</span></div>
        </Card>
      </div>

      <div className="grid three mt">
        <Card title="Últimas cochadas" extra={<Link to="/cochadas" className="link">Ver todas <LuArrowRight /></Link>} flush>
          {data.batches.length ? (
            <ul className="list">
              {data.batches.slice(0, 5).map((b) => {
                const s = batchStatus(b, formulaOf(data, b), tolerance);
                return (
                  <li key={b.id}>
                    <div><strong className="mono">{b.code}</strong><span className="muted">{dateTime(b.producedAt)}</span></div>
                    <div className="list-end"><span className="mono">{num(b.bags, 0)} bolsas</span><Chip tone={s.tone}>{s.label}</Chip></div>
                  </li>
                );
              })}
            </ul>
          ) : <Empty>Todavía no hay cochadas registradas.</Empty>}
        </Card>
        <Card title="Alertas recientes" extra={<Link to="/alertas" className="link">Ver todas <LuArrowRight /></Link>} flush>
          {data.alerts.length ? (
            <ul className="list">
              {data.alerts.slice(0, 5).map((a) => (
                <li key={a.id} className="alert-li">
                  <div className={`alert-icon ${a.severity}`}>{a.severity === 'ALTA' ? <LuAlertTriangle /> : <LuAlertCircle />}</div>
                  <div className="grow"><div className="alert-msg">{a.message}</div><div className="muted small">{dateTime(a.at)}</div></div>
                </li>
              ))}
            </ul>
          ) : <Empty>Sin alertas activas.</Empty>}
        </Card>
        <Card title="Producto terminado" extra={<Link to="/producto-terminado" className="link">Bodega <LuArrowRight /></Link>}>
          <div className="big-number">{num(finishedStock, 0)} <span>bolsas en bodega</span></div>
          {finished.map((p) => (
            <div className="stock-row compact" key={p.id}>
              <div className="stock-name">{p.name.replace('Pegante para enchape ', 'Pegante ')}</div>
              <StockBar stock={p.stock} min={p.minStock} />
              <div className="stock-val">{stockStatus(p) === 'AGOTADO' ? <Chip tone="bad">Agotado</Chip> : `${num(p.stock, 0)}`}</div>
            </div>
          ))}
        </Card>
      </div>

      <BatchForm open={form === 'cochada'} onClose={() => setForm(null)} />
      <PurchaseForm open={form === 'compra'} onClose={() => setForm(null)} />
      <DispatchForm open={form === 'despacho'} onClose={() => setForm(null)} />
      <WasteForm open={form === 'desperdicio'} onClose={() => setForm(null)} />
      <AdjustForm open={form === 'ajuste'} onClose={() => setForm(null)} />
    </>
  );
}
