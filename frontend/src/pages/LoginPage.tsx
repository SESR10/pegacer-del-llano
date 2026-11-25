import { useState, type FormEvent } from 'react';
import { LuLogIn } from 'react-icons/lu';
import { useAuth } from '../services/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Escriba su usuario y contraseña.');
      return;
    }
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div>
        <form className="login-card" onSubmit={submit} noValidate>
          <div className="brand">
            <div className="brand-logo">P</div>
            <div>
              <div className="brand-name">PEGACER DEL LLANO</div>
              <div className="brand-sub">Sistema Integral de Producción</div>
            </div>
          </div>
          <div className="hazard" />
          <div className="login-body">
            <h2>Iniciar sesión</h2>
            <p className="lead">Ingrese con el usuario que le asignó el administrador.</p>
            <label className="field">
              <span>Usuario</span>
              <input autoFocus autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="btn-primary" type="submit" disabled={busy}>
              <LuLogIn /> {busy ? 'Ingresando…' : 'Ingresar'}
            </button>
          </div>
        </form>
        <div className="login-foot">
          Producción · Inventario · Alertas
          <a className="login-legal" href="#/privacidad">Política de tratamiento de datos personales</a>
        </div>
      </div>
    </div>
  );
}
