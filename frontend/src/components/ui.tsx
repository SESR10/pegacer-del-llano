import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { LuCheckCircle2, LuX, LuInbox } from 'react-icons/lu';

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="page-head-text"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, extra, children, className = '', flush }: { title?: ReactNode; extra?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={`card${flush ? ' flush' : ''} ${className}`}>
      {(title || extra) && <header className="card-head"><h3>{title}</h3>{extra && <div className="card-extra">{extra}</div>}</header>}
      {children}
    </section>
  );
}

export type ChipTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

export function Kpi({ icon, tone = 'info', label, value, sub }: { icon?: ReactNode; tone?: ChipTone; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card kpi">
      {icon && <div className={`kpi-icon ${tone}`}>{icon}</div>}
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
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

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty"><LuInbox />{children}</div>;
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}{o.count !== undefined && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Tabla que en el celular se convierte en tarjetas: cada fila es un bloque y cada celda muestra su título.
 * Las columnas con "primary" van como encabezado de la tarjeta.
 */
export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  num?: boolean;
  primary?: boolean;
  hideSm?: boolean;
  width?: number | string;
  /** Botón de la fila: en el celular va en la esquina de la tarjeta. */
  action?: boolean;
}

export function Table<T>({ columns, rows: all, rowKey, onRowClick, selectedKey, empty = 'No hay registros.', pageSize }: {
  columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string | number; onRowClick?: (row: T) => void;
  selectedKey?: string | number; empty?: string; pageSize?: number;
}) {
  const [limit, setLimit] = useState(pageSize ?? Infinity);
  useEffect(() => { setLimit(pageSize ?? Infinity); }, [all.length, pageSize]);
  if (!all.length) return <Empty>{empty}</Empty>;
  const rows = all.slice(0, limit);
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{columns.map((c) => <th key={c.key} className={`${c.num ? 'num' : ''}${c.hideSm ? ' hide-sm' : ''}`} style={{ width: c.width }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => {
            const k = rowKey(r);
            return (
              <tr key={k} className={`${onRowClick ? 'clickable' : ''}${k === selectedKey ? ' selected' : ''}`}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(r); } : undefined}>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.label} className={`${c.num ? 'num' : ''}${c.primary ? ' primary' : ''}${c.hideSm ? ' hide-sm' : ''}${c.action ? ' action' : ''}`}>{c.render(r)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {all.length > rows.length && (
        <div className="more"><button type="button" className="btn small" onClick={() => setLimit((l) => l + (pageSize ?? 20))}>Ver más ({all.length - rows.length})</button></div>
      )}
    </div>
  );
}

/** Ventana emergente: centrada en escritorio y como hoja que sube desde abajo en el celular. */
export function Modal({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll'); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`modal${wide ? ' wide' : ''}`}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}><LuX /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

/* ---------- Avisos breves (toast) ---------- */
const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);
  const show = useCallback((m: string) => setMsg(m), []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && <div className="toast" role="status"><LuCheckCircle2 /> {msg}</div>}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function Spinner({ label }: { label?: string }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}
