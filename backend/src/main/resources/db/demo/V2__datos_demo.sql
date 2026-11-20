-- PEGACER DEL LLANO — Datos DEMO (solo perfil "demo")
-- Todo queda marcado con is_demo = TRUE. No se cargan costos: los debe dar la empresa.
-- Los movimientos se generan en orden cronológico para que el kardex cuadre exactamente.

-- Usuarios demo. Contraseña de todos: Demo2026*
INSERT INTO users (username, full_name, email, password_hash, role_id, is_demo)
SELECT u.username, u.full_name, u.username || '@demo.pegacer.local',
       '$2a$10$tJAyJa4wVx3/nFgPjI89Qe6GH2YnY8ImNrSoijHpMZ7gd8RLNqo4q', r.id, TRUE
FROM (VALUES ('admin','Administrador DEMO','ADMIN'),
             ('produccion','Jefe de Producción DEMO','PRODUCCION'),
             ('inventario','Auxiliar de Inventario DEMO','INVENTARIO'),
             ('compras','Compras DEMO','COMPRAS'),
             ('gerencia','Gerencia DEMO','GERENCIA')) AS u(username, full_name, role)
JOIN roles r ON r.code = u.role;

-- Productos
INSERT INTO products (code, name, category_id, unit_id, min_stock, is_demo)
SELECT p.code, p.name, c.id, un.id, p.min_stock, TRUE
FROM (VALUES ('MP-CEM','Cemento gris uso general','MATERIA_PRIMA','BULTO', 120),
             ('MP-ARE','Arena lavada','MATERIA_PRIMA','M3', 8),
             ('MP-QUI','Aditivo químico','MATERIA_PRIMA','KG', 25),
             ('IN-BOL','Bolsa de empaque 25 kg','INSUMO','UND', 600),
             ('PT-PEG','Pegante para enchape estándar 25 kg','PRODUCTO_TERMINADO','BOLSA', 150),
             ('PT-PRE','Pegante para enchape premium 25 kg','PRODUCTO_TERMINADO','BOLSA', 50))
     AS p(code, name, cat, unit, min_stock)
JOIN product_categories c ON c.code = p.cat
JOIN units un ON un.code = p.unit;

-- Proveedores
INSERT INTO suppliers (nit, name, phone, city, is_demo) VALUES
 ('DEMO-900111222','Cementos DEMO S.A.S.','3000000001','Villavicencio', TRUE),
 ('DEMO-900333444','Agregados DEMO del Llano','3000000002','Villavicencio', TRUE),
 ('DEMO-900555666','Químicos DEMO Ltda.','3000000003','Bogotá', TRUE),
 ('DEMO-900777888','Empaques DEMO S.A.S.','3000000004','Bogotá', TRUE);

-- Fórmula de referencia informada por la empresa
INSERT INTO formulas (product_id, name, expected_bags, min_bags, max_bags, bag_weight_kg, is_demo)
SELECT id, 'Fórmula estándar v1', 46, 45, 47, 25, TRUE FROM products WHERE code = 'PT-PEG';

INSERT INTO formula_items (formula_id, product_id, quantity)
SELECT f.id, p.id, x.qty
FROM formulas f
CROSS JOIN (VALUES ('MP-CEM', 3.0), ('MP-ARE', 0.51), ('MP-QUI', 1.8), ('IN-BOL', 47.0)) AS x(code, qty)
JOIN products p ON p.code = x.code;

-- ===== Generador de movimientos (temporal) =====
CREATE FUNCTION pg_temp.mov(p_code TEXT, p_type TEXT, p_qty NUMERIC, p_at TIMESTAMPTZ,
                            p_ref_type TEXT, p_ref_id BIGINT, p_notes TEXT) RETURNS VOID AS $$
DECLARE v_id BIGINT; v_before NUMERIC; v_after NUMERIC;
BEGIN
  SELECT id, stock INTO v_id, v_before FROM products WHERE code = p_code FOR UPDATE;
  IF p_type IN ('ENTRADA_COMPRA','PRODUCCION','AJUSTE_POS','INICIAL') THEN
    v_after := v_before + p_qty;
  ELSE
    v_after := v_before - p_qty;
  END IF;
  UPDATE products SET stock = v_after WHERE id = v_id;
  INSERT INTO inventory_movements (product_id, movement_type, quantity, stock_before, stock_after,
                                   reference_type, reference_id, notes, created_at, is_demo)
  VALUES (v_id, p_type, p_qty, v_before, v_after, p_ref_type, p_ref_id, p_notes, p_at, TRUE);
END $$ LANGUAGE plpgsql;

