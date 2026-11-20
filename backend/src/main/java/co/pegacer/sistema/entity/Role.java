package co.pegacer.sistema.entity;

import jakarta.persistence.*;

/** Rol del usuario: ADMIN, PRODUCCION, INVENTARIO, COMPRAS o GERENCIA. */
@Entity
@Table(name = "roles")
public class Role {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;
    @Column(nullable = false, unique = true, length = 30)
    private String code;
    @Column(nullable = false, length = 80)
    private String name;

    public Short getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
}
