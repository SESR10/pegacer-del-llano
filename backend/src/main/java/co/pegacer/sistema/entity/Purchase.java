package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchases")
public class Purchase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 30)
    private String code;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    @Column(name = "purchased_at", nullable = false)
    private Instant purchasedAt;
    @Column(name = "invoice_number", length = 40)
    private String invoiceNumber;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;
    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<PurchaseItem> items = new ArrayList<>();

    protected Purchase() { }

    public Purchase(String code, Supplier supplier, Instant purchasedAt, String invoiceNumber, AppUser user) {
        this.code = code;
        this.supplier = supplier;
        this.purchasedAt = purchasedAt;
        this.invoiceNumber = invoiceNumber;
        this.user = user;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public Supplier getSupplier() { return supplier; }
    public Instant getPurchasedAt() { return purchasedAt; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public AppUser getUser() { return user; }
    public boolean isDemo() { return demo; }
    public List<PurchaseItem> getItems() { return items; }
}
