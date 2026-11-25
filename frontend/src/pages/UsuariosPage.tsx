import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LuCheck, LuPencil, LuPlus } from 'react-icons/lu';
import { apiFetch, useAuth } from '../services/auth';
import { DEMO_ONLY } from '../services/data';
import { Card, Chip, Modal, PageHead, Segmented, Spinner, Table, useToast, type Column } from '../components/ui';

export interface AppUser { id: number; username: string; fullName: string; email: string | null; role: string; roleName: string; active: boolean }

export const ROLES: { code: string; name: string; can: string }[] = [
  { code: 'ADMIN', name: 'Administrador', can: 'Todo, incluidos usuarios, configuración y auditoría.' },
  { code: 'PRODUCCION', name: 'Producción', can: 'Cochadas, fórmulas, despachos y desperdicios.' },
  { code: 'INVENTARIO', name: 'Inventario', can: 'Productos, ajustes, despachos y desperdicios.' },
  { code: 'COMPRAS', name: 'Compras', can: 'Proveedores y compras.' },
  { code: 'GERENCIA', name: 'Gerencia', can: 'Solo consulta y reportes.' },
];

/** Demostración sin servidor: usuarios DEMO en memoria (se pierden al recargar). */
let demoUsers: AppUser[] = [
  { id: 1, username: 'admin', fullName: 'Administrador DEMO', email: null, role: 'ADMIN', roleName: 'Administrador', active: true },
  { id: 2, username: 'produccion', fullName: 'Jefe de Producción DEMO', email: null, role: 'PRODUCCION', roleName: 'Producción', active: true },
  { id: 3, username: 'inventario', fullName: 'Auxiliar de Inventario DEMO', email: null, role: 'INVENTARIO', roleName: 'Inventario', active: true },
  { id: 4, username: 'compras', fullName: 'Compras DEMO', email: null, role: 'COMPRAS', roleName: 'Compras', active: true },
  { id: 5, username: 'gerencia', fullName: 'Gerencia DEMO', email: null, role: 'GERENCIA', roleName: 'Gerencia', active: true },
];

/** Usuarios (Fase 15): solo el Administrador crea, edita, desactiva y cambia contraseñas. */
export default function UsuariosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = DEMO_ONLY || user?.role === 'ADMIN';
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AppUser | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (DEMO_ONLY) { setUsers([...demoUsers]); return; }
    try { setUsers(await apiFetch<AppUser[]>('/api/users')); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <>
        <PageHead title="Usuarios" subtitle="Cuentas de acceso y roles." />
        <div className="notice">Solo el Administrador puede ver y cambiar los usuarios.</div>
        <RolesCard />
      </>
    );
  }

  const columns: Column<AppUser>[] = [
    { key: 'name', label: 'Nombre', primary: true, render: (u) => <span className="strong">{u.fullName} {u.id === user?.id && <span className="muted small">(usted)</span>}</span> },
    { key: 'username', label: 'Usuario', render: (u) => <span className="mono">{u.username}</span> },
    { key: 'role', label: 'Rol', render: (u) => u.roleName },
    { key: 'email', label: 'Correo', hideSm: true, render: (u) => u.email ?? '—' },
    { key: 'active', label: 'Estado', render: (u) => <Chip tone={u.active ? 'ok' : 'neutral'}>{u.active ? 'Activo' : 'Inactivo'}</Chip> },
    { key: 'edit', label: '', width: 48, action: true, render: (u) => (
      <button type="button" className="icon-btn sm" aria-label={`Editar ${u.fullName}`} title="Editar" onClick={(e) => { e.stopPropagation(); setEditing(u); }}><LuPencil /></button>
    ) },
  ];

  return (
    <>
      <PageHead title="Usuarios" subtitle="Cuentas de acceso y roles. Un usuario inactivo no puede iniciar sesión, pero su historial se conserva."
        actions={<button type="button" className="btn-primary" onClick={() => setEditing(null)}><LuPlus /> Nuevo usuario</button>} />
      {DEMO_ONLY && <div className="notice">En la demostración los cambios no se guardan.</div>}
      {error && <div className="form-error">{error}</div>}
      <Card flush className={DEMO_ONLY ? 'mt' : ''}>
        {users ? <Table columns={columns} rows={users} rowKey={(u) => u.id} empty="No hay usuarios." onRowClick={(u) => setEditing(u)} /> : <Spinner label="Cargando usuarios…" />}
      </Card>
      <RolesCard />
      <UserForm open={editing !== undefined} target={editing ?? null} selfId={user?.id} onClose={() => setEditing(undefined)}
        onSaved={async (msg) => { toast(msg); await load(); }} />
    </>
  );
}

