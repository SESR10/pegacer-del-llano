import { useEffect, useMemo, useState } from 'react';
import { LuDownload, LuFileSpreadsheet, LuPrinter } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { useAuth } from '../services/auth';
import { Card, Kpi, PageHead, Segmented, Spinner, useToast } from '../components/ui';
import { can } from '../utils/metrics';
import { money } from '../utils/format';
import {
  consumptionReport, costReport, exportCsv, exportExcel, formatCell, inventoryReport, performanceReport, periodLabel, productionReport,
  type Group, type InvRow, type Period, type Report, type RTable,
} from '../utils/reports';

type Kind = 'produccion' | 'consumo' | 'costos' | 'inventario' | 'rendimiento';
type Preset = 'mes' | '30' | 'anterior' | 'otro';
const KINDS: { value: Kind; label: string }[] = [
  { value: 'produccion', label: 'Producción' }, { value: 'consumo', label: 'Consumo' }, { value: 'costos', label: 'Costos' },
  { value: 'inventario', label: 'Inventario' }, { value: 'rendimiento', label: 'Rendimiento' },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
function presetDates(p: Preset): [string, string] {
  const today = startOfDay(new Date());
  if (p === 'mes') return [iso(new Date(today.getFullYear(), today.getMonth(), 1)), iso(today)];
  if (p === 'anterior') return [iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)), iso(new Date(today.getFullYear(), today.getMonth(), 0))];
  const f = new Date(today); f.setDate(f.getDate() - 29);
  return [iso(f), iso(today)];
}

