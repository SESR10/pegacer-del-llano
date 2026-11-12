import { LuAlertTriangle, LuAlertCircle } from 'react-icons/lu';
import { data } from '../services/data';
import { Chip, PageHead } from '../components/ui';
import { dateTime } from '../utils/format';

const TYPE_LABEL: Record<string, string> = {
  STOCK_CRITICO: 'Stock crítico', AGOTADO: 'Agotado', CONSUMO_FUERA_RANGO: 'Consumo fuera de rango', PRODUCCION_BAJA: 'Producción baja',
};

export default function AlertasPage() {
  return (
    <>
      <PageHead title="Alertas" subtitle="Generadas automáticamente a partir del inventario y de cada cochada." />
      <div className="card">
        {data.alerts.map((a) => (
          <div className="alert-item" key={a.id}>
            <div className={`alert-icon ${a.severity}`}>{a.severity === 'ALTA' ? <LuAlertTriangle /> : <LuAlertCircle />}</div>
            <div style={{ flex: 1 }}>
              <div className="alert-msg">{a.message}</div>
              <div className="alert-meta">{TYPE_LABEL[a.type] ?? a.type} · {dateTime(a.at)}</div>
            </div>
            <Chip tone={a.severity === 'ALTA' ? 'bad' : 'warn'}>{a.severity === 'ALTA' ? 'Alta' : 'Media'}</Chip>
          </div>
        ))}
        {!data.alerts.length && <div className="empty">No hay alertas activas.</div>}
      </div>
    </>
  );
}
