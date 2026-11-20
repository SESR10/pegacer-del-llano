package co.pegacer.sistema.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Salida de producto terminado hacia un cliente. */
@Entity
@Table(name = "dispatches")
public class Dispatch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 30)
    private String code;
    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;
    @Column(name = "dispatched_at", nullable = false)
    private Instant dispatchedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;
    @OneToMany(mappedBy = "dispatch", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<DispatchItem> items = new ArrayList<>();

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getCustomerName() { return customerName; }
    public Instant getDispatchedAt() { return dispatchedAt; }
    public AppUser getUser() { return user; }
    public boolean isDemo() { return demo; }
    public List<DispatchItem> getItems() { return items; }
}
