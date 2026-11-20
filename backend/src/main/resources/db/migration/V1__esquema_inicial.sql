-- PEGACER DEL LLANO — Esquema inicial (Fase 2)
-- 19 tablas. Reglas críticas viven en la base: sin stock negativo, cantidades > 0,
-- kardex con stock antes/después y variación real vs teórico calculada por PostgreSQL.

-- ===================== Seguridad =====================
CREATE TABLE roles (
    id          SMALLSERIAL PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,   -- ADMIN, PRODUCCION, INVENTARIO, COMPRAS, GERENCIA
    name        VARCHAR(80)  NOT NULL
);

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(120),
    password_hash VARCHAR(100) NOT NULL,
    role_id       SMALLINT     NOT NULL REFERENCES roles(id),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    is_demo       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ===================== Catálogos =====================
CREATE TABLE units (
    id     SMALLSERIAL PRIMARY KEY,
    code   VARCHAR(10) NOT NULL UNIQUE,         -- BULTO, M3, KG, UND, BOLSA
    name   VARCHAR(40) NOT NULL
);

CREATE TABLE product_categories (
    id     SMALLSERIAL PRIMARY KEY,
    code   VARCHAR(30) NOT NULL UNIQUE,         -- MATERIA_PRIMA, INSUMO, PRODUCTO_TERMINADO
    name   VARCHAR(60) NOT NULL
);

