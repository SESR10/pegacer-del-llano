package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "waste")
public class Waste {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;
    @Column(nullable = false, length = 200)
    private String reason;
    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;

    protected Waste() { }

    public Waste(Product product, Batch batch, BigDecimal quantity, String reason, Instant recordedAt, AppUser user) {
        this.product = product;
        this.batch = batch;
        this.quantity = quantity;
        this.reason = reason;
        this.recordedAt = recordedAt;
        this.user = user;
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public Batch getBatch() { return batch; }
    public BigDecimal getQuantity() { return quantity; }
    public String getReason() { return reason; }
    public Instant getRecordedAt() { return recordedAt; }
    public AppUser getUser() { return user; }
    public boolean isDemo() { return demo; }
}
