import { useState, type FormEvent } from 'react';
import { LuHistory, LuPencil, LuPlus, LuRotateCcw, LuCheck } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { useAuth } from '../services/auth';
import type { Formula, Product } from '../services/types';
import { Card, Chip, PageHead, useToast } from '../components/ui';
import FormulaForm from '../components/FormulaForm';
import { dateTime, num, unit } from '../utils/format';
import { can, toleranceOf } from '../utils/metrics';

export default function FormulasPage() {
  const data = useData();
  const { user } = useAuth();
  const allowed = can(user?.role, 'cochadas');
  const [form, setForm] = useState<{ base?: Formula; productId?: number } | null>(null);
  const finished = data.products.filter((p) => p.category === 'PRODUCTO_TERMINADO');
  const of = (p: Product) => data.formulas.filter((f) => f.productId === p.id || f.product === p.name).sort((a, b) => b.version - a.version);

  return (
    <>
      <PageHead title="Fórmulas" subtitle="Receta de cada producto terminado. Cada cambio se guarda como una versión nueva y las anteriores quedan en el historial." />
      <ToleranceCard allowed={allowed} />
      {finished.map((p) => {
        const versions = of(p);
        const active = versions.find((f) => f.active !== false);
        return active
          ? <FormulaBlock key={p.id} formula={active} history={versions.filter((f) => f !== active)} allowed={allowed} onEdit={() => setForm({ base: active })} />
          : (
            <Card key={p.id} className="mb" title={p.name} extra={<Chip tone="neutral">Sin fórmula</Chip>}>
              <div className="empty-row">
                <p className="muted m0">{versions.length ? 'Ninguna versión está activa. Active una del historial o cree una nueva.' : 'Todavía no tiene receta registrada. Sin fórmula no se pueden registrar cochadas de este producto.'}</p>
                {allowed && <button type="button" className="btn-primary" onClick={() => setForm({ productId: p.id })}><LuPlus /> Crear fórmula</button>}
              </div>
              {versions.length > 0 && <History versions={versions} allowed={allowed} />}
            </Card>
          );
      })}
      <FormulaForm open={!!form} base={form?.base} productId={form?.productId} onClose={() => setForm(null)} />
    </>
  );
}

function FormulaBlock({ formula: f, history, allowed, onEdit }: { formula: Formula; history: Formula[]; allowed: boolean; onEdit: () => void }) {
  const data = useData();
  const tolerance = toleranceOf(data);
  return (
    <div className="grid two mb">
      <Card flush title={<>{f.name} <Chip tone="ok">Activa · v{f.version}</Chip></>}
            extra={allowed && <button type="button" className="btn small" onClick={onEdit}><LuPencil /> Editar</button>}>
        <p className="muted card-pad">Producto: {f.product}</p>
        <ul className="list">
          {f.items.map((i) => {
            const p = data.products.find((x) => x.id === i.productId);
            return (
              <li key={i.productId}>
                <span className="strong">{p?.name}</span>
                <span className="mono">{num(i.quantity, 3)} <span className="muted">{unit(p?.unit ?? '')}</span></span>
              </li>
            );
          })}
        </ul>
        {history.length > 0 && <History versions={history} allowed={allowed} />}
      </Card>
      <Card title="Resultado esperado" className="self-start">
        <dl className="kv">
          <dt>Bolsas por cochada</dt><dd>{num(f.minBags)}–{num(f.maxBags)} <span className="muted">(meta {num(f.expectedBags)})</span></dd>
          <dt>Peso por bolsa</dt><dd>{num(f.bagWeightKg)} kg</dd>
          <dt>Producción por cochada</dt><dd>≈ {num(f.expectedBags * f.bagWeightKg, 0)} kg</dd>
          <dt>Tolerancia de consumo</dt><dd>±{num(tolerance)} %</dd>
        </dl>
      </Card>
    </div>
  );
}

function History({ versions, allowed }: { versions: Formula[]; allowed: boolean }) {
  const { activateFormula } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function use(f: Formula) {
    setBusy(f.id); setError(null);
    try { await activateFormula(f.id); toast(`Ahora se usa la versión ${f.version}.`); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  }
  return (
    <div className="history">
      <button type="button" className="history-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <LuHistory /> Versiones anteriores ({versions.length}) <span className="muted">{open ? 'Ocultar' : 'Ver'}</span>
      </button>
      {open && (
        <ul className="list">
          {versions.map((f) => (
            <li key={f.id}>
              <div><strong>v{f.version} · {f.name}</strong>
                <span className="muted small">{num(f.minBags)}–{num(f.maxBags)} bolsas · {f.items.length} materiales{f.createdAt ? ` · ${dateTime(f.createdAt)}` : ''}</span></div>
              {allowed && <button type="button" className="btn small" disabled={busy === f.id} onClick={() => use(f)}><LuRotateCcw /> {busy === f.id ? 'Activando…' : 'Usar esta'}</button>}
            </li>
          ))}
        </ul>
      )}
      {error && <div className="form-error m">{error}</div>}
    </div>
  );
}

function ToleranceCard({ allowed }: { allowed: boolean }) {
  const data = useData();
  const { updateSetting } = useStore();
  const toast = useToast();
  const tolerance = toleranceOf(data);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await updateSetting('consumo.tolerancia_pct', value); toast('Tolerancia actualizada.'); setEditing(false); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Card className="mb tolerance">
      <div className="tolerance-row">
        <div className="grow">
          <h3 className="m0">Tolerancia de consumo</h3>
          <p className="muted m0 small">Si el consumo real de un material se aleja más que esto de la fórmula, la cochada genera una alerta.</p>
        </div>
        {editing ? (
          <form className="tolerance-form" onSubmit={save} noValidate>
            <div className="material-input"><input inputMode="decimal" autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label="Tolerancia en porcentaje" /><span className="suffix">%</span></div>
            <button type="button" className="btn small" onClick={() => setEditing(false)} disabled={busy}>Cancelar</button>
            <button type="submit" className="btn-primary small" disabled={busy}><LuCheck /> Guardar</button>
          </form>
        ) : (
          <div className="tolerance-value">
            <span className="big-number m0">±{num(tolerance)} %</span>
            {allowed && <button type="button" className="btn small" onClick={() => { setValue(String(tolerance)); setEditing(true); }}><LuPencil /> Cambiar</button>}
          </div>
        )}
      </div>
      {error && <div className="form-error mt-sm">{error}</div>}
    </Card>
  );
}