DO $$
DECLARE
  d INT; n INT; i INT;
  v_day TIMESTAMPTZ;
  v_at TIMESTAMPTZ;
  v_formula BIGINT;
  v_batch BIGINT;
  v_purchase BIGINT;
  v_dispatch BIGINT;
  v_bags NUMERIC;
  v_real NUMERIC;
  v_factor NUMERIC;
  v_operator BIGINT;
  v_batch_no INT := 0;
  v_purchase_no INT := 0;
  v_dispatch_no INT := 0;
  it RECORD;
  v_customers TEXT[] := ARRAY['Ferretería DEMO El Constructor','Depósito DEMO Los Llanos','Obras DEMO Meta S.A.S.','Cliente DEMO mostrador'];
BEGIN
  PERFORM setseed(0.42);
  SELECT id INTO v_formula FROM formulas WHERE name = 'Fórmula estándar v1';
  SELECT id INTO v_operator FROM users WHERE username = 'produccion';
  v_day := date_trunc('day', now()) - INTERVAL '30 days';

  -- Inventario inicial
  PERFORM pg_temp.mov('MP-CEM','INICIAL',100, v_day + INTERVAL '6 hours', NULL, NULL, 'Saldo inicial DEMO');
  PERFORM pg_temp.mov('MP-ARE','INICIAL',14,  v_day + INTERVAL '6 hours', NULL, NULL, 'Saldo inicial DEMO');
  PERFORM pg_temp.mov('MP-QUI','INICIAL',60,  v_day + INTERVAL '6 hours', NULL, NULL, 'Saldo inicial DEMO');
  PERFORM pg_temp.mov('IN-BOL','INICIAL',1800,v_day + INTERVAL '6 hours', NULL, NULL, 'Saldo inicial DEMO');
  PERFORM pg_temp.mov('PT-PEG','INICIAL',220, v_day + INTERVAL '6 hours', NULL, NULL, 'Saldo inicial DEMO');

  FOR d IN 0..29 LOOP
    v_day := date_trunc('day', now()) - INTERVAL '30 days' + make_interval(days => d);
    CONTINUE WHEN extract(dow FROM v_day) = 0;  -- domingos no se produce

    -- Compras los lunes
    IF extract(dow FROM v_day) = 1 THEN
      FOR it IN SELECT * FROM (VALUES
          ('MP-CEM', 40.0, 'DEMO-900111222'), ('MP-ARE', 6.0, 'DEMO-900333444'),
          ('MP-QUI', 18.0, 'DEMO-900555666'), ('IN-BOL', 500.0, 'DEMO-900777888')) AS t(code, qty, nit)
      LOOP
        -- El cemento deja de comprarse a mitad de mes: así aparece el stock crítico.
        CONTINUE WHEN it.code = 'MP-CEM' AND d > 14;
        v_purchase_no := v_purchase_no + 1;
        INSERT INTO purchases (code, supplier_id, purchased_at, invoice_number, is_demo)
        SELECT 'OC-DEMO-' || lpad(v_purchase_no::TEXT, 4, '0'), s.id, v_day + INTERVAL '7 hours',
               'FAC-DEMO-' || (1000 + v_purchase_no), TRUE
        FROM suppliers s WHERE s.nit = it.nit
        RETURNING id INTO v_purchase;
        INSERT INTO purchase_items (purchase_id, product_id, quantity)
        SELECT v_purchase, id, it.qty FROM products WHERE code = it.code;
        PERFORM pg_temp.mov(it.code, 'ENTRADA_COMPRA', it.qty, v_day + INTERVAL '7 hours', 'COMPRA', v_purchase, NULL);
      END LOOP;
    END IF;

    -- Cochadas: 1 o 2 por día hábil (36 en total aprox.)
    n := CASE WHEN random() < 0.4 THEN 2 ELSE 1 END;
    FOR i IN 1..n LOOP
      v_batch_no := v_batch_no + 1;
      v_at := v_day + make_interval(hours => 8 + i * 3);
      v_bags := 45 + floor(random() * 3);       -- 45 a 47
      IF v_batch_no IN (7, 19, 31) THEN v_bags := 43; END IF;  -- producción baja
      INSERT INTO batches (code, formula_id, produced_at, operator_id, bags_produced, is_demo)
      VALUES ('C-DEMO-' || lpad(v_batch_no::TEXT, 4, '0'), v_formula, v_at, v_operator, v_bags, TRUE)
      RETURNING id INTO v_batch;

      FOR it IN SELECT p.code, p.id AS product_id, fi.quantity
                FROM formula_items fi JOIN products p ON p.id = fi.product_id
                WHERE fi.formula_id = v_formula
      LOOP
        IF it.code = 'IN-BOL' THEN
          -- Una bolsa por cada bolsa producida (+1 o 2 rotas al llenar).
          v_real := v_bags + floor(random() * 2);
          INSERT INTO batch_consumptions (batch_id, product_id, theoretical_qty, real_qty)
          VALUES (v_batch, it.product_id, v_bags, v_real);
        ELSE
          v_factor := 0.97 + random() * 0.06;   -- ±3 %
          IF v_batch_no IN (7, 19, 31) AND it.code = 'MP-CEM' THEN v_factor := 1.0; END IF;
          IF v_batch_no IN (12, 27) AND it.code = 'MP-ARE' THEN v_factor := 1.09; END IF;  -- fuera de rango
          IF v_batch_no = 33 AND it.code = 'MP-QUI' THEN v_factor := 1.12; END IF;          -- fuera de rango
          v_real := round(it.quantity * v_factor, 3);
          INSERT INTO batch_consumptions (batch_id, product_id, theoretical_qty, real_qty)
          VALUES (v_batch, it.product_id, it.quantity, v_real);
        END IF;
        PERFORM pg_temp.mov(it.code, 'CONSUMO_COCHADA', v_real, v_at, 'COCHADA', v_batch, NULL);
      END LOOP;
      PERFORM pg_temp.mov('PT-PEG', 'PRODUCCION', v_bags, v_at + INTERVAL '1 hour', 'COCHADA', v_batch, NULL);
    END LOOP;

    -- Despachos casi todos los días
    IF random() < 0.8 THEN
      v_dispatch_no := v_dispatch_no + 1;
      v_bags := 30 + floor(random() * 50);
      INSERT INTO dispatches (code, customer_name, dispatched_at, is_demo)
      VALUES ('DES-DEMO-' || lpad(v_dispatch_no::TEXT, 4, '0'),
              v_customers[1 + floor(random() * 4)::INT], v_day + INTERVAL '16 hours', TRUE)
      RETURNING id INTO v_dispatch;
      INSERT INTO dispatch_items (dispatch_id, product_id, quantity)
      SELECT v_dispatch, id, v_bags FROM products WHERE code = 'PT-PEG';
      PERFORM pg_temp.mov('PT-PEG', 'SALIDA_DESPACHO', v_bags, v_day + INTERVAL '16 hours', 'DESPACHO', v_dispatch, NULL);
    END IF;
  END LOOP;

  -- Desperdicios
  INSERT INTO waste (product_id, quantity, reason, recorded_at, is_demo)
  SELECT id, 2, 'Bultos rotos en descargue', now() - INTERVAL '20 days', TRUE FROM products WHERE code = 'MP-CEM';
  PERFORM pg_temp.mov('MP-CEM','DESPERDICIO', 2, now() - INTERVAL '20 days', 'DESPERDICIO', currval('waste_id_seq'), NULL);
  INSERT INTO waste (product_id, quantity, reason, recorded_at, is_demo)
  SELECT id, 35, 'Bolsas defectuosas del proveedor', now() - INTERVAL '12 days', TRUE FROM products WHERE code = 'IN-BOL';
  PERFORM pg_temp.mov('IN-BOL','DESPERDICIO', 35, now() - INTERVAL '12 days', 'DESPERDICIO', currval('waste_id_seq'), NULL);
  INSERT INTO waste (product_id, quantity, reason, recorded_at, is_demo)
  SELECT id, 3, 'Bolsas rotas en bodega', now() - INTERVAL '4 days', TRUE FROM products WHERE code = 'PT-PEG';
  PERFORM pg_temp.mov('PT-PEG','DESPERDICIO', 3, now() - INTERVAL '4 days', 'DESPERDICIO', currval('waste_id_seq'), NULL);
