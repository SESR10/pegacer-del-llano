import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuFactory, LuPackageCheck, LuTrendingUp, LuBell, LuServer, LuAlertTriangle, LuAlertCircle } from 'react-icons/lu';
import { data, DEMO_ONLY, fetchHealth } from '../services/data';
import type { Health } from '../services/types';
import { Chip, Kpi, PageHead, StockBar } from '../components/ui';
import ProductionChart from '../components/ProductionChart';
import { num, unit, dateTime } from '../utils/format';
import { formula, productionByDay, stockStatus } from '../utils/metrics';
import { PHASES } from '../layouts/nav';

export default function DashboardPage() {
  const [health, setHealth] = useState<Health | null | undefined>(undefined);
  useEffect(() => { fetchHealth().then(setHealth); }, []);

  const days = productionByDay(30);
  const bags = data.batches.reduce((s, b) => s + b.bags, 0);
  const batches = data.batches.length;
  const avg = batches ? bags / batches : 0;
  const finished = data.products.filter((p) => p.category === 'PRODUCTO_TERMINADO');
  const finishedStock = finished.reduce((s, p) => s + p.stock, 0);
  const materials = data.products.filter((p) => p.category !== 'PRODUCTO_TERMINADO');
  const done = PHASES.filter((p) => p.status === 'hecha').length;

  return (
    <>
      <PageHead
        title="Resumen de la planta"
        subtitle="Producción, inventario y alertas de los últimos 30 días."
        actions={<span className="kpi-sub"><LuServer style={{ verticalAlign: -2 }} />{' '}
          {health ? `Servidor en línea · esquema V${health.schemaVersion}` : DEMO_ONLY || health === null ? 'Modo demostración' : 'Conectando…'}</span>}
      />

      <div className="grid kpis">
        <Kpi icon={<LuPackageCheck />} label="Bolsas producidas" value={num(bags, 0)} sub={`${num(bags * (formula?.bagWeightKg ?? 25) / 1000, 1)} toneladas en 30 días`} />
        <Kpi icon={<LuFactory />} label="Cochadas" value={batches} sub={`${num(batches / new Set(data.batches.map((b) => b.producedAt.slice(0, 10))).size, 1)} por día con producción`} />
        <Kpi icon={<LuTrendingUp />} label="Rendimiento promedio" value={`${num(avg, 1)}`}
             sub={`bolsas por cochada (meta ${formula?.minBags}–${formula?.maxBags})`} />
        <Kpi icon={<LuBell />} label="Alertas activas" value={data.alerts.length}
             sub={`${data.alerts.filter((a) => a.severity === 'ALTA').length} de prioridad alta`} />
      </div>

      <div className="grid two mt">
        <div className="card">
          <h3>Producción diaria <span className="kpi-sub">bolsas por día</span></h3>
          <ProductionChart days={days} min={formula?.minBags ?? 45} />
        </div>
        <div className="card">
          <h3>Stock de materias primas e insumos <Link to="/inventario" className="kpi-sub">Ver inventario</Link></h3>
          {materials.map((p) => (
            <div className="stock-row" key={p.id}>
              <div className="stock-name">{p.name}</div>
              <StockBar stock={p.stock} min={p.minStock} />
              <div className="stock-val">{num(p.stock)} {unit(p.unit)}</div>
            </div>
          ))}
          <div className="legend"><span><i style={{ background: 'var(--green)' }} />Normal</span><span><i style={{ background: 'var(--amber)' }} />Bajo el mínimo</span><span><i style={{ background: 'var(--ink)', width: 2 }} />Stock mínimo</span></div>
        </div>
      </div>

      <div className="grid two mt">
        <div className="card">
          <h3>Alertas recientes <Link to="/alertas" className="kpi-sub">Ver todas</Link></h3>
          {data.alerts.slice(0, 5).map((a) => (
            <div className="alert-item" key={a.id}>
              <div className={`alert-icon ${a.severity}`}>{a.severity === 'ALTA' ? <LuAlertTriangle /> : <LuAlertCircle />}</div>
              <div><div className="alert-msg">{a.message}</div><div className="alert-meta">{dateTime(a.at)}</div></div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Producto terminado</h3>
          <div className="kpi-value">{num(finishedStock, 0)} <span className="kpi-sub">bolsas en bodega</span></div>
          {finished.map((p) => (
            <div className="stock-row" key={p.id}>
              <div className="stock-name">{p.name.replace('Pegante para enchape ', 'Pegante ')}</div>
              <StockBar stock={p.stock} min={p.minStock} />
              <div className="stock-val">{stockStatus(p) === 'AGOTADO' ? <Chip tone="bad">Agotado</Chip> : `${num(p.stock, 0)} bolsas`}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt">
        <h3>Avance del desarrollo <Chip tone="info">{done} de {PHASES.length} fases terminadas</Chip></h3>
        <div className="phases">
          {PHASES.map((p) => (
            <div className="phase" key={p.n}>
              <span className="n">{String(p.n).padStart(2, '0')}</span>
              <span className="t">{p.title}</span>
              <Chip tone={p.status === 'hecha' ? 'ok' : p.status === 'en curso' ? 'info' : 'neutral'}>{p.status}</Chip>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
