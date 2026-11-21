import { useEffect, useState, type FormEvent } from 'react';
import { LuCheck, LuTrash2 } from 'react-icons/lu';
import { useStore } from '../services/store';
import type { Category, Product } from '../services/types';
import { Modal, useToast } from './ui';
import { num, unit } from '../utils/format';

const parse = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

/** Crear o editar un producto (Fase 7). El código y el stock no se editan: el stock solo cambia con movimientos. */
export default function ProductForm({ open, product, onClose }: { open: boolean; product?: Product | null; onClose: () => void }) {
  const { catalogs, saveProduct, deleteProduct } = useStore();
  const toast = useToast();
  const editing = !!product;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('MATERIA_PRIMA');
  const [unitCode, setUnitCode] = useState('KG');
  const [minStock, setMinStock] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode(product?.code ?? ''); setName(product?.name ?? ''); setCategory(product?.category ?? 'MATERIA_PRIMA');
    setUnitCode(product?.unit ?? 'KG'); setMinStock(product ? String(product.minStock) : '');
    setUnitCost(product?.unitCost != null ? String(product.unitCost) : ''); setInitialStock('');
    setError(null); setConfirmDelete(false);
  }, [open, product]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return setError('Escriba el código del producto.');
    if (!name.trim()) return setError('Escriba el nombre del producto.');
    const min = parse(minStock);
    if (Number.isNaN(min) || min < 0) return setError('Escriba el stock mínimo (0 o más).');
    const cost = unitCost.trim() ? parse(unitCost) : null;
    if (cost !== null && (Number.isNaN(cost) || cost < 0)) return setError('El costo unitario no puede ser negativo.');
    const initial = initialStock.trim() ? parse(initialStock) : 0;
    if (Number.isNaN(initial) || initial < 0) return setError('El stock inicial no puede ser negativo.');

    setBusy(true);
    try {
      const p = await saveProduct({ code: code.trim(), name: name.trim(), category, unit: unitCode, minStock: min, unitCost: cost,
        initialStock: editing ? undefined : initial || undefined }, product?.id);
      toast(editing ? `${p.name} actualizado.` : `${p.name} creado.`);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!product) return;
    setBusy(true); setError(null);
    try {
      toast(await deleteProduct(product.id));
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const footer = confirmDelete ? (
    <>
      <span className="foot-note">¿Eliminar {product?.name}? Si tiene movimientos se desactiva para no perder el historial.</span>
      <button type="button" className="btn" onClick={() => setConfirmDelete(false)} disabled={busy}>No</button>
      <button type="button" className="btn-danger" onClick={remove} disabled={busy}><LuTrash2 /> {busy ? 'Eliminando…' : 'Sí, eliminar'}</button>
    </>
  ) : (
    <>
      {editing && <button type="button" className="btn ghost-danger push-left" onClick={() => setConfirmDelete(true)} disabled={busy}><LuTrash2 /> Eliminar</button>}
      <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
      <button type="submit" form="product-form" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}</button>
    </>
  );

  return (
    <Modal open={open} title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={onClose} footer={footer}>
      <form id="product-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid two-cols">
          <label className="field">
            <span>Código</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} placeholder="Ej: MP-CAL" disabled={editing} autoCapitalize="characters" />
            {editing && <small className="hint muted">El código no se puede cambiar.</small>}
          </label>
          <label className="field">
            <span>Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {catalogs.categories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>
          <label className="field span-2">
            <span>Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ej: Cal hidratada" />
          </label>
          <label className="field">
            <span>Unidad de medida</span>
            <select value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
              {catalogs.units.map((u) => <option key={u.code} value={u.code}>{u.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Stock mínimo</span>
            <input inputMode="decimal" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" />
            <small className="hint muted">Por debajo de este valor se crea una alerta.</small>
          </label>
          <label className="field">
            <span>Costo unitario <em>(opcional)</em></span>
            <input inputMode="decimal" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="$ por unidad" />
          </label>
          {editing ? (
            <div className="field">
              <span>Stock actual</span>
              <div className="readonly">{num(product!.stock, 3)} {unit(product!.unit)}</div>
              <small className="hint muted">Cambia con compras, cochadas o ajustes de inventario.</small>
            </div>
          ) : (
            <label className="field">
              <span>Stock inicial <em>(opcional)</em></span>
              <input inputMode="decimal" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} placeholder="0" />
              <small className="hint muted">Queda en el kardex como saldo inicial.</small>
            </label>
          )}
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