CREATE TABLE products (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(20)   NOT NULL UNIQUE,
    name          VARCHAR(120)  NOT NULL,
    category_id   SMALLINT      NOT NULL REFERENCES product_categories(id),
    unit_id       SMALLINT      NOT NULL REFERENCES units(id),
    stock         NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock     NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    unit_cost     NUMERIC(14,2)          CHECK (unit_cost IS NULL OR unit_cost >= 0),
    active        BOOLEAN       NOT NULL DEFAULT TRUE,
    is_demo       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
    id         BIGSERIAL PRIMARY KEY,
    nit        VARCHAR(30)  NOT NULL UNIQUE,
    name       VARCHAR(120) NOT NULL,
    phone      VARCHAR(30),
    email      VARCHAR(120),
    city       VARCHAR(60),
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    is_demo    BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ===================== Fórmulas =====================
CREATE TABLE formulas (
    id               BIGSERIAL PRIMARY KEY,
    product_id       BIGINT        NOT NULL REFERENCES products(id),   -- producto terminado
    name             VARCHAR(120)  NOT NULL,
    version          INT           NOT NULL DEFAULT 1,
    expected_bags    NUMERIC(8,2)  NOT NULL CHECK (expected_bags > 0),
    min_bags         NUMERIC(8,2)  NOT NULL CHECK (min_bags > 0),
    max_bags         NUMERIC(8,2)  NOT NULL CHECK (max_bags >= min_bags),
    bag_weight_kg    NUMERIC(6,2)  NOT NULL DEFAULT 25 CHECK (bag_weight_kg > 0),
    active           BOOLEAN       NOT NULL DEFAULT TRUE,
    is_demo          BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE (product_id, version)
);

CREATE TABLE formula_items (
    id           BIGSERIAL PRIMARY KEY,
    formula_id   BIGINT        NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    product_id   BIGINT        NOT NULL REFERENCES products(id),     -- materia prima / insumo
    quantity     NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    UNIQUE (formula_id, product_id)
);

-- ===================== Producción (cochadas) =====================
CREATE TABLE batches (
    id             BIGSERIAL PRIMARY KEY,
    code           VARCHAR(30)   NOT NULL UNIQUE,                    -- C-2026-0001
    formula_id     BIGINT        NOT NULL REFERENCES formulas(id),
    produced_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    operator_id    BIGINT        REFERENCES users(id),
    bags_produced  NUMERIC(8,2)  NOT NULL CHECK (bags_produced >= 0),
    status         VARCHAR(20)   NOT NULL DEFAULT 'CERRADA' CHECK (status IN ('ABIERTA','CERRADA','ANULADA')),
    notes          TEXT,
    is_demo        BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE batch_consumptions (
    id                BIGSERIAL PRIMARY KEY,
    batch_id          BIGINT        NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    product_id        BIGINT        NOT NULL REFERENCES products(id),
    theoretical_qty   NUMERIC(12,3) NOT NULL CHECK (theoretical_qty > 0),
    real_qty          NUMERIC(12,3) NOT NULL CHECK (real_qty > 0),
    variation_qty     NUMERIC(12,3) GENERATED ALWAYS AS (real_qty - theoretical_qty) STORED,
    variation_pct     NUMERIC(8,2)  GENERATED ALWAYS AS (round((real_qty - theoretical_qty) * 100 / theoretical_qty, 2)) STORED,
    UNIQUE (batch_id, product_id)
);

-- ===================== Kardex =====================
CREATE TABLE inventory_movements (
    id             BIGSERIAL PRIMARY KEY,
    product_id     BIGINT        NOT NULL REFERENCES products(id),
    movement_type  VARCHAR(20)   NOT NULL CHECK (movement_type IN
                     ('ENTRADA_COMPRA','CONSUMO_COCHADA','PRODUCCION','SALIDA_DESPACHO','DESPERDICIO','AJUSTE_POS','AJUSTE_NEG','INICIAL')),
    quantity       NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    stock_before   NUMERIC(14,3) NOT NULL CHECK (stock_before >= 0),
    stock_after    NUMERIC(14,3) NOT NULL CHECK (stock_after >= 0),
    reference_type VARCHAR(20),
    reference_id   BIGINT,
    user_id        BIGINT        REFERENCES users(id),
    notes          TEXT,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    is_demo        BOOLEAN       NOT NULL DEFAULT FALSE,
    CHECK (
      (movement_type IN ('ENTRADA_COMPRA','PRODUCCION','AJUSTE_POS','INICIAL') AND stock_after = stock_before + quantity) OR
      (movement_type IN ('CONSUMO_COCHADA','SALIDA_DESPACHO','DESPERDICIO','AJUSTE_NEG') AND stock_after = stock_before - quantity)
    )
);
CREATE INDEX idx_movements_product_date ON inventory_movements(product_id, created_at);

-- ===================== Compras =====================
CREATE TABLE purchases (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(30)  NOT NULL UNIQUE,
    supplier_id   BIGINT       NOT NULL REFERENCES suppliers(id),
    purchased_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    invoice_number VARCHAR(40),
    user_id       BIGINT       REFERENCES users(id),
    is_demo       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE purchase_items (
    id           BIGSERIAL PRIMARY KEY,
    purchase_id  BIGINT        NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id   BIGINT        NOT NULL REFERENCES products(id),
    quantity     NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    unit_cost    NUMERIC(14,2)          CHECK (unit_cost IS NULL OR unit_cost >= 0)
);

-- ===================== Salidas / despachos =====================
CREATE TABLE dispatches (
    id             BIGSERIAL PRIMARY KEY,
    code           VARCHAR(30)  NOT NULL UNIQUE,
    customer_name  VARCHAR(120) NOT NULL,
    dispatched_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    user_id        BIGINT       REFERENCES users(id),
    is_demo        BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE dispatch_items (
    id           BIGSERIAL PRIMARY KEY,
    dispatch_id  BIGINT        NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
    product_id   BIGINT        NOT NULL REFERENCES products(id),
    quantity     NUMERIC(12,3) NOT NULL CHECK (quantity > 0)
);

-- ===================== Desperdicios =====================
CREATE TABLE waste (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT        NOT NULL REFERENCES products(id),
    batch_id    BIGINT        REFERENCES batches(id),
    quantity    NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    reason      VARCHAR(200)  NOT NULL,
    recorded_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    user_id     BIGINT        REFERENCES users(id),
    is_demo     BOOLEAN       NOT NULL DEFAULT FALSE
);

-- ===================== Alertas =====================
CREATE TABLE alerts (
    id           BIGSERIAL PRIMARY KEY,
    alert_type   VARCHAR(30)  NOT NULL CHECK (alert_type IN ('STOCK_CRITICO','AGOTADO','CONSUMO_FUERA_RANGO','PRODUCCION_BAJA')),
    severity     VARCHAR(10)  NOT NULL CHECK (severity IN ('INFO','MEDIA','ALTA')),
    product_id   BIGINT       REFERENCES products(id),
    batch_id     BIGINT       REFERENCES batches(id),
    message      VARCHAR(300) NOT NULL,
    resolved     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    is_demo      BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ===================== Configuración y auditoría =====================
CREATE TABLE settings (
    key          VARCHAR(60)  PRIMARY KEY,
    value        VARCHAR(200) NOT NULL,
    description  VARCHAR(200)
);

CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       REFERENCES users(id),
    action      VARCHAR(40)  NOT NULL,
    entity      VARCHAR(40)  NOT NULL,
    entity_id   BIGINT,
    details     JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ===================== Vistas =====================
-- Producto terminado: no es tabla aparte, se consulta desde products.
CREATE VIEW v_finished_goods AS
SELECT p.id, p.code, p.name, p.stock, p.min_stock
FROM products p JOIN product_categories c ON c.id = p.category_id
WHERE c.code = 'PRODUCTO_TERMINADO';

-- Resumen de cada cochada con su variación de consumo.
CREATE VIEW v_batch_summary AS
SELECT b.id, b.code, b.produced_at, b.bags_produced, f.expected_bags, f.min_bags, f.max_bags,
       p.name AS product_name,
       max(abs(bc.variation_pct)) AS max_abs_variation_pct
FROM batches b
JOIN formulas f ON f.id = b.formula_id
JOIN products p ON p.id = f.product_id
LEFT JOIN batch_consumptions bc ON bc.batch_id = b.id
GROUP BY b.id, f.id, p.name;

-- ===================== Datos base (no demo) =====================
INSERT INTO roles (code, name) VALUES
 ('ADMIN','Administrador'), ('PRODUCCION','Producción'), ('INVENTARIO','Inventario'),
 ('COMPRAS','Compras'), ('GERENCIA','Gerencia');

INSERT INTO units (code, name) VALUES
 ('BULTO','Bulto'), ('M3','Metro cúbico'), ('KG','Kilogramo'), ('UND','Unidad'), ('BOLSA','Bolsa 25 kg');

INSERT INTO product_categories (code, name) VALUES
 ('MATERIA_PRIMA','Materia prima'), ('INSUMO','Insumo'), ('PRODUCTO_TERMINADO','Producto terminado');

INSERT INTO settings (key, value, description) VALUES
 ('consumo.tolerancia_pct', '5', 'Variación permitida entre consumo real y teórico (%)'),
 ('empresa.nombre', 'PEGACER DEL LLANO', 'Nombre de la empresa');
