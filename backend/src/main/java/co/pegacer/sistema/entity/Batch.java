package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Cochada: una mezcla producida con una fórmula. */
@Entity
@Table(name = "batches")
public class Batch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 30)
    private String code;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "formula_id", nullable = false)
    private Formula formula;
    @Column(name = "produced_at", nullable = false)
    private Instant producedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private AppUser operator;
    @Column(name = "bags_produced", nullable = false, precision = 8, scale = 2)
    private BigDecimal bagsProduced;
    @Column(nullable = false, length = 20)
    private String status = "CERRADA";
    @Column(columnDefinition = "text")
    private String notes;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;
    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<BatchConsumption> consumptions = new ArrayList<>();

    public Long getId() { return id; }
    public String getCode() { return code; }
    public Formula getFormula() { return formula; }
    public Instant getProducedAt() { return producedAt; }
    public AppUser getOperator() { return operator; }
    public BigDecimal getBagsProduced() { return bagsProduced; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public boolean isDemo() { return demo; }
    public List<BatchConsumption> getConsumptions() { return consumptions; }
}
