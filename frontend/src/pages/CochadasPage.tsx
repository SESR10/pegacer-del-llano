import { useMemo, useState } from 'react';
import { data, productById } from '../services/data';
import { Chip, PageHead } from '../components/ui';
import { dateTime, num, pct, unit } from '../utils/format';
import { batchStatus, formula, maxVariation, tolerance } from '../utils/metrics';

type Filter = 'todas' | 'rango' | 'revisar';

export default function CochadasPage() {
  const [filter, setFilter] = useState<Filter>('todas');
  const [selected, setSelected] = useState(data.batches[0]?.id);
  const rows = useMemo(() => data.batches.filter((b) => {
    const s = batchStatus(b).tone;
    return filter === 'todas' || (filter === 'rango' ? s === 'ok' : s !== 'ok');
  }), [filter]);
  const batch = data.batches.find((b) => b.id === selected);

  return (
    <>
      <PageHead title="Cochadas" subtitle={`Cada mezcla registrada, con su consumo real frente a la fórmula (tolerancia ±${tolerance} %).`}
        actions={<div className="filters">
          {(['todas', 'rango', 'revisar'] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {f === 'todas' ? 'Todas' : f === 'rango' ? 'En rango' : 'Para revisar'}
            </button>))}
        </div>} />
      <div className="grid two">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Cochada</th><th>Fecha</th><th className="num">Bolsas</th><th className="num hide-sm">Variación máx.</th><th>Estado</th></tr></thead>
              <tbody>
                {rows.map((b) => {
                  const s = batchStatus(b);
                  return (
                    <tr key={b.id} className={`clickable${b.id === selected ? ' selected' : ''}`} onClick={() => setSelected(b.id)}>
                      <td style={{ fontFamily: 'var(--mono)' }}>{b.code}</td>
                      <td>{dateTime(b.producedAt)}</td>
                      <td className="num">{num(b.bags, 0)}</td>
                      <td className="num hide-sm">{pct(maxVariation(b))}</td>
                      <td><Chip tone={s.tone}>{s.label}</Chip></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && <div className="empty">No hay cochadas con este filtro.</div>}
          </div>
        </div>
        {batch && (
          <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 76 }}>
            <h3>{batch.code} <Chip tone={batchStatus(batch).tone}>{batchStatus(batch).label}</Chip></h3>
            <dl className="kv">
              <dt>Fecha</dt><dd>{dateTime(batch.producedAt)}</dd>
              <dt>Fórmula</dt><dd>{formula?.name}</dd>
              <dt>Operario</dt><dd>{batch.operator}</dd>
              <dt>Bolsas</dt><dd>{num(batch.bags, 0)} (esperado {formula?.minBags}–{formula?.maxBags})</dd>
              <dt>Peso</dt><dd>{num(batch.bags * (formula?.bagWeightKg ?? 25), 0)} kg</dd>
            </dl>
            <h3 className="mt">Consumo de materiales</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Material</th><th className="num">Teórico</th><th className="num">Real</th><th className="num">Var.</th></tr></thead>
                <tbody>
                  {batch.consumptions.map((c) => {
                    const p = productById(c.productId);
                    const out = Math.abs(c.variationPct) > tolerance;
                    return (
                      <tr key={c.productId}>
                        <td>{p?.name}</td>
                        <td className="num">{num(c.theoretical, 2)} <span className="kpi-sub">{unit(p?.unit ?? '')}</span></td>
                        <td className="num">{num(c.real, 3)}</td>
                        <td className="num" style={{ color: out ? 'var(--red)' : undefined, fontWeight: out ? 700 : undefined }}>{pct(c.variationPct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
