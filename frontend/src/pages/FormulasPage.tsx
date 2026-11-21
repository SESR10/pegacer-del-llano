import { useData } from '../services/store';
import { Card, Chip, PageHead } from '../components/ui';
import { num, unit } from '../utils/format';
import { toleranceOf } from '../utils/metrics';

export default function FormulasPage() {
  const data = useData();
  const tolerance = toleranceOf(data);
  const withFormula = new Set(data.formulas.map((f) => f.productId ?? data.products.find((p) => p.name === f.product)?.id));
  const missing = data.products.filter((p) => p.category === 'PRODUCTO_TERMINADO' && !withFormula.has(p.id));

  return (
    <>
      <PageHead title="Fórmulas" subtitle="Receta de cada producto. Los valores se configuran aquí, no están escritos en el código." />
      <div className="notice">La edición de fórmulas por el administrador se habilita en la Fase 9.</div>
      {data.formulas.map((f) => (
        <div className="grid two mb" key={f.id}>
          <Card title={f.name} extra={<Chip tone={f.active === false ? 'neutral' : 'ok'}>{f.active === false ? 'Inactiva' : 'Activa'} · v{f.version}</Chip>} flush>
            <p className="muted card-pad">Producto: {f.product}</p>
            <ul className="list">
              {f.items.map((i) => {
                const p = data.products.find((x) => x.id === i.productId);
                return (
                  <li key={i.productId}>
                    <span className="strong">{p?.name}</span>
                    <span className="mono">{num(i.quantity, 2)} <span className="muted">{unit(p?.unit ?? '')}</span></span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title="Resultado esperado" className="self-start">
            <dl className="kv">
              <dt>Bolsas por cochada</dt><dd>{f.minBags}–{f.maxBags} <span className="muted">(meta {f.expectedBags})</span></dd>
              <dt>Peso por bolsa</dt><dd>{num(f.bagWeightKg)} kg</dd>
              <dt>Producción por cochada</dt><dd>≈ {num(f.expectedBags * f.bagWeightKg, 0)} kg</dd>
              <dt>Tolerancia de consumo</dt><dd>±{tolerance} %</dd>
            </dl>
          </Card>
        </div>
      ))}
      {missing.map((p) => (
        <Card key={p.id} title={p.name} extra={<Chip tone="neutral">Sin fórmula</Chip>}>
          <p className="muted m0">La empresa debe entregar la receta y los costos de este producto para registrarlos.</p>
        </Card>
      ))}
    </>
  );
}
