import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LuMenu, LuLogOut } from 'react-icons/lu';
import { ALL_ITEMS, NAV } from './nav';
import { LOGIN_REQUIRED, useAuth } from '../services/auth';

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const current = ALL_ITEMS.find((i) => i.path === pathname) ?? ALL_ITEMS[0];

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
          {NAV.map((g) => (
            <div key={g.title}>
              <div className="nav-group">{g.title}</div>
              {g.items.map((it) => (
                <NavLink key={it.path} to={it.path} end={it.path === '/'}>
                  <it.icon /> {it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {user && <div className="user-box"><strong>{user.fullName}</strong>{user.roleName}</div>}
        <div className="sidebar-foot">
          {LOGIN_REQUIRED
            ? <button type="button" onClick={logout}><LuLogOut /> Cerrar sesión</button>
            : <><LuLogOut /> Demostración sin sesión</>}
        </div>
      </aside>
      <div className="backdrop" onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" aria-label="Abrir menú" onClick={() => setOpen(true)}><LuMenu /></button>
          <h1>{current.label}</h1>
          <span className="chip warn">Datos DEMO</span>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
