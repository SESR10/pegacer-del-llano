import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEMO_ONLY } from './data';

/**
 * Sesión del usuario (Fase 4). El backend entrega un token JWT al iniciar sesión; se guarda en el
 * navegador y se envía en cada petición como "Authorization: Bearer <token>".
 * En la compilación de demostración (VITE_DEMO_ONLY) no hay backend y se entra sin login.
 */
export interface SessionUser { id: number; username: string; fullName: string; email: string | null; role: string; roleName: string; }
/** privacyPending: falta aceptar la versión vigente de la Política de Tratamiento de Datos (Ley 1581 de 2012). */
interface Session { token: string; expiresAt: string; user: SessionUser; privacyPending?: boolean; }

const KEY = 'pegacer.session';
const API = import.meta.env.VITE_API_URL ?? '';

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return new Date(s.expiresAt).getTime() > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function save(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* navegador sin almacenamiento: la sesión dura hasta recargar */
  }
}

/** fetch con el token y el formato {success, message, data} del API. Lanza Error con el mensaje del servidor. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await apiFetchFull<T>(path, init)).data;
}

/** Igual que apiFetch, pero devuelve también el mensaje del servidor (ej: "Producto eliminado."). */
export async function apiFetchFull<T>(path: string, init: RequestInit = {}): Promise<{ data: T; message: string | null }> {
  const session = load();
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revise su conexión.');
  }
  const body = await res.json().catch(() => null);
  if (res.status === 401 && session) {
    save(null);
    window.dispatchEvent(new Event('pegacer:logout'));
  }
  if (!res.ok || !body?.success) throw new Error(body?.message ?? 'Ocurrió un error inesperado.');
  return { data: body.data as T, message: body.message ?? null };
}

interface AuthState {
  user: SessionUser | null;
  /** true mientras el usuario no acepte la política de datos vigente. Las sesiones viejas (sin el dato) también. */
  privacyPending: boolean;
  login: (username: string, password: string) => Promise<void>;
  acceptPrivacy: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null, privacyPending: false, login: async () => {}, acceptPrivacy: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => load());

  const logout = useCallback(() => { save(null); setSession(null); }, []);

  useEffect(() => {
    const onLogout = () => setSession(null);
    window.addEventListener('pegacer:logout', onLogout);
    return () => window.removeEventListener('pegacer:logout', onLogout);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const s = await apiFetch<Session>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    save(s);
    setSession(s);
  }, []);

  const acceptPrivacy = useCallback(async () => {
    await apiFetch('/api/auth/privacy/accept', { method: 'POST' });
    const current = load();
    if (!current) return;
    const s = { ...current, privacyPending: false };
    save(s);
    setSession(s);
  }, []);

  const privacyPending = !!session && session.privacyPending !== false;
  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, privacyPending, login, acceptPrivacy, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const LOGIN_REQUIRED = !DEMO_ONLY;
