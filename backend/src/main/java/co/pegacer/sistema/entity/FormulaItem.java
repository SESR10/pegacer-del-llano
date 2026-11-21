package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "formula_items")
public class FormulaItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "formula_id", nullable = false)
    private Formula formula;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    protected FormulaItem() { }

    public FormulaItem(Formula formula, Product product, BigDecimal quantity) {
        this.formula = formula;
        this.product = product;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public Formula getFormula() { return formula; }
    public Product getProduct() { return product; }
    public BigDecimal getQuantity() { return quantity; }
}
