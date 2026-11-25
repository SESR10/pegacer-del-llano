import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LuCheck, LuChevronDown, LuChevronUp, LuKeyRound } from 'react-icons/lu';
import { apiFetch, useAuth } from '../services/auth';
import { DEMO_ONLY } from '../services/data';
import { useData, useStore } from '../services/store';
import { Card, PageHead, Spinner, useToast } from '../components/ui';
import { dateTime, money } from '../utils/format';
import { can } from '../utils/metrics';

interface Param { key: string; label: string; help: string; show: (v: string) => string; suffix?: string; numeric?: boolean }
const PARAMS: Param[] = [
  { key: 'empresa.nombre', label: 'Nombre de la empresa', help: 'Sale en el encabezado de los reportes.', show: (v) => v },
  { key: 'consumo.tolerancia_pct', label: 'Tolerancia de consumo', help: 'Variación permitida entre el consumo real y el de la fórmula antes de crear una alerta.', show: (v) => `±${v} %`, suffix: '%', numeric: true },
  { key: 'costo.otros_por_cochada', label: 'Otros costos por cochada', help: 'Energía, mano de obra, transporte. Se suman al costo de materiales en el reporte de costos.', show: (v) => money(Number(v) || 0), suffix: '$', numeric: true },
];

interface AuditRow { id: number; user: string | null; action: string; entity: string | null; entityId: number | null; details: Record<string, unknown> | null; createdAt: string }

const ACTION_LABEL: Record<string, string> = {
  INICIO_SESION: 'Inició sesión', REGISTRAR_COCHADA: 'Registró cochada', REGISTRAR_DESPACHO: 'Registró despacho', REGISTRAR_DESPERDICIO: 'Registró desperdicio',
  REGISTRAR_COMPRA: 'Registró compra', AJUSTE_INVENTARIO: 'Ajustó inventario', CREAR_PRODUCTO: 'Creó producto', EDITAR_PRODUCTO: 'Editó producto',
  ELIMINAR_PRODUCTO: 'Eliminó producto', DESACTIVAR_PRODUCTO: 'Desactivó producto', CREAR_FORMULA: 'Creó fórmula', ACTIVAR_FORMULA: 'Activó fórmula',
  CREAR_PROVEEDOR: 'Creó proveedor', EDITAR_PROVEEDOR: 'Editó proveedor', RESOLVER_ALERTA: 'Atendió alerta', RESOLVER_ALERTAS: 'Atendió alertas',
  CAMBIAR_PARAMETRO: 'Cambió parámetro', CREAR_USUARIO: 'Creó usuario', EDITAR_USUARIO: 'Editó usuario', CAMBIAR_CONTRASENA: 'Cambió su contraseña',
};

/** Configuración (Fase 15): parámetros del sistema, cambio de contraseña propia y auditoría (Administrador). */
export default function ConfiguracionPage() {
  const { user } = useAuth();
  const isAdmin = DEMO_ONLY || user?.role === 'ADMIN';
  return (
    <>
      <PageHead title="Configuración" subtitle={isAdmin ? 'Parámetros del sistema, su contraseña y el registro de auditoría.' : 'Parámetros del sistema y su contraseña.'} />
      <ParamsCard />
      <PasswordCard />
      {isAdmin && <AuditCard />}
    </>
  );
}