END $$;

-- ===== Alertas, derivadas del estado real de los datos =====
INSERT INTO alerts (alert_type, severity, product_id, message, is_demo)
SELECT CASE WHEN stock = 0 THEN 'AGOTADO' ELSE 'STOCK_CRITICO' END,
       'ALTA', id,
       CASE WHEN stock = 0 THEN name || ' está agotado.'
            ELSE name || ' en stock crítico: quedan ' || trim(to_char(stock, 'FM999G999D0')) || ' (mínimo ' || trim(to_char(min_stock, 'FM999G999D0')) || ').' END,
       TRUE
FROM products WHERE stock < min_stock;

INSERT INTO alerts (alert_type, severity, product_id, batch_id, message, created_at, is_demo)
SELECT 'CONSUMO_FUERA_RANGO', 'MEDIA', bc.product_id, b.id,
       'Cochada ' || b.code || ': consumo de ' || p.name || ' ' || bc.variation_pct || ' % sobre la fórmula.',
       b.produced_at, TRUE
FROM batch_consumptions bc JOIN batches b ON b.id = bc.batch_id JOIN products p ON p.id = bc.product_id
WHERE abs(bc.variation_pct) > 5;

INSERT INTO alerts (alert_type, severity, batch_id, message, created_at, is_demo)
SELECT 'PRODUCCION_BAJA', 'MEDIA', b.id,
       'Cochada ' || b.code || ': produjo ' || b.bags_produced::INT || ' bolsas (mínimo esperado ' || f.min_bags::INT || ').',
       b.produced_at, TRUE
FROM batches b JOIN formulas f ON f.id = b.formula_id
WHERE b.bags_produced < f.min_bags;
