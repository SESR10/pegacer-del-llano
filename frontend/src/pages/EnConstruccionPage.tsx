import { Link } from 'react-router-dom';

/** Ruta que no existe (todos los módulos ya están construidos). */
export default function EnConstruccionPage() {
  return (
    <div className="card wip">
      <div className="hz" />
      <h2>Página no encontrada</h2>
      <p>La dirección no corresponde a ningún módulo. <Link to="/">Volver al inicio</Link></p>
    </div>
  );
}
