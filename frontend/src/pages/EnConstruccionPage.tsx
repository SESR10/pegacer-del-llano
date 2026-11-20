import { useLocation } from 'react-router-dom';
import { ALL_ITEMS } from '../layouts/nav';

export default function EnConstruccionPage() {
  const { pathname } = useLocation();
  const item = ALL_ITEMS.find((i) => i.path === pathname);
  return (
    <div className="card wip">
      <div className="hz" />
      <h2>{item?.label ?? 'Módulo'} en construcción</h2>
      <p>Este módulo se construye en la Fase {item?.phase ?? '—'} del plan de desarrollo.</p>
    </div>
  );
}
