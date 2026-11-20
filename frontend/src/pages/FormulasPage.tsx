import { data, productById } from '../services/data';
import { Chip, PageHead } from '../components/ui';
import { num, unit } from '../utils/format';
import { tolerance } from '../utils/metrics';

export default function FormulasPage() {
  return (
    <>
      <PageHead title="Fórmulas" subtitle="Receta de cada producto. Los valores se configuran aquí, no están escritos en el código." />
      <div className="notice">La edición de fórmulas por el administrador se habilita en la Fase 9. Estos son los valores de referencia informados por la empresa.</div>
      {data.formulas.map((f) => (
        <div className="grid two" key={f.id}>
          <div className="card">
            <h3>{f.name} <Chip tone="ok">Activa · v{f.version}</Chip></h3>
            <div className="kpi-sub" style={{ marginBottom: 12 }}>Producto: {f.product}</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Material por cochada</th><th className="num">Cantidad</th><th>Unidad</th></tr></thead>
                <tbody>
                  {f.items.map((i) => {
                    const p = productById(i.productId);
                    return <tr key={i.productId}><td>{p?.name}</td><td className="num">{num(i.quantity, 2)}</td><td>{unit(p?.unit ?? '')}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ alignSelf: 'start' }}>
            <h3>Resultado esperado</h3>
            <dl className="kv">
              <dt>Bolsas por cochada</dt><dd>{f.minBags}–{f.maxBags} (meta {f.expectedBags})</dd>
              <dt>Peso por bolsa</dt><dd>{num(f.bagWeightKg)} kg</dd>
              <dt>Producción por cochada</dt><dd>≈ {num(f.expectedBags * f.bagWeightKg, 0)} kg</dd>
              <dt>Tolerancia de consumo</dt><dd>±{tolerance} %</dd>
            </dl>
          </div>
        </div>
      ))}
      <div className="card mt">
        <h3>Pegante para enchape premium <Chip tone="neutral">Sin fórmula</Chip></h3>
        <p className="kpi-sub" style={{ margin: 0 }}>La empresa debe entregar la receta y los costos de este producto para registrarlos.</p>
      </div>
    </>
  );
}
