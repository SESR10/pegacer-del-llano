export type Category = 'MATERIA_PRIMA' | 'INSUMO' | 'PRODUCTO_TERMINADO';

export interface Product { id: number; code: string; name: string; category: Category; unit: string; stock: number; minStock: number; unitCost?: number | null; }
export interface FormulaItem { productId: number; quantity: number; }
export interface Formula {
  id: number; name: string; version: number; product: string; productId?: number; active?: boolean;
  expectedBags: number; minBags: number; maxBags: number; bagWeightKg: number; items: FormulaItem[]; createdAt?: string;
}
export interface Consumption { productId: number; theoretical: number; real: number; variationPct: number; }
export interface Batch {
  id: number; code: string; producedAt: string; bags: number; operator: string | null; consumptions: Consumption[];
  formulaId?: number; notes?: string | null;
}
export interface Movement { id: number; productId: number; type: string; quantity: number; before: number; after: number; refType: string | null; at: string; user?: string | null; notes?: string | null; }
export interface Purchase { code: string; at: string; supplier: string; supplierId?: number; invoice: string; productId: number; quantity: number; unitCost?: number | null; }
export interface Dispatch { code: string; at: string; customer: string; productId: number; quantity: number; }
export interface Waste { productId: number; quantity: number; reason: string; at: string; }
export interface Supplier { id: number; nit: string; name: string; phone: string; city: string; email?: string | null; active?: boolean; }
export interface Alert { id: number; type: string; severity: 'ALTA' | 'MEDIA' | 'INFO'; message: string; at: string; productId?: number | null; batchCode?: string | null; resolvedAt?: string | null; resolvedBy?: string | null; }

export interface Snapshot {
  generatedAt: string;
  products: Product[];
  formulas: Formula[];
  batches: Batch[];
  movements: Movement[];
  purchases: Purchase[];
  dispatches: Dispatch[];
  waste: Waste[];
  suppliers: Supplier[];
  alerts: Alert[];
  settings: Record<string, string>;
}

export interface Health { server: string; database: string; version: string; schemaVersion?: string; products?: number; demoData?: boolean; }

/** Datos que se envían al registrar una cochada (POST /api/batches). */
export interface BatchInput {
  formulaId: number;
  bagsProduced: number;
  producedAt?: string;
  notes?: string;
  consumptions: { productId: number; realQty: number }[];
}

/** Crear o editar un producto (POST/PUT /api/products). El stock solo cambia con movimientos. */
export interface ProductInput {
  code: string; name: string; category: Category; unit: string; minStock: number; unitCost?: number | null; initialStock?: number;
}

/** Ajuste manual de inventario (POST /api/inventory/movements). */
export interface AdjustInput { productId: number; type: 'AJUSTE_POS' | 'AJUSTE_NEG'; quantity: number; notes: string; }

export interface CatalogItem { code: string; name: string; }
export interface Catalogs { categories: CatalogItem[]; units: CatalogItem[]; }

/** Nueva fórmula o nueva versión (POST /api/formulas). */
export interface FormulaInput {
  productId: number; name: string; expectedBags: number; minBags: number; maxBags: number; bagWeightKg: number;
  items: { productId: number; quantity: number }[];
}

export interface DispatchInput { customerName: string; dispatchedAt?: string | null; items: { productId: number; quantity: number }[]; }
export interface WasteInput { productId: number; quantity: number; reason: string; notes?: string | null; batchId?: number | null; recordedAt?: string | null; }
export interface PurchaseInput { supplierId: number; invoiceNumber?: string | null; purchasedAt?: string | null; items: { productId: number; quantity: number; unitCost?: number | null }[]; }
export interface SupplierInput { nit: string; name: string; phone?: string | null; email?: string | null; city?: string | null; active?: boolean; }
