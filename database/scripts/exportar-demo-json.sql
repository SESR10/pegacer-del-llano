-- Exporta una foto de los datos DEMO para el modo demostración del frontend.
-- Uso: psql -d pegacer -qAt -f database/scripts/exportar-demo-json.sql > frontend/src/demo/demo-data.json
SELECT json_build_object(
  'generatedAt', now(),
  'products', (SELECT json_agg(x ORDER BY x.id) FROM (
      SELECT p.id, p.code, p.name, c.code AS category, u.code AS unit, p.stock::float, p.min_stock::float AS "minStock"
      FROM products p JOIN product_categories c ON c.id = p.category_id JOIN units u ON u.id = p.unit_id) x),
  'formulas', (SELECT json_agg(x) FROM (
      SELECT f.id, f.name, f.version, p.name AS product, f.expected_bags::float AS "expectedBags",
             f.min_bags::float AS "minBags", f.max_bags::float AS "maxBags", f.bag_weight_kg::float AS "bagWeightKg",
             (SELECT json_agg(json_build_object('productId', fi.product_id, 'quantity', fi.quantity::float) ORDER BY fi.id)
              FROM formula_items fi WHERE fi.formula_id = f.id) AS items
      FROM formulas f JOIN products p ON p.id = f.product_id) x),
  'batches', (SELECT json_agg(x ORDER BY x."producedAt" DESC) FROM (
      SELECT b.id, b.code, b.produced_at AS "producedAt", b.bags_produced::float AS "bags", u.full_name AS operator,
             (SELECT json_agg(json_build_object('productId', bc.product_id, 'theoretical', bc.theoretical_qty::float,
                     'real', bc.real_qty::float, 'variationPct', bc.variation_pct::float) ORDER BY bc.product_id)
              FROM batch_consumptions bc WHERE bc.batch_id = b.id) AS consumptions
      FROM batches b LEFT JOIN users u ON u.id = b.operator_id) x),
  'movements', (SELECT json_agg(x ORDER BY x.id) FROM (
      SELECT id, product_id AS "productId", movement_type AS type, quantity::float, stock_before::float AS "before",
             stock_after::float AS "after", reference_type AS "refType", created_at AS "at" FROM inventory_movements) x),
  'purchases', (SELECT json_agg(x ORDER BY x."at" DESC) FROM (
      SELECT pu.code, pu.purchased_at AS "at", s.name AS supplier, pu.invoice_number AS invoice,
             pi.product_id AS "productId", pi.quantity::float
      FROM purchases pu JOIN suppliers s ON s.id = pu.supplier_id JOIN purchase_items pi ON pi.purchase_id = pu.id) x),
  'dispatches', (SELECT json_agg(x ORDER BY x."at" DESC) FROM (
      SELECT d.code, d.dispatched_at AS "at", d.customer_name AS customer, di.product_id AS "productId", di.quantity::float
      FROM dispatches d JOIN dispatch_items di ON di.dispatch_id = d.id) x),
  'waste', (SELECT json_agg(x ORDER BY x."at" DESC) FROM (
      SELECT w.product_id AS "productId", w.quantity::float, w.reason, w.recorded_at AS "at" FROM waste w) x),
  'suppliers', (SELECT json_agg(x) FROM (SELECT nit, name, phone, city FROM suppliers) x),
  'alerts', (SELECT json_agg(x ORDER BY x.severity, x."at" DESC) FROM (
      SELECT id, alert_type AS type, severity, message, created_at AS "at" FROM alerts WHERE NOT resolved) x),
  'settings', (SELECT json_object_agg(key, value) FROM settings)
);
