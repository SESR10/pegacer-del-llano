import { useEffect, useState } from 'react';
import { LuPencil, LuPlus, LuSlidersHorizontal } from 'react-icons/lu';
import { useData, useStore } from '../services/store';
import { useAuth } from '../services/auth';
import ProductForm from '../components/ProductForm';
import AdjustForm from '../components/AdjustForm';
import type { Category, Movement, Product } from '../services/types';
import { Card, PageHead, Segmented, Spinner, StockBar, StockChip, Table, type Column } from '../components/ui';
import { dateTime, isEntry, MOVEMENT_LABEL, num, unit } from '../utils/format';
import { can, stockStatus } from '../utils/metrics';

const CAT_LABEL: Record<Category, string> = { MATERIA_PRIMA: 'Materia prima', INSUMO: 'Insumo', PRODUCTO_TERMINADO: 'Producto terminado' };

export default function InventarioPage({ only, title, subtitle, catalog }: { only?: Category[]; title?: string; subtitle?: string; catalog?: boolean }) {
  const data = useData();
  const { user } = useAuth();
  const allowed = can(user?.role, 'inventario');
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [adjusting, setAdjusting] = useState<number | undefined | false>(false);
  const products = data.products.filter((p) => !only || only.includes(p.category));
  const [cat, setCat] = useState<'todos' | Category>('todos');
  const shown = products.filter((p) => cat === 'todos' || p.category === cat);
  const [selected, setSelected] = useState(products[0]?.id);
  const product = products.find((p) => p.id === selected);
  const cats = [...new Set(products.map((p) => p.category))];

  const columns: Column<Product>[] = [
    { key: 'name', label: 'Producto', primary: true, render: (p) => <div><div className="strong">{p.name}</div><div className="muted small mono">{p.code}</div></div> },
    { key: 'cat', label: 'Tipo', hideSm: true, render: (p) => CAT_LABEL[p.category] },
    { key: 'stock', label: 'Stock', num: true, render: (p) => <>{num(p.stock)} <span className="muted">{unit(p.unit)}</span></> },
    { key: 'min', label: 'Mínimo', num: true, hideSm: true, render: (p) => num(p.minStock) },
    { key: 'bar', label: 'Nivel', hideSm: true, width: 150, render: (p) => <StockBar stock={p.stock} min={p.minStock} /> },
    { key: 'status', label: 'Estado', render: (p) => <StockChip status={stockStatus(p)} /> },
  ];
  if (catalog && allowed) {
    columns.push({ key: 'edit', label: '', width: 48, action: true, render: (p) => (
      <button type="button" className="icon-btn sm" aria-label={`Editar ${p.name}`} title="Editar"
              onClick={(e) => { e.stopPropagation(); setEditing(p); }}><LuPencil /></button>
    ) });
  }

  const actions = allowed && (catalog
    ? <button type="button" className="btn-primary" onClick={() => setEditing(null)}><LuPlus /> Nuevo producto</button>
    : <button type="button" className="btn-primary" onClick={() => setAdjusting(undefined)}><LuSlidersHorizontal /> Ajustar inventario</button>);

  return (
    <>
      <PageHead title={title ?? 'Inventario'} subtitle={subtitle ?? 'Existencias actuales y kardex de cada producto. Toque un producto para ver sus movimientos.'} actions={actions} />
      {cats.length > 1 && (
        <div className="toolbar">
          <Segmented value={cat} onChange={setCat} options={[{ value: 'todos', label: 'Todos', count: products.length },
            ...cats.map((c) => ({ value: c, label: CAT_LABEL[c], count: products.filter((p) => p.category === c).length }))]} />
        </div>
      )}
      <Card flush className={cats.length > 1 ? 'mt-sm' : ''}>
        <Table columns={columns} rows={shown} rowKey={(p) => p.id} onRowClick={(p) => setSelected(p.id)} selectedKey={selected} />
      </Card>
      {product && <Kardex product={product} onAdjust={allowed ? () => setAdjusting(product.id) : undefined} />}
      <ProductForm open={editing !== undefined} product={editing} onClose={() => setEditing(undefined)} />
      <AdjustForm open={adjusting !== false} productId={adjusting || undefined} onClose={() => setAdjusting(false)} />
    </>
  );
}

function Kardex({ product, onAdjust }: { product: Product; onAdjust?: () => void }) {
  const { kardex, data } = useStore();
  const [rows, setRows] = useState<Movement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null); setError(null);
    kardex(product.id).then((r) => alive && setRows(r)).catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, [product.id, product.stock, kardex, data]);

  const columns: Column<Movement>[] = [
    { key: 'type', label: 'Movimiento', primary: true, render: (m) => <span className="strong">{MOVEMENT_LABEL[m.type] ?? m.type}</span> },
    { key: 'at', label: 'Fecha', render: (m) => dateTime(m.at) },
    { key: 'qty', label: 'Cantidad', num: true, render: (m) => <span className={isEntry(m.type) ? 'pos' : 'neg'}>{isEntry(m.type) ? '+' : '−'}{num(m.quantity, 3)}</span> },
    { key: 'before', label: 'Antes', num: true, hideSm: true, render: (m) => num(m.before, 3) },
    { key: 'after', label: 'Después', num: true, render: (m) => num(m.after, 3) },
  ];

  return (
    <Card className="mt" flush title={<>Kardex · {product.name}</>} extra={<div className="card-actions">{rows && <span className="muted hide-sm">{rows.length} movimientos recientes</span>}
        {onAdjust && <button type="button" className="btn small" onClick={onAdjust}><LuSlidersHorizontal /> Ajustar</button>}</div>}>
      {error ? <div className="form-error m">{error}</div> : !rows ? <Spinner label="Cargando movimientos…" />
        : <Table columns={columns} rows={rows} rowKey={(m) => m.id} pageSize={15} empty="Este producto no tiene movimientos." />}
    </Card>
  );
}
