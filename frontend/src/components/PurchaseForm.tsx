import { useEffect, useState, type FormEvent } from 'react';
import { LuCheck, LuPlus, LuTrash2 } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { Modal, useToast } from './ui';
import { money, num, unit } from '../utils/format';

const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const parse = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
interface Line { productId: number; qty: string; cost: string }

/** Compra a proveedor (Fase 12): suma al inventario cada producto y actualiza su costo si se escribe. */
export default function PurchaseForm({ open, supplierId, onClose }: { open: boolean; supplierId?: number; onClose: () => void }) {
  const data = useData();
  const { registerPurchase } = useStore();
  const toast = useToast();
  const buyable = data.products.filter((p) => p.category !== 'PRODUCTO_TERMINADO');
  const suppliers = data.suppliers.filter((s) => s.active !== false);
  const [sid, setSid] = useState(0);
  const [invoice, setInvoice] = useState('');
  const [at, setAt] = useState(localNow);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const blank = (p?: { id: number; unitCost?: number | null }): Line => ({ productId: p?.id ?? 0, qty: '', cost: p?.unitCost != null ? String(p.unitCost) : '' });
  useEffect(() => {
    if (!open) return;
    setSid(supplierId ?? suppliers[0]?.id ?? 0); setInvoice(''); setAt(localNow()); setError(null);
    setLines([blank(buyable[0])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supplierId]);

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const free = buyable.filter((p) => !lines.some((l) => l.productId === p.id));
  const total = lines.reduce((s, l) => s + ((parse(l.qty) || 0) * (parse(l.cost) || 0)), 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const sup = suppliers.find((s) => s.id === sid);
    if (!sup) return setError('Seleccione el proveedor.');
    const items = lines.map((l) => ({ productId: l.productId, quantity: parse(l.qty), unitCost: l.cost.trim() ? parse(l.cost) : null }));
    if (items.some((i) => Number.isNaN(i.quantity) || i.quantity <= 0)) return setError('Cada producto necesita una cantidad mayor que cero.');
    if (items.some((i) => i.unitCost !== null && (Number.isNaN(i.unitCost) || i.unitCost < 0))) return setError('El costo debe ser un número mayor o igual a cero.');
    const when = new Date(at);
    if (Number.isNaN(when.getTime()) || when.getTime() > Date.now() + 60_000) return setError('La fecha no puede ser futura.');
    setBusy(true);
    try {
      const code = await registerPurchase({ supplierId: sup.id, invoiceNumber: invoice.trim() || null, purchasedAt: when.toISOString(), items });
      toast(`Compra ${code} registrada. Se sumaron ${items.length} producto${items.length > 1 ? 's' : ''} al inventario.`);
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
      <button type="submit" form="purchase-form" className="btn-primary" disabled={busy || !suppliers.length}><LuCheck /> {busy ? 'Guardando…' : 'Registrar compra'}</button>
    </>
  );

  return (
    <Modal open={open} title="Registrar compra" onClose={onClose} footer={footer} wide>
      <form id="purchase-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <label className="field">
            <span>Proveedor</span>
            <select value={sid} onChange={(e) => setSid(Number(e.target.value))}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Factura <em>(opcional)</em></span>
            <input value={invoice} maxLength={40} onChange={(e) => setInvoice(e.target.value)} placeholder="Ej: FV-1234" autoComplete="off" />
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
              const p = buyable.find((x) => x.id === l.productId);
              const q = parse(l.qty);
              return (
                <div className="line-item purchase" key={i}>
                  <select value={l.productId} aria-label="Producto"
                    onChange={(e) => { const np = buyable.find((x) => x.id === Number(e.target.value)); setLine(i, blank(np)); }}>
                    {buyable.filter((x) => x.id === l.productId || free.includes(x)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <div className="material-input">
                    <input inputMode="decimal" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} placeholder="Cantidad" aria-label="Cantidad" />
                    <span className="suffix">{unit(p?.unit ?? '')}</span>
                  </div>
                  <div className="material-input">
                    <input inputMode="decimal" value={l.cost} onChange={(e) => setLine(i, { cost: e.target.value })} placeholder="Costo" aria-label="Costo unitario" />
                    <span className="suffix">$ c/u</span>
                  </div>
                  {lines.length > 1 && <button type="button" className="icon-btn" aria-label="Quitar producto" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><LuTrash2 /></button>}
                  {p && <small className="line-hint muted">Hay {num(p.stock, 2)} {unit(p.unit)}{!Number.isNaN(q) && q > 0 ? ` · quedará en ${num(p.stock + q, 2)}` : ''}</small>}
                </div>
              );
            })}
          </div>
          {free.length > 0 && (
            <button type="button" className="btn btn-sm add-line" onClick={() => setLines((ls) => [...ls, blank(free[0])])}><LuPlus /> Agregar producto</button>
          )}
        </div>
        {total > 0 && <div className="stock-total"><span className="muted">Valor de la compra</span><strong className="mono">{money(total)}</strong></div>}
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
