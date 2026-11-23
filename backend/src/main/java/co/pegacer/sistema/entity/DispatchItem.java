package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "dispatch_items")
public class DispatchItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dispatch_id", nullable = false)
    private Dispatch dispatch;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    protected DispatchItem() { }

    public DispatchItem(Dispatch dispatch, Product product, BigDecimal quantity) {
        this.dispatch = dispatch;
        this.product = product;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public Dispatch getDispatch() { return dispatch; }
    public Product getProduct() { return product; }
    public BigDecimal getQuantity() { return quantity; }
}
