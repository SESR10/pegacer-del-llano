package co.pegacer.sistema.entity;

import jakarta.persistence.*;

/** Categoría: MATERIA_PRIMA, INSUMO o PRODUCTO_TERMINADO. */
@Entity
@Table(name = "product_categories")
public class ProductCategory {
    public static final String MATERIA_PRIMA = "MATERIA_PRIMA";
    public static final String INSUMO = "INSUMO";
    public static final String PRODUCTO_TERMINADO = "PRODUCTO_TERMINADO";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;
    @Column(nullable = false, unique = true, length = 30)
    private String code;
    @Column(nullable = false, length = 60)
    private String name;

    public Short getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
}