function ParamsCard() {
  const data = useData();
  const { updateSetting } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const allowed = can(user?.role, 'cochadas');
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent, p: Param) {
    e.preventDefault();
    setError(null);
    const v = p.numeric ? value.replace(/[$\s]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.') : value.trim();
    if (!v) return setError('Escriba el valor.');
    setBusy(true);
    try { await updateSetting(p.key, v); toast(`${p.label} actualizado.`); setEditing(null); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Card title="Parámetros" extra={!allowed && <span className="muted small">Los cambia Administrador o Producción</span>}>
      <ul className="params">
        {PARAMS.map((p) => (
          <li key={p.key}>
            <div className="grow">
              <strong>{p.label}</strong>
              <span className="muted small">{p.help}</span>
            </div>
            {editing === p.key ? (
              <form className="param-form" onSubmit={(e) => save(e, p)}>
                <div className="material-input">
                  <input value={value} inputMode={p.numeric ? 'decimal' : 'text'} maxLength={120} autoFocus aria-label={p.label} onChange={(e) => setValue(e.target.value)} />
                  {p.suffix && <span className="suffix">{p.suffix}</span>}
                </div>
                <button type="button" className="btn" onClick={() => setEditing(null)} disabled={busy}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : 'Guardar'}</button>
                {error && <div className="form-error">{error}</div>}
              </form>
            ) : (
              <div className="param-value">
                <span className="mono">{p.show(data.settings[p.key] ?? '—')}</span>
                {allowed && <button type="button" className="btn" onClick={() => { setEditing(p.key); setValue(data.settings[p.key] ?? ''); setError(null); }}>Cambiar</button>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!current) return setError('Escriba su contraseña actual.');
    if (next.length < 8 || next.length > 72) return setError('La nueva contraseña debe tener entre 8 y 72 caracteres.');
    if (next !== repeat) return setError('Las dos contraseñas nuevas no coinciden.');
    if (next === current) return setError('La nueva contraseña debe ser distinta de la actual.');
    setBusy(true);
    try {
      if (!DEMO_ONLY) await apiFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: current, newPassword: next }) });
      toast(DEMO_ONLY ? 'En la demostración la contraseña no se cambia.' : 'Contraseña actualizada.');
      setCurrent(''); setNext(''); setRepeat('');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Card className="mt" title={<><LuKeyRound /> Mi contraseña</>}>
      <form className="form password-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <label className="field"><span>Contraseña actual</span><input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></label>
          <label className="field"><span>Nueva contraseña</span><input type="password" autoComplete="new-password" value={next} maxLength={72} onChange={(e) => setNext(e.target.value)} placeholder="Mínimo 8 caracteres" /></label>
          <label className="field"><span>Repita la nueva</span><input type="password" autoComplete="new-password" value={repeat} maxLength={72} onChange={(e) => setRepeat(e.target.value)} /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div><button type="submit" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : 'Cambiar contraseña'}</button></div>
      </form>
    </Card>
  );
}

function AuditCard() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    if (DEMO_ONLY) { setRows([]); return; }
    try {
      const r = await apiFetch<{ content: AuditRow[]; last?: boolean; totalPages?: number }>(`/api/audit?page=${p}&size=30`);
      setRows((prev) => (p === 0 ? r.content : [...(prev ?? []), ...r.content]));
      setLast(r.last ?? (r.totalPages !== undefined ? p + 1 >= r.totalPages : r.content.length < 30));
      setPage(p);
    } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { load(0); }, [load]);

  return (
    <Card className="mt" flush title="Auditoría" extra={<span className="muted small">Quién hizo qué y cuándo</span>}>
      {error && <div className="form-error m-card">{error}</div>}
      {rows === null ? <Spinner label="Cargando auditoría…" /> : rows.length === 0 ? (
        <div className="empty">{DEMO_ONLY ? 'La auditoría se ve con el servidor (no en la demostración).' : 'Todavía no hay registros.'}</div>
      ) : (
        <>
          <ul className="list audit-list">
            {rows.map((a) => (
              <li key={a.id}>
                <button type="button" className="audit-row" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                  <span className="grow">
                    <strong>{ACTION_LABEL[a.action] ?? a.action.replace(/_/g, ' ').toLowerCase()}</strong>
                    <span className="muted small"> · {a.user ?? 'Sistema'} · {dateTime(a.createdAt)}</span>
                  </span>
                  {a.details && Object.keys(a.details).length > 0 && (open === a.id ? <LuChevronUp /> : <LuChevronDown />)}
                </button>
                {open === a.id && a.details && (
                  <dl className="audit-details">
                    {Object.entries(a.details).map(([k, v]) => (
                      <div key={k}><dt>{k}</dt><dd className="mono">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd></div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
          {!last && <div className="audit-more"><button type="button" className="btn" onClick={() => load(page + 1)}>Ver más</button></div>}
        </>
      )}
    </Card>
  );
}
