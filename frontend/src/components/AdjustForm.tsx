import { useEffect, useState, type FormEvent } from 'react';
import { LuCheck, LuMinus, LuPlus } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { Modal, Segmented, useToast } from './ui';
import { num, unit } from '../utils/format';

const parse = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
type Dir = 'AJUSTE_POS' | 'AJUSTE_NEG';
const REASONS = ['Conteo físico', 'Corrección de registro', 'Material dañado', 'Devolución'];

/** Ajuste manual de inventario (Fase 8): suma o resta con motivo obligatorio. Queda en el kardex y en la auditoría. */
export default function AdjustForm({ open, productId, onClose }: { open: boolean; productId?: number; onClose: () => void }) {
  const data = useData();
  const { adjust } = useStore();
  const toast = useToast();
  const [pid, setPid] = useState<number | undefined>(productId);
  const [dir, setDir] = useState<Dir>('AJUSTE_POS');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPid(productId ?? data.products[0]?.id); setDir('AJUSTE_POS'); setQty(''); setNotes(''); setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId]);

  const product = data.products.find((p) => p.id === pid);
  const q = parse(qty);
  const after = product && !Number.isNaN(q) ? (dir === 'AJUSTE_POS' ? product.stock + q : product.stock - q) : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!product) return setError('Seleccione el producto.');
    if (Number.isNaN(q) || q <= 0) return setError('La cantidad debe ser mayor que cero.');
    if (after !== null && after < 0) return setError(`No hay suficiente ${product.name.toLowerCase()}: hay ${num(product.stock, 3)}.`);
    if (!notes.trim()) return setError('Escriba el motivo del ajuste.');
    setBusy(true);
    try {
      const m = await adjust({ productId: product.id, type: dir, quantity: q, notes: notes.trim() });
      toast(`Ajuste registrado. ${product.name}: ${num(m.after, 3)} ${unit(product.unit)}.`);
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
      <button type="submit" form="adjust-form" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : 'Registrar ajuste'}</button>
    </>
  );

  return (
    <Modal open={open} title="Ajustar inventario" onClose={onClose} footer={footer}>
      <form id="adjust-form" className="form" onSubmit={submit} noValidate>
        <p className="muted m0">Para conteos físicos o correcciones. Las compras, cochadas y despachos se registran en su propio módulo.</p>
        <label className="field">
          <span>Producto</span>
          <select value={pid} onChange={(e) => setPid(Number(e.target.value))}>
            {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({num(p.stock, 2)} {unit(p.unit)})</option>)}
          </select>
        </label>
        <div className="field">
          <span>Tipo de ajuste</span>
          <Segmented value={dir} onChange={setDir} options={[{ value: 'AJUSTE_POS', label: 'Sumar (+)' }, { value: 'AJUSTE_NEG', label: 'Restar (−)' }]} />
        </div>
        <label className="field">
          <span>Cantidad {product && <em>({unit(product.unit)})</em>}</span>
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
        </label>
        {product && (
          <div className="stock-preview">
            <div><span className="muted small">Stock actual</span><strong className="mono">{num(product.stock, 3)}</strong></div>
            <div className={`arrow ${dir === 'AJUSTE_POS' ? 'pos' : 'neg'}`}>{dir === 'AJUSTE_POS' ? <LuPlus /> : <LuMinus />}</div>
            <div><span className="muted small">Quedará en</span><strong className={`mono ${after !== null && after < 0 ? 'neg' : ''}`}>{after === null ? '—' : num(after, 3)}</strong></div>
          </div>
        )}
        <div className="field">
          <span>Motivo</span>
          <div className="quick-reasons">
            {REASONS.map((r) => <button type="button" key={r} className={notes === r ? 'on' : ''} onClick={() => setNotes(r)}>{r}</button>)}
          </div>
          <textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: conteo físico del sábado" aria-label="Motivo del ajuste" />
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
