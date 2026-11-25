import { useEffect, useState, type FormEvent } from 'react';
import { LuCheck, LuMinus } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { Modal, useToast } from './ui';
import { date, num, unit } from '../utils/format';

const parse = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
const REASONS = ['Bolsa rota', 'Material húmedo', 'Producto vencido', 'Derrame', 'Mezcla fuera de especificación'];

/** Registro de desperdicio (Fase 11): descuenta del inventario con motivo; puede asociarse a una cochada. */
export default function WasteForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData();
  const { registerWaste } = useStore();
  const toast = useToast();
  const [pid, setPid] = useState<number>(0);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [batchId, setBatchId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPid(data.products[0]?.id ?? 0); setQty(''); setReason(''); setNotes(''); setBatchId(''); setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const product = data.products.find((p) => p.id === pid);
  const q = parse(qty);
  const after = product && !Number.isNaN(q) ? product.stock - q : null;
  const batches = data.batches.slice(0, 20);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!product) return setError('Seleccione el producto.');
    if (Number.isNaN(q) || q <= 0) return setError('La cantidad debe ser mayor que cero.');
    if (after !== null && after < 0) return setError(`No hay suficiente ${product.name.toLowerCase()}: hay ${num(product.stock, 3)}.`);
    if (!reason.trim()) return setError('Escriba el motivo.');
    setBusy(true);
    try {
      await registerWaste({ productId: product.id, quantity: q, reason: reason.trim(), notes: notes.trim() || null, batchId: batchId ? Number(batchId) : null });
      toast(`Desperdicio registrado: ${num(q, 3)} ${unit(product.unit)} de ${product.name.toLowerCase()}.`);
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
      <button type="submit" form="waste-form" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : 'Registrar desperdicio'}</button>
    </>
  );

  return (
    <Modal open={open} title="Registrar desperdicio" onClose={onClose} footer={footer}>
      <form id="waste-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid two-cols">
          <label className="field">
            <span>Producto</span>
            <select value={pid} onChange={(e) => setPid(Number(e.target.value))}>
              {data.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Cantidad {product && <em>({unit(product.unit)})</em>}</span>
            <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
          </label>
        </div>
        {product && (
          <div className="stock-preview">
            <div><span className="muted small">Stock actual</span><strong className="mono">{num(product.stock, 3)}</strong></div>
            <div className="arrow neg"><LuMinus /></div>
            <div><span className="muted small">Quedará en</span><strong className={`mono ${after !== null && after < 0 ? 'neg' : ''}`}>{after === null ? '—' : num(after, 3)}</strong></div>
          </div>
        )}
        <div className="field">
          <span>Motivo</span>
          <div className="quick-reasons">
            {REASONS.map((r) => <button type="button" key={r} className={reason === r ? 'on' : ''} onClick={() => setReason(r)}>{r}</button>)}
          </div>
          <input value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="Ej: bolsas rotas en el cargue" aria-label="Motivo" />
        </div>
        <div className="form-grid two-cols">
          <label className="field">
            <span>Cochada <em>(opcional)</em></span>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              <option value="">Sin cochada</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.code} · {date(b.producedAt)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Notas <em>(opcional)</em></span>
            <input value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Detalle adicional" />
          </label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
