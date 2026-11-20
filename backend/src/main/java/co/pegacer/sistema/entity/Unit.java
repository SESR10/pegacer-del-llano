package co.pegacer.sistema.entity;

import jakarta.persistence.*;

/** Unidad de medida: BULTO, M3, KG, UND, BOLSA. */
@Entity
@Table(name = "units")
public class Unit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;
    @Column(nullable = false, unique = true, length = 10)
    private String code;
    @Column(nullable = false, length = 40)
    private String name;

    public Short getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
}