function RolesCard() {
  return (
    <Card className="mt" title="Qué puede hacer cada rol" extra={<span className="muted small">Todos pueden consultar</span>}>
      <div className="roles-grid">
        {ROLES.map((r) => <div key={r.code} className="role-item"><strong>{r.name}</strong><span className="muted small">{r.can}</span></div>)}
      </div>
    </Card>
  );
}

function UserForm({ open, target, selfId, onClose, onSaved }: { open: boolean; target: AppUser | null; selfId?: number; onClose: () => void; onSaved: (msg: string) => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PRODUCCION');
  const [active, setActive] = useState<'SI' | 'NO'>('SI');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const self = target?.id === selfId;

  useEffect(() => {
    if (!open) return;
    setUsername(target?.username ?? ''); setFullName(target?.fullName ?? ''); setEmail(target?.email ?? '');
    setRole(target?.role ?? 'PRODUCCION'); setActive(target?.active === false ? 'NO' : 'SI'); setPassword(''); setError(null);
  }, [open, target]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!target && !/^[a-zA-Z0-9._-]{3,50}$/.test(username.trim())) return setError('El usuario debe tener entre 3 y 50 letras, números, punto, guion o guion bajo.');
    if (!fullName.trim()) return setError('El nombre completo es obligatorio.');
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('El correo no es válido.');
    if ((!target || password) && (password.length < 8 || password.length > 72)) return setError('La contraseña debe tener entre 8 y 72 caracteres.');
    setBusy(true);
    try {
      const body = { fullName: fullName.trim(), email: email.trim() || null, role, active: active === 'SI', password: password || null };
      if (DEMO_ONLY) {
        const roleName = ROLES.find((r) => r.code === role)!.name;
        if (target) demoUsers = demoUsers.map((u) => (u.id === target.id ? { ...u, ...body, roleName } : u));
        else {
          if (demoUsers.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) throw new Error(`Ya existe el usuario ${username.trim()}.`);
          demoUsers = [...demoUsers, { id: Math.max(...demoUsers.map((u) => u.id)) + 1, username: username.trim(), ...body, roleName }];
        }
      } else if (target) {
        await apiFetch(`/api/users/${target.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/api/users', { method: 'POST', body: JSON.stringify({ username: username.trim(), fullName: body.fullName, email: body.email, role, password }) });
      }
      await onSaved(target ? `Usuario ${fullName.trim()} actualizado.` : `Usuario ${username.trim()} creado.`);
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
      <button type="submit" form="user-form" className="btn-primary" disabled={busy}><LuCheck /> {busy ? 'Guardando…' : target ? 'Guardar cambios' : 'Crear usuario'}</button>
    </>
  );

  return (
    <Modal open={open} title={target ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose} footer={footer}>
      <form id="user-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid two-cols">
          <label className="field">
            <span>Usuario</span>
            <input value={username} disabled={!!target} maxLength={50} autoComplete="off" onChange={(e) => setUsername(e.target.value)} placeholder="jperez" />
          </label>
          <label className="field">
            <span>Nombre completo</span>
            <input value={fullName} maxLength={120} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Pérez" />
          </label>
          <label className="field">
            <span>Correo <em>(opcional)</em></span>
            <input type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} placeholder="juan@empresa.com" />
          </label>
          <label className="field">
            <span>Rol</span>
            <select value={role} disabled={self && target?.role === 'ADMIN'} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </label>
        </div>
        <p className="muted small m0">{ROLES.find((r) => r.code === role)?.can}</p>
        <label className="field">
          <span>{target ? <>Nueva contraseña <em>(déjela vacía para no cambiarla)</em></> : 'Contraseña inicial'}</span>
          <input type="password" value={password} maxLength={72} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </label>
        {target && !self && (
          <div className="field">
            <span>Estado</span>
            <Segmented value={active} onChange={setActive} options={[{ value: 'SI', label: 'Activo' }, { value: 'NO', label: 'Inactivo' }]} />
          </div>
        )}
        {self && <p className="muted small m0">No puede quitarse el rol de administrador ni desactivar su propio usuario.</p>}
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
