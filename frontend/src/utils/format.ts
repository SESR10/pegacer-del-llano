const nf = (digits: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export const num = (n: number, digits = 1) => nf(digits).format(n);
export const pct = (n: number) => `${n > 0 ? '+' : ''}${nf(1).format(n)} %`;

export const date = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const UNIT_LABEL: Record<string, string> = { BULTO: 'bultos', M3: 'm³', KG: 'kg', UND: 'und', BOLSA: 'bolsas' };
export const unit = (code: string) => UNIT_LABEL[code] ?? code.toLowerCase();

export const MOVEMENT_LABEL: Record<string, string> = {
  INICIAL: 'Saldo inicial', ENTRADA_COMPRA: 'Compra', CONSUMO_COCHADA: 'Consumo cochada', PRODUCCION: 'Producción',
  SALIDA_DESPACHO: 'Despacho', DESPERDICIO: 'Desperdicio', AJUSTE_POS: 'Ajuste +', AJUSTE_NEG: 'Ajuste −',
};
export const isEntry = (type: string) => ['INICIAL', 'ENTRADA_COMPRA', 'PRODUCCION', 'AJUSTE_POS'].includes(type);
