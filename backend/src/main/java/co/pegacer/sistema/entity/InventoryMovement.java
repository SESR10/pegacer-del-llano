package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

/** Línea del kardex: guarda el stock antes y después. La base de datos valida que cuadre. */
@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;
    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;
    @Column(name = "stock_before", nullable = false, precision = 14, scale = 3)
    private BigDecimal stockBefore;
    @Column(name = "stock_after", nullable = false, precision = 14, scale = 3)
    private BigDecimal stockAfter;
    @Column(name = "reference_type", length = 20)
    private String referenceType;
    @Column(name = "reference_id")
    private Long referenceId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;
    @Column(columnDefinition = "text")
    private String notes;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;

    protected InventoryMovement() { }

    public InventoryMovement(Product product, MovementType type, BigDecimal quantity, BigDecimal stockBefore,
                             BigDecimal stockAfter, String referenceType, Long referenceId, AppUser user, String notes) {
        this.product = product;
        this.movementType = type;
        this.quantity = quantity;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.user = user;
        this.notes = notes;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public MovementType getMovementType() { return movementType; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getStockBefore() { return stockBefore; }
    public BigDecimal getStockAfter() { return stockAfter; }
    public String getReferenceType() { return referenceType; }
    public Long getReferenceId() { return referenceId; }
    public AppUser getUser() { return user; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isDemo() { return demo; }
}
