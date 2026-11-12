import { useState } from 'react';
import { data } from '../services/data';
import type { Category } from '../services/types';
import { PageHead, StockBar, StockChip } from '../components/ui';
import { dateTime, isEntry, MOVEMENT_LABEL, num, unit } from '../utils/format';
import { stockStatus } from '../utils/metrics';

const CAT_LABEL: Record<Category, string> = { MATERIA_PRIMA: 'Materia prima', INSUMO: 'Insumo', PRODUCTO_TERMINADO: 'Producto terminado' };

export default function InventarioPage({ only, title, subtitle }: { only?: Category[]; title?: string; subtitle?: string }) {
  const products = data.products.filter((p) => !only || only.includes(p.category));
  const [selected, setSelected] = useState(products[0]?.id);
  const product = products.find((p) => p.id === selected);
  const kardex = data.movements.filter((m) => m.productId === selected).slice().reverse();

  return (
    <>
      <PageHead title={title ?? 'Inventario'} subtitle={subtitle ?? 'Existencias actuales y kardex de cada producto. Cada movimiento guarda el stock antes y después.'} />
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Producto</th><th className="hide-sm">Tipo</th><th className="num">Stock</th><th className="num hide-sm">Mínimo</th><th className="hide-sm" style={{ width: 160 }}>Nivel</th><th>Estado</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={`clickable${p.id === selected ? ' selected' : ''}`} onClick={() => setSelected(p.id)}>
                  <td style={{ fontFamily: 'var(--mono)' }}>{p.code}</td>
                  <td>{p.name}</td>
                  <td className="hide-sm">{CAT_LABEL[p.category]}</td>
                  <td className="num">{num(p.stock)} <span className="kpi-sub">{unit(p.unit)}</span></td>
                  <td className="num hide-sm">{num(p.minStock)}</td>
                  <td className="hide-sm"><StockBar stock={p.stock} min={p.minStock} /></td>
                  <td><StockChip status={stockStatus(p)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {product && (
        <div className="card mt">
          <h3>Kardex · {product.name} <span className="kpi-sub">{kardex.length} movimientos</span></h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Movimiento</th><th className="num">Cantidad</th><th className="num hide-sm">Antes</th><th className="num">Después</th></tr></thead>
              <tbody>
                {kardex.slice(0, 40).map((m) => (
                  <tr key={m.id}>
                    <td>{dateTime(m.at)}</td>
                    <td>{MOVEMENT_LABEL[m.type] ?? m.type}</td>
                    <td className="num" style={{ color: isEntry(m.type) ? 'var(--green)' : 'var(--red)' }}>{isEntry(m.type) ? '+' : '−'}{num(m.quantity, 3)}</td>
                    <td className="num hide-sm">{num(m.before, 3)}</td>
                    <td className="num">{num(m.after, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!kardex.length && <div className="empty">Este producto no tiene movimientos.</div>}
          </div>
        </div>
      )}
    </>
  );
}
