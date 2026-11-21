import { useState } from 'react';
import { LuAlertTriangle, LuAlertCircle, LuCheck } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { useAuth } from '../services/auth';
import { Card, Chip, Empty, PageHead, Segmented, useToast } from '../components/ui';
import { dateTime } from '../utils/format';
import { can } from '../utils/metrics';

const TYPE_LABEL: Record<string, string> = {
  STOCK_CRITICO: 'Stock crítico', AGOTADO: 'Agotado', CONSUMO_FUERA_RANGO: 'Consumo fuera de rango', PRODUCCION_BAJA: 'Producción baja',
};

export default function AlertasPage() {
  const data = useData();
  const { resolveAlert } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const [sev, setSev] = useState<'todas' | 'ALTA' | 'MEDIA'>('todas');
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = data.alerts.filter((a) => sev === 'todas' || a.severity === sev);
  const allowed = can(user?.role, 'alertas');

  async function resolve(id: number) {
    setBusy(id); setError(null);
    try { await resolveAlert(id); toast('Alerta marcada como atendida.'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  }

  return (
    <>
      <PageHead title="Alertas" subtitle="Se generan solas a partir del inventario y de cada cochada. Márquelas como atendidas cuando se resuelvan." />
      <div className="toolbar">
        <Segmented value={sev} onChange={setSev} options={[
          { value: 'todas', label: 'Todas', count: data.alerts.length },
          { value: 'ALTA', label: 'Alta', count: data.alerts.filter((a) => a.severity === 'ALTA').length },
          { value: 'MEDIA', label: 'Media', count: data.alerts.filter((a) => a.severity === 'MEDIA').length },
        ]} />
      </div>
      {error && <div className="form-error mt-sm">{error}</div>}
      <Card flush className="mt-sm">
        {rows.length ? (
          <ul className="list">
            {rows.map((a) => (
              <li key={a.id} className="alert-li">
                <div className={`alert-icon ${a.severity}`}>{a.severity === 'ALTA' ? <LuAlertTriangle /> : <LuAlertCircle />}</div>
                <div className="grow">
                  <div className="alert-msg">{a.message}</div>
                  <div className="muted small">{TYPE_LABEL[a.type] ?? a.type} · {dateTime(a.at)}</div>
                </div>
                <div className="alert-actions">
                  <Chip tone={a.severity === 'ALTA' ? 'bad' : 'warn'}>{a.severity === 'ALTA' ? 'Alta' : 'Media'}</Chip>
                  {allowed && (
                    <button type="button" className="btn small" disabled={busy === a.id} onClick={() => resolve(a.id)}>
                      <LuCheck /> {busy === a.id ? 'Guardando…' : 'Atendida'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>No hay alertas activas.</Empty>}
      </Card>
    </>
  );
}
