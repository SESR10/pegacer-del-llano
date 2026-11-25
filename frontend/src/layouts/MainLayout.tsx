import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LuMenu, LuLogOut, LuBell, LuMoreHorizontal, LuRefreshCw } from 'react-icons/lu';
import { ALL_ITEMS, mobileTabs, navFor } from './nav';
import { LOGIN_REQUIRED, useAuth } from '../services/auth';
import { useStore } from '../services/store';
import { Spinner } from '../components/ui';

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { data, error, live, reload } = useStore();
  const { pathname } = useLocation();
  const current = ALL_ITEMS.find((i) => i.path === pathname) ?? ALL_ITEMS[0];
  const nav = navFor(user?.role);
  const tabs = mobileTabs(user?.role);
  const firstName = user?.fullName.split(/\s+/)[0];
  const alerts = data?.alerts.length ?? 0;

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className={`app${open ? ' open' : ''}`}>
      <aside className="sidebar" aria-label="Menú principal">
        <div className="brand">
          <div className="brand-logo">P</div>
          <div>
            <div className="brand-name">PEGACER DEL LLANO</div>
            <div className="brand-sub">Sistema Integral de Producción</div>
          </div>
        </div>
        <div className="hazard" />
        <nav className="nav">
          {nav.map((g) => (
            <div key={g.title}>
              <div className="nav-group">{g.title}</div>
              {g.items.map((it) => (
                <NavLink key={it.path} to={it.path} end={it.path === '/'}>
                  <it.icon /> <span>{it.label}</span>
                  {it.path === '/alertas' && alerts > 0 && <span className="nav-badge">{alerts}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">{user ? initials(user.fullName) : 'D'}</div>
          <div className="who">
            <strong>{user?.fullName ?? 'Demostración'}</strong>
            <span>{user?.roleName ?? 'Sin sesión'}</span>
          </div>
          {LOGIN_REQUIRED && <button type="button" className="icon-btn dark" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión"><LuLogOut /></button>}
        </div>
      </aside>
      <div className="backdrop" onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Abrir menú" onClick={() => setOpen(true)}><LuMenu /></button>
          {/* En el celular, el nombre de la pantalla; en el computador ya está en el título de la página, así que se saluda. */}
          <div className="topbar-title">
            <span className="topbar-page">{current.label}</span>
            <span className="topbar-hello">{firstName ? `Hola, ${firstName}` : 'Bienvenido'}{user?.roleName && <em> · {user.roleName}</em>}</span>
          </div>
          <span className={`status-pill ${live ? 'live' : 'demo'}`}><i />{live ? 'En línea' : 'Demostración'}</span>
          <Link to="/alertas" className="icon-btn bell" aria-label={`Alertas: ${alerts}`}>
            <LuBell />{alerts > 0 && <span className="dot">{alerts > 9 ? '9+' : alerts}</span>}
          </Link>
        </header>

        <main className="content">
          {data ? <Outlet /> : error ? (
            <div className="card load-error">
              <h3>No se pudieron cargar los datos</h3>
              <p>{error}</p>
              <button type="button" className="btn" onClick={reload}><LuRefreshCw /> Reintentar</button>
            </div>
          ) : <Spinner label="Cargando datos…" />}
        </main>
      </div>

      <nav className="tabbar" aria-label="Accesos rápidos">
        {tabs.map((path) => {
          const it = ALL_ITEMS.find((i) => i.path === path)!;
          return (
            <NavLink key={path} to={path} end={path === '/'}>
              <span className="tab-icon"><it.icon />{path === '/alertas' && alerts > 0 && <span className="dot">{alerts > 9 ? '9+' : alerts}</span>}</span>
              {it.label}
            </NavLink>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className={tabs.includes(pathname) ? '' : 'active'}>
          <span className="tab-icon"><LuMoreHorizontal /></span>Más
        </button>
      </nav>
    </div>
  );
}
