import { useState, type FormEvent, useLayoutEffect } from 'react';
import { LuCheck, LuPlus, LuTrash2 } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import type { Formula } from '../services/types';
import { Modal, useToast } from './ui';
import { num, unit } from '../utils/format';

const parse = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
interface Row { key: number; productId: number | ''; qty: string; }
let seq = 0;

/**
 * Formulario de fórmula (Fase 9). Guardar nunca sobrescribe: crea la versión siguiente y deja
 * la anterior en el historial, para que las cochadas ya registradas conserven su receta.
 */
export default function FormulaForm({ open, base, productId, onClose }: { open: boolean; base?: Formula; productId?: number; onClose: () => void }) {
  const data = useData();
  const { saveFormula } = useStore();
  const toast = useToast();
  const finished = data.products.filter((p) => p.category === 'PRODUCTO_TERMINADO');
  const materials = data.products.filter((p) => p.category !== 'PRODUCTO_TERMINADO');

  const [pid, setPid] = useState<number | undefined>();
  const [name, setName] = useState('');
  const [minBags, setMin] = useState('');
  const [expected, setExpected] = useState('');
  const [maxBags, setMax] = useState('');
  const [weight, setWeight] = useState('25');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // useLayoutEffect: el formulario se limpia antes de mostrarse, así no se borra lo que se alcance a escribir.
  useLayoutEffect(() => {
    if (!open) return;
    const product = base ? (finished.find((p) => p.id === base.productId || p.name === base.product)) : finished.find((p) => p.id === productId) ?? finished[0];
    setPid(product?.id);
    setName(base ? base.name.replace(/\s*v\d+$/i, '') + ` v${base.version + 1}` : product ? `Fórmula ${product.name.replace(/\s*\d+\s*kg$/i, '').replace('Pegante para enchape ', '')} v1` : '');
    setMin(base ? String(base.minBags) : ''); setExpected(base ? String(base.expectedBags) : ''); setMax(base ? String(base.maxBags) : '');
    setWeight(base ? String(base.bagWeightKg) : '25');
    setRows(base ? base.items.map((i) => ({ key: ++seq, productId: i.productId, qty: String(i.quantity) }))
      : materials.map((m) => ({ key: ++seq, productId: m.id, qty: '' })));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, base, productId]);

  const used = new Set(rows.map((r) => r.productId));
  const free = materials.filter((m) => !used.has(m.id));
  const setRow = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pid) return setError('Seleccione el producto terminado.');
    if (!name.trim()) return setError('Escriba el nombre de la fórmula.');
    const [mn, ex, mx, w] = [parse(minBags), parse(expected), parse(maxBags), parse(weight)];
    if ([mn, ex, mx].some((v) => Number.isNaN(v) || v <= 0)) return setError('Escriba el mínimo, el esperado y el máximo de bolsas por cochada.');
    if (mn > mx) return setError('El mínimo de bolsas no puede ser mayor que el máximo.');
    if (ex < mn || ex > mx) return setError('Las bolsas esperadas deben estar entre el mínimo y el máximo.');
    if (Number.isNaN(w) || w <= 0) return setError('Escriba el peso por bolsa.');
    const items = rows.filter((r) => r.productId !== '').map((r) => ({ productId: r.productId as number, quantity: parse(r.qty) }));
    if (!items.length) return setError('Agregue al menos un material a la fórmula.');
    const bad = items.find((i) => Number.isNaN(i.quantity) || i.quantity <= 0);
    if (bad) return setError(`Escriba la cantidad de ${materials.find((m) => m.id === bad.productId)?.name.toLowerCase() ?? 'cada material'}.`);

    setBusy(true);
    try {
      const f = await saveFormula({ productId: pid, name: name.trim(), minBags: mn, expectedBags: ex, maxBags: mx, bagWeightKg: w, items });
      toast(base ? `Guardada la versión ${f.version}. Las cochadas nuevas ya la usan.` : `Fórmula creada (versión ${f.version}).`);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const footer = (
    <>
      <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
      <button type="submit" form="formula-form" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : base ? `Guardar como versión ${base.version + 1}` : 'Crear fórmula'}</button>
    </>
  );

  return (
    <Modal open={open} title={base ? `Editar ${base.name}` : 'Nueva fórmula'} onClose={onClose} footer={footer} wide>
      <form id="formula-form" className="form" onSubmit={submit} noValidate>
        {base && <div className="notice m0">Los cambios se guardan como <strong>versión {base.version + 1}</strong>. La versión {base.version} queda en el historial y las cochadas ya registradas no cambian.</div>}
        <div className="form-grid two-cols">
          <label className="field">
            <span>Producto terminado</span>
            <select value={pid ?? ''} onChange={(e) => setPid(Number(e.target.value))} disabled={!!base}>
              {finished.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Nombre de la fórmula</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-head"><div><h4>Resultado esperado por cochada</h4><p className="muted small">Fuera de este rango la cochada genera una alerta de producción baja.</p></div></div>
          <div className="form-grid four-cols">
            <label className="field"><span>Mínimo de bolsas</span><input inputMode="decimal" value={minBags} onChange={(e) => setMin(e.target.value)} placeholder="45" /></label>
            <label className="field"><span>Esperado</span><input inputMode="decimal" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="46" /></label>
            <label className="field"><span>Máximo</span><input inputMode="decimal" value={maxBags} onChange={(e) => setMax(e.target.value)} placeholder="47" /></label>
            <label className="field"><span>Peso por bolsa (kg)</span><input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <div><h4>Materiales por cochada</h4><p className="muted small">Cantidad de cada material que lleva una mezcla.</p></div>
            {free.length > 0 && <button type="button" className="btn small" onClick={() => setRows((rs) => [...rs, { key: ++seq, productId: free[0].id, qty: '' }])}><LuPlus /> Agregar material</button>}
          </div>
          <div className="materials">
            {rows.map((r) => {
              const m = materials.find((x) => x.id === r.productId);
              const prev = base?.items.find((i) => i.productId === r.productId)?.quantity;
              const q = parse(r.qty);
              const changed = base && !Number.isNaN(q) && prev !== q;
              return (
                <div className="material formula-row" key={r.key}>
                  <div className="material-info">
                    <select aria-label="Material" value={r.productId} onChange={(e) => setRow(r.key, { productId: Number(e.target.value) })}>
                      {materials.filter((x) => x.id === r.productId || !used.has(x.id)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                    {base && <span className={`muted small${changed ? ' changed' : ''}`}>{prev === undefined ? 'Material nuevo' : `Antes: ${num(prev, 3)} ${unit(m?.unit ?? '')}`}</span>}
                  </div>
                  <div className="material-input">
                    <input inputMode="decimal" aria-label={`Cantidad de ${m?.name ?? 'material'}`} value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} placeholder="0" />
                    <span className="suffix">{unit(m?.unit ?? '')}</span>
                  </div>
                  <div className="material-var">
                    <button type="button" className="icon-btn sm" aria-label="Quitar material" title="Quitar" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}><LuTrash2 /></button>
                  </div>
                </div>
              );
            })}
            {!rows.length && <p className="muted m0">Sin materiales. Use "Agregar material".</p>}
          </div>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
