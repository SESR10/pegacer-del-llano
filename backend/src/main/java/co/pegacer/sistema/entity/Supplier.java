package co.pegacer.sistema.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "suppliers")
public class Supplier {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 30)
    private String nit;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(length = 30)
    private String phone;
    @Column(length = 120)
    private String email;
    @Column(length = 60)
    private String city;
    @Column(nullable = false)
    private boolean active = true;
    @Column(name = "is_demo", nullable = false)
    private boolean demo;

    public Long getId() { return id; }
    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isDemo() { return demo; }
}
