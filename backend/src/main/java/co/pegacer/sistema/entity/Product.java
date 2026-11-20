package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Materia prima, insumo o producto terminado.
 * El stock solo cambia a través de movimientos de inventario (kardex), nunca directamente.
 */
@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 20)
    private String code;
    @Column(nullable = false, length = 120)
    private String name;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategory category;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;
    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal stock = BigDecimal.ZERO;
    @Column(name = "min_stock", nullable = false, precision = 14, scale = 3)
    private BigDecimal minStock = BigDecimal.ZERO;
    @Column(name = "unit_cost", precision = 14, scale = 2)
    private BigDecimal unitCost;
    @Column(nullable = false)
    private boolean active = true;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { if (createdAt == null) createdAt = Instant.now(); }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public ProductCategory getCategory() { return category; }
    public void setCategory(ProductCategory category) { this.category = category; }
    public Unit getUnit() { return unit; }
    public void setUnit(Unit unit) { this.unit = unit; }
    public BigDecimal getStock() { return stock; }
    /** Solo lo usa InventoryService al registrar un movimiento. */
    public void setStock(BigDecimal stock) { this.stock = stock; }
    public BigDecimal getMinStock() { return minStock; }
    public void setMinStock(BigDecimal minStock) { this.minStock = minStock; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isDemo() { return demo; }
    public Instant getCreatedAt() { return createdAt; }
}
