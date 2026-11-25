import { useMemo, useState, type FormEvent, useLayoutEffect } from 'react';
import { LuCheck, LuWand2 } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import type { Batch } from '../services/types';
import { Chip, Modal, Step, useToast } from './ui';
import { num, pct, unit } from '../utils/format';
import { toleranceOf } from '../utils/metrics';

/** "2026-11-20T14:30" en hora local, para el campo de fecha y hora. */
const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const parse = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

/** Formulario de registro de cochada (Fase 10). */
export default function BatchForm({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (b: Batch) => void }) {
  const data = useData();
  const { registerBatch } = useStore();
  const toast = useToast();
  const formulas = data.formulas.filter((f) => f.active !== false && f.items.length);
  const tolerance = toleranceOf(data);

  const [formulaId, setFormulaId] = useState<number | undefined>(formulas[0]?.id);
  const [producedAt, setProducedAt] = useState(localNow);
  const [bags, setBags] = useState('');
  const [real, setReal] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // useLayoutEffect: el formulario se limpia antes de mostrarse, así no se borra lo que se alcance a escribir.
  useLayoutEffect(() => {
    if (!open) return;
    setFormulaId(formulas[0]?.id); setProducedAt(localNow()); setBags(''); setReal({}); setNotes(''); setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const formula = formulas.find((f) => f.id === formulaId);
  const items = useMemo(() => (formula?.items ?? []).map((i) => ({ ...i, product: data.products.find((p) => p.id === i.productId) })), [formula, data.products]);
  const bagsN = parse(bags);
  const bagsTone = !formula || Number.isNaN(bagsN) ? null : bagsN < formula.minBags ? 'warn' : bagsN > formula.maxBags ? 'info' : 'ok';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formula) return setError('Seleccione la fórmula.');
    if (Number.isNaN(bagsN) || bagsN <= 0) return setError('Escriba cuántas bolsas se produjeron.');
    const consumptions = items.map((i) => ({ productId: i.productId, realQty: parse(real[i.productId] ?? '') }));
    const bad = consumptions.findIndex((c) => Number.isNaN(c.realQty) || c.realQty <= 0);
    if (bad >= 0) return setError(`Escriba el consumo real de ${items[bad].product?.name.toLowerCase() ?? 'cada material'}.`);
    const at = new Date(producedAt);
    if (Number.isNaN(at.getTime())) return setError('Revise la fecha y hora de la cochada.');
    if (at.getTime() > Date.now() + 10 * 60_000) return setError('La fecha de la cochada no puede estar en el futuro.');

    setBusy(true);
    try {
      const b = await registerBatch({ formulaId: formula.id, bagsProduced: bagsN, producedAt: at.toISOString(), notes: notes.trim() || undefined, consumptions });
      toast(`Cochada ${b.code} registrada. El inventario ya se actualizó.`);
      onCreated?.(b);
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
      <button type="submit" form="batch-form" className="btn-primary" disabled={busy || !formula}><LuCheck /> {busy ? 'Guardando…' : 'Registrar cochada'}</button>
    </>
  );

  return (
    <Modal open={open} title="Registrar cochada" onClose={onClose} footer={footer} wide>
      {!formulas.length ? (
        <div className="notice">No hay fórmulas activas. Registre una fórmula antes de producir.</div>
      ) : (
        <form id="batch-form" className="form" onSubmit={submit} noValidate>
          <Step n={1}>¿Qué se mezcló y cuántas bolsas salieron?</Step>
          <div className="form-grid">
            <label className="field">
              <span>Fórmula</span>
              <select value={formulaId} onChange={(e) => { setFormulaId(Number(e.target.value)); setReal({}); }}>
                {formulas.map((f) => <option key={f.id} value={f.id}>{f.name} · {f.product}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Fecha y hora</span>
              <input type="datetime-local" value={producedAt} max={localNow()} onChange={(e) => setProducedAt(e.target.value)} />
            </label>
            <label className="field">
              <span>Bolsas producidas</span>
              <input inputMode="decimal" placeholder={formula ? `Esperado ${formula.minBags}–${formula.maxBags}` : ''} value={bags} onChange={(e) => setBags(e.target.value)} />
              {bagsTone && formula && (
                <small className={`hint ${bagsTone}`}>
                  {bagsTone === 'warn' ? `Por debajo del mínimo (${formula.minBags}). Se creará una alerta de producción baja.`
                    : bagsTone === 'info' ? `Por encima del máximo esperado (${formula.maxBags}).` : 'Dentro del rango esperado.'}
                </small>
              )}
            </label>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <div>
                <Step n={2}>¿Cuánto material se gastó?</Step>
                <p className="muted small">Lo que realmente se usó en la mezcla. Si fue lo mismo de la fórmula, toque el botón. Se permite una diferencia de ±{tolerance} %.</p>
              </div>
              <button type="button" className="btn small" onClick={() => setReal(Object.fromEntries(items.map((i) => [i.productId, String(i.quantity)])))}>
                <LuWand2 /> Igual a la fórmula
              </button>
            </div>
            <div className="materials">
              {items.map((i) => {
                const v = parse(real[i.productId] ?? '');
                const variation = Number.isNaN(v) ? null : ((v - i.quantity) * 100) / i.quantity;
                const out = variation !== null && Math.abs(variation) > tolerance;
                const short = !Number.isNaN(v) && i.product && v > i.product.stock;
                return (
                  <div className="material" key={i.productId}>
                    <div className="material-info">
                      <strong>{i.product?.name}</strong>
                      <span className="muted small">Fórmula {num(i.quantity, 3)} {unit(i.product?.unit ?? '')} · Disponible {num(i.product?.stock ?? 0, 2)}</span>
                    </div>
                    <div className="material-input">
                      <input inputMode="decimal" aria-label={`Consumo real de ${i.product?.name}`} placeholder={num(i.quantity, 3)}
                             value={real[i.productId] ?? ''} onChange={(e) => setReal((r) => ({ ...r, [i.productId]: e.target.value }))} />
                      <span className="suffix">{unit(i.product?.unit ?? '')}</span>
                    </div>
                    <div className="material-var">
                      {short ? <Chip tone="bad">Sin stock</Chip> : variation === null ? <span className="muted">—</span>
                        : <Chip tone={out ? 'warn' : 'ok'}>{pct(Math.round(variation * 100) / 100)}</Chip>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Step n={3} optional>¿Algo para anotar?</Step>
          <label className="field">
            <span>Observaciones <em>(opcional)</em></span>
            <textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: turno de la mañana, mezcladora 2" />
          </label>

          {error && <div className="form-error" role="alert">{error}</div>}
        </form>
      )}
    </Modal>
  );
}
