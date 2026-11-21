import { useEffect, useMemo, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import { useData } from '../services/store';
import { useAuth } from '../services/auth';
import type { Batch } from '../services/types';
import { Card, Chip, Kpi, Modal, PageHead, Segmented, Table, type Column } from '../components/ui';
import BatchForm from '../components/BatchForm';
import { dateTime, num, pct, unit } from '../utils/format';
import { batchStatus, can, formulaOf, maxVariation, recentBatches, toleranceOf } from '../utils/metrics';

type Filter = 'todas' | 'rango' | 'revisar';

/** En pantallas angostas el detalle se abre en una hoja en lugar de quedar al lado. */
function useNarrow() {
  const q = '(max-width: 1100px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

export default function CochadasPage() {
  const data = useData();
  const { user } = useAuth();
  const tolerance = toleranceOf(data);
  const narrow = useNarrow();
  const [filter, setFilter] = useState<Filter>('todas');
  const [selected, setSelected] = useState<number | undefined>(data.batches[0]?.id);
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState(false);

  const status = (b: Batch) => batchStatus(b, formulaOf(data, b), tolerance);
  const review = data.batches.filter((b) => status(b).tone !== 'ok').length;
  const rows = useMemo(() => data.batches.filter((b) => {
    const s = status(b).tone;
    return filter === 'todas' || (filter === 'rango' ? s === 'ok' : s !== 'ok');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [filter, data]);
  const batch = data.batches.find((b) => b.id === selected);
  const month = recentBatches(data, 30);
  const okPct = month.length ? (month.filter((b) => status(b).tone === 'ok').length * 100) / month.length : 0;

  const columns: Column<Batch>[] = [
    { key: 'code', label: 'Cochada', primary: true, render: (b) => <span className="mono strong">{b.code}</span> },
    { key: 'date', label: 'Fecha', render: (b) => dateTime(b.producedAt) },
    { key: 'bags', label: 'Bolsas', num: true, render: (b) => num(b.bags, 0) },
    { key: 'var', label: 'Variación máx.', num: true, hideSm: true, render: (b) => pct(maxVariation(b)) },
    { key: 'status', label: 'Estado', render: (b) => { const s = status(b); return <Chip tone={s.tone}>{s.label}</Chip>; } },
  ];

  const open = (b: Batch) => { setSelected(b.id); if (narrow) setSheet(true); };

  return (
    <>
      <PageHead title="Cochadas" subtitle={`Cada mezcla registrada, con su consumo real frente a la fórmula (tolerancia ±${tolerance} %).`}
        actions={can(user?.role, 'cochadas') && <button type="button" className="btn-primary" onClick={() => setForm(true)}><LuPlus /> Registrar cochada</button>} />

      <div className="grid kpis small-kpis">
        <Kpi label="Cochadas (30 días)" value={month.length} />
        <Kpi label="Bolsas (30 días)" value={num(month.reduce((s, b) => s + b.bags, 0), 0)} />
        <Kpi label="En rango" value={`${num(okPct, 0)} %`} />
        <Kpi label="Para revisar" value={review} />
      </div>

      <div className="toolbar mt">
        <Segmented value={filter} onChange={setFilter} options={[
          { value: 'todas', label: 'Todas', count: data.batches.length },
          { value: 'rango', label: 'En rango', count: data.batches.length - review },
          { value: 'revisar', label: 'Para revisar', count: review },
        ]} />
      </div>

      <div className={`grid ${narrow ? '' : 'two'} mt-sm`}>
        <Card flush>
          <Table columns={columns} rows={rows} rowKey={(b) => b.id} onRowClick={open} selectedKey={narrow ? undefined : selected} pageSize={20}
                 empty={data.batches.length ? 'No hay cochadas con este filtro.' : 'Todavía no hay cochadas registradas.'} />
        </Card>
        {!narrow && batch && <div className="sticky-side"><BatchDetail batch={batch} /></div>}
      </div>

      <Modal open={narrow && sheet && !!batch} title={batch ? `Cochada ${batch.code}` : ''} onClose={() => setSheet(false)}>
        {batch && <BatchDetail batch={batch} bare />}
      </Modal>
      <BatchForm open={form} onClose={() => setForm(false)} onCreated={(b) => { setFilter('todas'); setSelected(b.id); }} />
    </>
  );
}

function BatchDetail({ batch, bare }: { batch: Batch; bare?: boolean }) {
  const data = useData();
  const tolerance = toleranceOf(data);
  const formula = formulaOf(data, batch);
  const s = batchStatus(batch, formula, tolerance);
  const body = (
    <>
      <dl className="kv">
        <dt>Estado</dt><dd><Chip tone={s.tone}>{s.label}</Chip></dd>
        <dt>Fecha</dt><dd>{dateTime(batch.producedAt)}</dd>
        <dt>Fórmula</dt><dd>{formula?.name ?? '—'}</dd>
        <dt>Operario</dt><dd>{batch.operator ?? '—'}</dd>
        <dt>Bolsas</dt><dd>{num(batch.bags, 0)} <span className="muted">(esperado {formula?.minBags}–{formula?.maxBags})</span></dd>
        <dt>Peso</dt><dd>{num(batch.bags * (formula?.bagWeightKg ?? 25), 0)} kg</dd>
        {batch.notes && <><dt>Notas</dt><dd className="plain">{batch.notes}</dd></>}
      </dl>
      <h4 className="sub-title">Consumo de materiales</h4>
      <div className="consumptions">
        {batch.consumptions.map((c) => {
          const p = data.products.find((x) => x.id === c.productId);
          const out = Math.abs(c.variationPct) > tolerance;
          return (
            <div className="consumption" key={c.productId}>
              <div className="grow">
                <div className="strong">{p?.name}</div>
                <div className="muted small mono">Fórmula {num(c.theoretical, 3)} · Real {num(c.real, 3)} {unit(p?.unit ?? '')}</div>
              </div>
              <Chip tone={out ? 'warn' : 'ok'}>{pct(c.variationPct)}</Chip>
            </div>
          );
        })}
      </div>
    </>
  );
  if (bare) return body;
  return <Card title={<span className="mono">{batch.code}</span>}>{body}</Card>;
}
