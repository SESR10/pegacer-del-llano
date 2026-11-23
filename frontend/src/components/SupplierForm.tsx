import { useEffect, useState, type FormEvent } from 'react';
import { LuCheck } from 'react-icons/lu';
import { useStore } from '../services/store';
import type { Supplier } from '../services/types';
import { Modal, Segmented, useToast } from './ui';

const clean = (v: string | null | undefined) => (v && v !== '—' ? v : '');

/** Crear o editar proveedor (Fase 12). No se borran: se desactivan para conservar sus compras. */
export default function SupplierForm({ open, supplier, onClose }: { open: boolean; supplier: Supplier | null; onClose: () => void }) {
  const { saveSupplier } = useStore();
  const toast = useToast();
  const [nit, setNit] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [active, setActive] = useState<'SI' | 'NO'>('SI');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNit(supplier?.nit ?? ''); setName(supplier?.name ?? ''); setPhone(clean(supplier?.phone)); setEmail(clean(supplier?.email));
    setCity(clean(supplier?.city)); setActive(supplier?.active === false ? 'NO' : 'SI'); setError(null);
  }, [open, supplier]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nit.trim()) return setError('El NIT es obligatorio.');
    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('El correo no es válido.');
    setBusy(true);
    try {
      const s = await saveSupplier({ nit: nit.trim(), name: name.trim(), phone: phone.trim() || null, email: email.trim() || null, city: city.trim() || null, active: active === 'SI' }, supplier?.id);
      toast(supplier ? `Proveedor ${s.name} actualizado.` : `Proveedor ${s.name} creado.`);
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
      <button type="submit" form="supplier-form" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : supplier ? 'Guardar cambios' : 'Crear proveedor'}</button>
    </>
  );

  return (
    <Modal open={open} title={supplier ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose} footer={footer}>
      <form id="supplier-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid two-cols">
          <label className="field">
            <span>NIT</span>
            <input value={nit} maxLength={30} onChange={(e) => setNit(e.target.value)} placeholder="900123456-7" autoComplete="off" />
          </label>
          <label className="field">
            <span>Nombre o razón social</span>
            <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Cementos del Meta S.A.S." />
          </label>
          <label className="field">
            <span>Teléfono <em>(opcional)</em></span>
            <input type="tel" value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} placeholder="300 000 0000" />
          </label>
          <label className="field">
            <span>Ciudad <em>(opcional)</em></span>
            <input value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} placeholder="Villavicencio" />
          </label>
        </div>
        <label className="field">
          <span>Correo <em>(opcional)</em></span>
          <input type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} placeholder="ventas@proveedor.com" />
        </label>
        {supplier && (
          <div className="field">
            <span>Estado</span>
            <Segmented value={active} onChange={setActive} options={[{ value: 'SI', label: 'Activo' }, { value: 'NO', label: 'Inactivo' }]} />
            <small className="muted">Un proveedor inactivo no aparece al registrar compras, pero conserva su historial.</small>
          </div>
        )}
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
