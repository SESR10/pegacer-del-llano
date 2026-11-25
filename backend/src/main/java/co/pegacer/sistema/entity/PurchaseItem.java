package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "purchase_items")
public class PurchaseItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_id", nullable = false)
    private Purchase purchase;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;
    @Column(name = "unit_cost", precision = 14, scale = 2)
    private BigDecimal unitCost;

    protected PurchaseItem() { }

    public PurchaseItem(Purchase purchase, Product product, BigDecimal quantity, BigDecimal unitCost) {
        this.purchase = purchase;
        this.product = product;
        this.quantity = quantity;
        this.unitCost = unitCost;
    }

    public Long getId() { return id; }
    public Purchase getPurchase() { return purchase; }
    public Product getProduct() { return product; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getUnitCost() { return unitCost; }
}
