import { useEffect, useState } from 'react';
import { LuAlertCircle, LuAlertTriangle, LuCheck, LuCheckCheck, LuHourglass } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { useAuth } from '../services/auth';
import type { Alert } from '../services/types';
import { Card, Chip, Empty, PageHead, Segmented, Spinner, useToast } from '../components/ui';
import { dateTime, num, unit } from '../utils/format';
import { can, coverage } from '../utils/metrics';

const TYPE_LABEL: Record<string, string> = {
  STOCK_CRITICO: 'Stock crítico', AGOTADO: 'Agotado', CONSUMO_FUERA_RANGO: 'Consumo fuera de rango', PRODUCCION_BAJA: 'Producción baja',
};
type View = 'activas' | 'atendidas';
type Sev = 'todas' | 'ALTA' | 'MEDIA';

/** Alertas (Fase 13): activas con filtros y atención en bloque, historial de atendidas y pronóstico de agotamiento. */
export default function AlertasPage() {
  const data = useData();
  const { resolveAlerts, resolvedAlerts } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const [view, setView] = useState<View>('activas');
  const [sev, setSev] = useState<Sev>('todas');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState<number | 'all' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Alert[] | null>(null);
  const allowed = can(user?.role, 'alertas');

  useEffect(() => {
    if (view !== 'atendidas') return;
    setHistory(null);
    resolvedAlerts().then(setHistory).catch((e) => { setError((e as Error).message); setHistory([]); });
  }, [view, resolvedAlerts, data.alerts.length]);

  const source = view === 'activas' ? data.alerts : history ?? [];
  const rows = source.filter((a) => (sev === 'todas' || a.severity === sev) && (!type || a.type === type));
  const types = Array.from(new Set(source.map((a) => a.type)));
  const soon = coverage(data).slice(0, 4);
  // Si se atendieron todas las de un tipo, el filtro vuelve a "Todos los tipos".
  useEffect(() => { if (type && !types.includes(type)) setType(''); }, [type, types]);

  async function resolve(ids: number[], key: number | 'all') {
    setBusy(key); setError(null);
    try {
      const n = await resolveAlerts(ids);
      toast(n === 1 ? 'Alerta marcada como atendida.' : `${n} alertas marcadas como atendidas.`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  }

  return (
    <>
      <PageHead title="Alertas" subtitle="Se generan solas a partir del inventario y de cada cochada. Márquelas como atendidas cuando se resuelvan." />

      {soon.length > 0 && (
        <Card className="forecast" title={<><LuHourglass /> ¿Para cuántos días alcanza?</>} extra={<span className="muted small">al ritmo de los últimos 30 días</span>}>
          <div className="forecast-list">
            {soon.map((c) => (
              <div key={c.product.id} className={`forecast-item ${c.days < 7 ? 'bad' : c.days < 15 ? 'warn' : 'ok'}`}>
                <strong>{c.product.name}</strong>
                <span className="forecast-days mono">{c.days < 1 ? 'Hoy' : `${num(Math.floor(c.days), 0)} ${Math.floor(c.days) === 1 ? 'día' : 'días'}`}</span>
                <span className="muted small">Quedan {num(c.product.stock, 2)} {unit(c.product.unit)} · se usan {num(c.daily, 2)} al día</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className={`toolbar ${soon.length ? 'mt' : ''}`}>
        <Segmented value={view} onChange={(v) => { setView(v); setType(''); }} options={[
          { value: 'activas', label: 'Activas', count: data.alerts.length },
          { value: 'atendidas', label: 'Atendidas' },
        ]} />
        <Segmented value={sev} onChange={setSev} options={[
          { value: 'todas', label: 'Todas' },
          { value: 'ALTA', label: 'Alta', count: source.filter((a) => a.severity === 'ALTA').length },
          { value: 'MEDIA', label: 'Media', count: source.filter((a) => a.severity === 'MEDIA').length },
        ]} />
        <select className="toolbar-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipo de alerta">
          <option value="">Todos los tipos</option>
          {types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
        </select>
        {view === 'activas' && allowed && rows.length > 1 && (
          <button type="button" className="btn toolbar-end" disabled={busy !== null} onClick={() => resolve(rows.map((a) => a.id), 'all')}>
            <LuCheckCheck /> {busy === 'all' ? 'Guardando…' : `Atender ${rows.length === source.length ? 'todas' : 'las filtradas'} (${rows.length})`}
          </button>
        )}
      </div>
      {error && <div className="form-error mt-sm">{error}</div>}
      <Card flush className="mt-sm">
        {view === 'atendidas' && history === null ? <Spinner label="Cargando historial…" /> : rows.length ? (
          <ul className="list">
            {rows.map((a) => (
              <li key={a.id} className={`alert-li ${view === 'atendidas' ? 'done' : ''}`}>
                <div className={`alert-icon ${view === 'atendidas' ? 'OK' : a.severity}`}>
                  {view === 'atendidas' ? <LuCheck /> : a.severity === 'ALTA' ? <LuAlertTriangle /> : <LuAlertCircle />}
                </div>
                <div className="grow">
                  <div className="alert-msg">{a.message}</div>
                  <div className="muted small">
                    {TYPE_LABEL[a.type] ?? a.type}{a.batchCode ? ` · Cochada ${a.batchCode}` : ''} · {dateTime(a.at)}
                    {view === 'atendidas' && a.resolvedAt && <> · Atendida {dateTime(a.resolvedAt)} {a.resolvedBy ? `por ${a.resolvedBy}` : '(se cerró sola al reponer el stock)'}</>}
                  </div>
                </div>
                <div className="alert-actions">
                  <Chip tone={view === 'atendidas' ? 'neutral' : a.severity === 'ALTA' ? 'bad' : 'warn'}>{a.severity === 'ALTA' ? 'Alta' : a.severity === 'MEDIA' ? 'Media' : 'Info'}</Chip>
                  {view === 'activas' && allowed && (
                    <button type="button" className="btn small" disabled={busy !== null} onClick={() => resolve([a.id], a.id)}>
                      <LuCheck /> {busy === a.id ? 'Guardando…' : 'Atendida'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>{view === 'activas' ? 'No hay alertas activas. Todo en orden.' : 'Todavía no hay alertas atendidas.'}</Empty>}
      </Card>
    </>
  );
}
