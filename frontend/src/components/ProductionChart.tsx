import { useState } from 'react';
import { num } from '../utils/format';

interface Day { day: Date; bags: number; batches: number; }

/** Gráfico de barras en SVG: bolsas por día y línea de meta (mínimo por cochada × cochadas). */
export default function ProductionChart({ days, min }: { days: Day[]; min: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 220, L = 34, B = 24, T = 10;
  const max = Math.max(...days.map((d) => d.bags), min * 2) * 1.1;
  const bw = (W - L) / days.length;
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  const ticks = [0, Math.round(max / 2 / 10) * 10, Math.round((max * 0.9) / 10) * 10];
  const h = hover !== null ? days[hover] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bolsas producidas por día">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={L - 6} y={y(t) + 3} textAnchor="end">{t}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const low = d.batches > 0 && d.bags < d.batches * min;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - B - T} fill="transparent" />
              {d.bags > 0 && (
                <rect x={L + i * bw + bw * 0.18} y={y(d.bags)} width={bw * 0.64} height={H - B - y(d.bags)} rx={2}
                      fill={low ? 'var(--amber)' : hover === i ? 'var(--navy-500)' : 'var(--navy-700)'} />
              )}
              {i % 5 === 0 && (
                <text x={L + i * bw + bw / 2} y={H - 6} textAnchor="middle">
                  {d.day.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).replace('.', '')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {h && (
        <div className="card" style={{ position: 'absolute', top: 0, right: 0, padding: '8px 12px', fontSize: 12.5 }}>
          <strong>{h.day.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><br />
          {h.batches ? `${h.batches} cochada${h.batches > 1 ? 's' : ''} · ${num(h.bags, 0)} bolsas` : 'Sin producción'}
        </div>
      )}
      <div className="legend">
        <span><i style={{ background: 'var(--navy-700)' }} />Producción en rango</span>
        <span><i style={{ background: 'var(--amber)' }} />Alguna cochada bajo {min} bolsas</span>
      </div>
    </div>
  );
}
