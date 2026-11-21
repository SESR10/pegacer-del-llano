import { useEffect, useRef, useState } from 'react';
import { num } from '../utils/format';

interface Day { day: Date; bags: number; batches: number; }

/** Ancho real del contenedor, para que el gráfico se dibuje a su tamaño (letras legibles también en el celular). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Gráfico de barras en SVG: bolsas por día. Las barras ámbar son días con alguna cochada bajo el mínimo. */
export default function ProductionChart({ days, min }: { days: Day[]; min: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth<HTMLDivElement>();
  const H = W < 480 ? 180 : 220, L = 30, B = 22, T = 10;
  const max = Math.max(...days.map((d) => d.bags), min * 2) * 1.1;
  const bw = (W - L) / days.length;
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  const ticks = [0, Math.round(max / 2 / 10) * 10, Math.round((max * 0.9) / 10) * 10];
  const every = W < 480 ? 7 : 5;
  const h = hover !== null ? days[hover] : null;

  return (
    <div className="chart-box" ref={ref}>
      <svg className="chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bolsas producidas por día">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={L - 6} y={y(t) + 3} textAnchor="end">{t}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const low = d.batches > 0 && d.bags < d.batches * min;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - B - T} fill="transparent" />
              {d.bags > 0 && (
                <rect x={L + i * bw + bw * 0.18} y={y(d.bags)} width={Math.max(2, bw * 0.64)} height={H - B - y(d.bags)} rx={2}
                      fill={low ? 'var(--amber)' : hover === i ? 'var(--navy-500)' : 'var(--navy-700)'} />
              )}
              {(days.length - 1 - i) % every === 0 && (
                <text x={L + i * bw + bw / 2} y={H - 6} textAnchor="middle">
                  {d.day.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).replace('.', '')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {h && (
        <div className="chart-tip">
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
