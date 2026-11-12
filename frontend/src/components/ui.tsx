import type { ReactNode } from 'react';

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {actions}
    </div>
  );
}

export function Kpi({ icon, label, value, sub }: { icon?: ReactNode; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card">
      <div className="kpi-label">{icon}{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function Chip({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'info' | 'neutral'; children: ReactNode }) {
  return <span className={`chip ${tone}`}>{children}</span>;
}

export function StockChip({ status }: { status: 'AGOTADO' | 'CRITICO' | 'OK' }) {
  if (status === 'AGOTADO') return <Chip tone="bad">Agotado</Chip>;
  if (status === 'CRITICO') return <Chip tone="warn">Crítico</Chip>;
  return <Chip tone="ok">Normal</Chip>;
}

export function StockBar({ stock, min }: { stock: number; min: number }) {
  const scale = Math.max(stock, min * 2, 1);
  const color = stock <= 0 ? 'var(--red)' : stock < min ? 'var(--amber)' : 'var(--green)';
  return (
    <div className="bar" title={`Mínimo: ${min}`}>
      <span style={{ width: `${Math.min(100, (stock / scale) * 100)}%`, background: color }} />
      <i className="min-mark" style={{ left: `${(min / scale) * 100}%` }} />
    </div>
  );
}
