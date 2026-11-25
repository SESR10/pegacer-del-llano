import { useEffect, useState, type FormEvent } from 'react';
import { LuCheck, LuPlus, LuTrash2 } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { Modal, useToast } from './ui';
import { num, unit } from '../utils/format';

const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const parse = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
interface Line { productId: number; qty: string }

/** Despacho de producto terminado (Fase 11): descuenta las bolsas del inventario y queda en el kardex. */
export default function DispatchForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData();
  const { registerDispatch } = useStore();
  const toast = useToast();
  const finished = data.products.filter((p) => p.category === 'PRODUCTO_TERMINADO');
  const [customer, setCustomer] = useState('');
  const [at, setAt] = useState(localNow);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCustomer(''); setAt(localNow()); setError(null);
    setLines([{ productId: finished[0]?.id ?? 0, qty: '' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const free = finished.filter((p) => !lines.some((l) => l.productId === p.id));
  const total = lines.reduce((s, l) => s + (parse(l.qty) || 0), 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customer.trim()) return setError('Escriba el nombre del cliente.');
    const items = lines.map((l) => ({ productId: l.productId, quantity: parse(l.qty) }));
    if (items.some((i) => Number.isNaN(i.quantity) || i.quantity <= 0)) return setError('Cada producto necesita una cantidad mayor que cero.');
    for (const i of items) {
      const p = finished.find((x) => x.id === i.productId)!;
      if (i.quantity > p.stock) return setError(`No hay suficiente ${p.name.toLowerCase()}: hay ${num(p.stock, 0)} y se necesitan ${num(i.quantity, 0)}.`);
    }
    const when = new Date(at);
    if (Number.isNaN(when.getTime()) || when.getTime() > Date.now() + 60_000) return setError('La fecha no puede ser futura.');
    setBusy(true);
    try {
      const code = await registerDispatch({ customerName: customer.trim(), dispatchedAt: when.toISOString(), items });
      toast(`Despacho ${code} registrado: ${num(total, 0)} bolsas para ${customer.trim()}.`);
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
      <button type="submit" form="dispatch-form" className="btn-primary" disabled={busy || !finished.length}><LuCheck /> {busy ? 'Guardando…' : 'Registrar despacho'}</button>
    </>
  );

  return (
    <Modal open={open} title="Registrar despacho" onClose={onClose} footer={footer}>
      <form id="dispatch-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid two-cols">
          <label className="field">
            <span>Cliente</span>
            <input value={customer} maxLength={120} onChange={(e) => setCustomer(e.target.value)} placeholder="Ej: Ferretería El Llano" autoComplete="off" />
          </label>
          <label className="field">
            <span>Fecha y hora</span>
            <input type="datetime-local" value={at} max={localNow()} onChange={(e) => setAt(e.target.value)} />
          </label>
        </div>
        <div className="field">
          <span>Productos</span>
          <div className="line-items">
            {lines.map((l, i) => {
              const p = finished.find((x) => x.id === l.productId);
              const q = parse(l.qty);
              const short = p && !Number.isNaN(q) && q > p.stock;
              return (
                <div className="line-item" key={i}>
                  <select value={l.productId} onChange={(e) => setLine(i, { productId: Number(e.target.value) })} aria-label="Producto">
                    {finished.filter((x) => x.id === l.productId || free.includes(x)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <div className="material-input">
                    <input inputMode="numeric" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} placeholder="0" aria-label="Cantidad" />
                    <span className="suffix">{unit(p?.unit ?? '')}</span>
                  </div>
                  {lines.length > 1 && <button type="button" className="icon-btn" aria-label="Quitar producto" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><LuTrash2 /></button>}
                  {p && <small className={`line-hint ${short ? 'neg' : 'muted'}`}>Disponible: {num(p.stock, 0)} {unit(p.unit)}{short ? ' — no alcanza' : ''}</small>}
                </div>
              );
            })}
          </div>
          {free.length > 0 && (
            <button type="button" className="btn btn-sm add-line" onClick={() => setLines((ls) => [...ls, { productId: free[0].id, qty: '' }])}><LuPlus /> Agregar producto</button>
          )}
        </div>
        {total > 0 && <div className="stock-total"><span className="muted">Total del despacho</span><strong className="mono">{num(total, 0)} bolsas · {num(total * 25 / 1000, 2)} t</strong></div>}
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
