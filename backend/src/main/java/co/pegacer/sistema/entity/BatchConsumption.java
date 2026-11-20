package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/** Consumo real vs teórico de un material en una cochada. La variación la calcula PostgreSQL. */
@Entity
@Table(name = "batch_consumptions")
public class BatchConsumption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(name = "theoretical_qty", nullable = false, precision = 12, scale = 3)
    private BigDecimal theoreticalQty;
    @Column(name = "real_qty", nullable = false, precision = 12, scale = 3)
    private BigDecimal realQty;
    @Column(name = "variation_qty", insertable = false, updatable = false, precision = 12, scale = 3)
    private BigDecimal variationQty;
    @Column(name = "variation_pct", insertable = false, updatable = false, precision = 8, scale = 2)
    private BigDecimal variationPct;

    public Long getId() { return id; }
    public Batch getBatch() { return batch; }
    public Product getProduct() { return product; }
    public BigDecimal getTheoreticalQty() { return theoreticalQty; }
    public BigDecimal getRealQty() { return realQty; }
    public BigDecimal getVariationQty() { return variationQty; }
    public BigDecimal getVariationPct() { return variationPct; }
}
