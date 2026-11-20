export type Category = 'MATERIA_PRIMA' | 'INSUMO' | 'PRODUCTO_TERMINADO';

export interface Product { id: number; code: string; name: string; category: Category; unit: string; stock: number; minStock: number; }
export interface FormulaItem { productId: number; quantity: number; }
export interface Formula { id: number; name: string; version: number; product: string; expectedBags: number; minBags: number; maxBags: number; bagWeightKg: number; items: FormulaItem[]; }
export interface Consumption { productId: number; theoretical: number; real: number; variationPct: number; }
export interface Batch { id: number; code: string; producedAt: string; bags: number; operator: string; consumptions: Consumption[]; }
export interface Movement { id: number; productId: number; type: string; quantity: number; before: number; after: number; refType: string | null; at: string; }
export interface Purchase { code: string; at: string; supplier: string; invoice: string; productId: number; quantity: number; }
export interface Dispatch { code: string; at: string; customer: string; productId: number; quantity: number; }
export interface Waste { productId: number; quantity: number; reason: string; at: string; }
export interface Supplier { nit: string; name: string; phone: string; city: string; }
export interface Alert { id: number; type: string; severity: 'ALTA' | 'MEDIA' | 'INFO'; message: string; at: string; }

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
