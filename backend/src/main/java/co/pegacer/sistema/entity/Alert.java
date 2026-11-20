package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "alerts")
public class Alert {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "alert_type", nullable = false, length = 30)
    private String alertType;
    @Column(nullable = false, length = 10)
    private String severity;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;
    @Column(nullable = false, length = 300)
    private String message;
    @Column(nullable = false)
    private boolean resolved;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;

    protected Alert() { }

    public Alert(String alertType, String severity, Product product, Batch batch, String message) {
        this.alertType = alertType;
        this.severity = severity;
        this.product = product;
        this.batch = batch;
        this.message = message;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getAlertType() { return alertType; }
    public String getSeverity() { return severity; }
    public Product getProduct() { return product; }
    public Batch getBatch() { return batch; }
    public String getMessage() { return message; }
    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isDemo() { return demo; }
}
