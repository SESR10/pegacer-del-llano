import { useEffect, useState } from 'react';
import { LuArrowLeft, LuLogOut, LuShieldCheck } from 'react-icons/lu';
import { useAuth } from '../services/auth';
import PoliticaTexto from '../legal/PoliticaTexto';
import { EMPRESA } from '../legal/empresa';

/** El hash actual de la dirección (#/privacidad), para mostrar la política sin haber iniciado sesión. */
export function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-logo">P</div>
      <div>
        <div className="brand-name">PEGACER DEL LLANO</div>
        <div className="brand-sub">Sistema Integral de Producción</div>
      </div>
    </div>
  );
}

/** Política pública, enlazada desde la pantalla de inicio de sesión. */
export function PoliticaPublica() {
  return (
    <div className="login-screen legal-screen">
      <div className="legal-card">
        <Brand />
        <div className="hazard" />
        <div className="legal-body">
          <a className="btn" href="#/"><LuArrowLeft /> Volver a iniciar sesión</a>
          <h2>Política de tratamiento de datos personales</h2>
          <PoliticaTexto />
        </div>
      </div>
    </div>
  );
}

/**
 * Autorización del titular (Ley 1581 de 2012, art. 9; Decreto 1377 de 2013, art. 7): se pide al entrar por
 * primera vez y cada vez que cambia la versión de la política. Sin aceptarla no se puede usar el sistema.
 */
export function AutorizacionDatos() {
  const { user, acceptPrivacy, logout } = useAuth();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await acceptPrivacy();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="login-screen legal-screen">
      <div className="legal-card">
        <Brand />
        <div className="hazard" />
        <div className="legal-body">
          <h2><LuShieldCheck /> Autorización para el tratamiento de datos</h2>
          <p className="lead">
            Hola{user ? `, ${user.fullName}` : ''}. Antes de continuar, lea cómo {EMPRESA.razonSocial} usa y protege sus datos personales.
          </p>
          <div className="legal-scroll" tabIndex={0}><PoliticaTexto /></div>
          <label className="legal-check">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>
              He leído la Política de Tratamiento de Datos Personales y los términos de uso, y autorizo de manera previa,
              expresa e informada el tratamiento de mis datos para las finalidades descritas.
            </span>
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="legal-actions">
            <button type="button" className="btn" onClick={logout}><LuLogOut /> Salir</button>
            <button type="button" className="btn-primary" disabled={!checked || busy} onClick={accept}>
              {busy ? 'Guardando…' : 'Acepto y continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