/** Reportes (Fase 14): producción, consumo, costos, inventario y rendimiento, con exportación a PDF, Excel y CSV. */
export default function ReportesPage() {
  const data = useData();
  const { inventoryReport: loadInventory, updateSetting } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const [kind, setKind] = useState<Kind>('produccion');
  const [preset, setPreset] = useState<Preset>('30');
  const [[fromS, toS], setRange] = useState<[string, string]>(() => presetDates('30'));
  const [group, setGroup] = useState<Group>('dia');
  const [inv, setInv] = useState<InvRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const company = data.settings['empresa.nombre'] ?? 'PEGACER DEL LLANO';

  const period: Period | null = useMemo(() => {
    const from = new Date(`${fromS}T00:00:00`); const to = new Date(`${toS}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return null;
    to.setDate(to.getDate() + 1);
    return { from, to };
  }, [fromS, toS]);

  useEffect(() => {
    if (kind !== 'inventario' || !period) return;
    setInv(null); setError(null);
    loadInventory(period.from, period.to).then(setInv).catch((e) => setError((e as Error).message));
  }, [kind, period, loadInventory, data]);

  const report: Report | null = useMemo(() => {
    if (!period) return null;
    if (kind === 'produccion') return productionReport(data, period, group);
    if (kind === 'consumo') return consumptionReport(data, period);
    if (kind === 'costos') return costReport(data, period);
    if (kind === 'rendimiento') return performanceReport(data, period);
    return inv ? inventoryReport(inv, data.products) : null;
  }, [kind, period, group, data, inv]);

  async function excel() {
    if (!report || !period) return;
    setExporting(true);
    try { await exportExcel(report, period, company); toast('Reporte descargado en Excel.'); }
    catch (e) { setError(`No se pudo generar el Excel: ${(e as Error).message}`); }
    finally { setExporting(false); }
  }

  return (
    <>
      <PageHead title="Reportes" subtitle="Elija el reporte y el periodo. Puede descargarlo en Excel o CSV, o guardarlo como PDF."
        actions={report && period && (
          <div className="export-actions">
            <button type="button" className="btn" onClick={() => window.print()}><LuPrinter /> PDF</button>
            <button type="button" className="btn" disabled={exporting} onClick={excel}><LuFileSpreadsheet /> {exporting ? 'Generando…' : 'Excel'}</button>
            <button type="button" className="btn" onClick={() => exportCsv(report, period, company)}><LuDownload /> CSV</button>
          </div>
        )} />

      <Card className="report-filters no-print">
        <div className="report-kinds"><Segmented value={kind} onChange={setKind} options={KINDS} /></div>
        <div className="report-period">
          <Segmented value={preset} onChange={(p) => { setPreset(p); if (p !== 'otro') setRange(presetDates(p)); }} options={[
            { value: '30', label: 'Últimos 30 días' }, { value: 'mes', label: 'Este mes' }, { value: 'anterior', label: 'Mes anterior' }, { value: 'otro', label: 'Otro' },
          ]} />
          <label className="date-field"><span>Desde</span><input type="date" value={fromS} max={toS} onChange={(e) => { setPreset('otro'); setRange([e.target.value, toS]); }} /></label>
          <label className="date-field"><span>Hasta</span><input type="date" value={toS} min={fromS} max={iso(new Date())} onChange={(e) => { setPreset('otro'); setRange([fromS, e.target.value]); }} /></label>
          {kind === 'produccion' && (
            <Segmented value={group} onChange={setGroup} options={[{ value: 'dia', label: 'Por día' }, { value: 'semana', label: 'Por semana' }, { value: 'mes', label: 'Por mes' }]} />
          )}
        </div>
      </Card>

      {!period && <div className="form-error mt">Revise las fechas: la fecha inicial debe ser anterior o igual a la final.</div>}
      {error && <div className="form-error mt">{error}</div>}

      {period && !report && !error && <Spinner label="Calculando el reporte…" />}
      {report && period && (
        <div className="report">
          <div className="print-head">
            <strong>{company}</strong>
            <h2>Reporte de {report.title.toLowerCase()}</h2>
            <span>{periodLabel(period)} · Generado el {new Date().toLocaleString('es-CO')} por {user?.fullName ?? '—'}</span>
          </div>
          <p className="muted report-period-label no-print">{periodLabel(period)}</p>
          {report.warnings.map((w) => <div key={w} className="notice mt-sm">{w}</div>)}
          <div className="grid kpis small-kpis mt-sm">
            {report.kpis.map((k) => <Kpi key={k.label} label={k.label} value={k.value} sub={k.sub} />)}
          </div>
          {kind === 'costos' && <OtherCosts allowed={can(user?.role, 'cochadas')} value={Number(data.settings['costo.otros_por_cochada'] ?? 0) || 0}
            onSave={async (v) => { await updateSetting('costo.otros_por_cochada', v); toast('Otros costos actualizados.'); }} />}
          {report.tables.map((t) => <ReportTableCard key={t.name} t={t} />)}
        </div>
      )}
    </>
  );
}

function ReportTableCard({ t }: { t: RTable }) {
  return (
    <Card className="mt report-card" flush title={t.name} extra={<span className="muted small">{t.rows.length} {t.rows.length === 1 ? 'fila' : 'filas'}</span>}>
      {t.rows.length ? (
        <div className="report-scroll">
          <table className="report-table">
            <thead><tr>{t.columns.map((c) => <th key={c.label} className={c.kind && c.kind !== 'text' && c.kind !== 'date' ? 'num' : ''}>{c.label}</th>)}</tr></thead>
            <tbody>
              {t.rows.map((r, i) => (
                <tr key={i}>{r.map((v, k) => <td key={k} className={t.columns[k].kind && t.columns[k].kind !== 'text' && t.columns[k].kind !== 'date' ? 'num mono' : k === 0 ? 'strong' : ''}>{formatCell(v, t.columns[k])}</td>)}</tr>
              ))}
            </tbody>
            {t.total && (
              <tfoot><tr>{t.total.map((v, k) => <td key={k} className={t.columns[k].kind && t.columns[k].kind !== 'text' && t.columns[k].kind !== 'date' ? 'num mono' : ''}>{k === 0 ? v : v === '' ? '' : formatCell(v, t.columns[k])}</td>)}</tr></tfoot>
            )}
          </table>
        </div>
      ) : <div className="empty">No hay datos en este periodo.</div>}
      {t.note && <p className="muted small report-note">{t.note}</p>}
    </Card>
  );
}

/** Otros costos por cochada (energía, mano de obra…). Se guardan como parámetro del sistema. */
function OtherCosts({ allowed, value, onSave }: { allowed: boolean; value: number; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="mt no-print other-costs">
      <div className="other-costs-row">
        <div>
          <strong>Otros costos por cochada: {money(value)}</strong>
          <p className="muted small m0">Energía, mano de obra, transporte u otros gastos que se suman al costo de materiales. Use 0 si no aplica.</p>
        </div>
        {allowed && !editing && <button type="button" className="btn" onClick={() => { setV(String(value)); setEditing(true); setError(null); }}>Cambiar</button>}
      </div>
      {editing && (
        <form className="other-costs-form" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setError(null);
          try { await onSave(v.replace(/[$.\s]/g, '').replace(',', '.')); setEditing(false); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
        }}>
          <div className="material-input"><input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} aria-label="Otros costos por cochada" /><span className="suffix">$</span></div>
          <button type="button" className="btn" onClick={() => setEditing(false)} disabled={busy}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
          {error && <div className="form-error">{error}</div>}
        </form>
      )}
    </Card>
  );
}
