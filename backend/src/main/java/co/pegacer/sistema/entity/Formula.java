package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Fórmula (receta) de un producto terminado: cantidades por cochada y rango esperado de bolsas. */
@Entity
@Table(name = "formulas")
public class Formula {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false)
    private int version = 1;
    @Column(name = "expected_bags", nullable = false, precision = 8, scale = 2)
    private BigDecimal expectedBags;
    @Column(name = "min_bags", nullable = false, precision = 8, scale = 2)
    private BigDecimal minBags;
    @Column(name = "max_bags", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxBags;
    @Column(name = "bag_weight_kg", nullable = false, precision = 6, scale = 2)
    private BigDecimal bagWeightKg = new BigDecimal("25");
    @Column(nullable = false)
    private boolean active = true;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @OneToMany(mappedBy = "formula", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<FormulaItem> items = new ArrayList<>();

    @PrePersist
    void prePersist() { if (createdAt == null) createdAt = Instant.now(); }

    protected Formula() { }

    public Formula(Product product, String name, int version, BigDecimal expectedBags, BigDecimal minBags,
                   BigDecimal maxBags, BigDecimal bagWeightKg) {
        this.product = product;
        this.name = name;
        this.version = version;
        this.expectedBags = expectedBags;
        this.minBags = minBags;
        this.maxBags = maxBags;
        this.bagWeightKg = bagWeightKg;
    }

    public void setActive(boolean active) { this.active = active; }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public String getName() { return name; }
    public int getVersion() { return version; }
    public BigDecimal getExpectedBags() { return expectedBags; }
    public BigDecimal getMinBags() { return minBags; }
    public BigDecimal getMaxBags() { return maxBags; }
    public BigDecimal getBagWeightKg() { return bagWeightKg; }
    public boolean isActive() { return active; }
    public boolean isDemo() { return demo; }
    public Instant getCreatedAt() { return createdAt; }
    public List<FormulaItem> getItems() { return items; }
}
