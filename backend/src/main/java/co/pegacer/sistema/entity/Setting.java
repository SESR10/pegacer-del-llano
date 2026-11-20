package co.pegacer.sistema.entity;

import jakarta.persistence.*;

/** Parámetro configurable, ej: consumo.tolerancia_pct = 5. */
@Entity
@Table(name = "settings")
public class Setting {
    @Id
    @Column(length = 60)
    private String key;
    @Column(nullable = false, length = 200)
    private String value;
    @Column(length = 200)
    private String description;

    public String getKey() { return key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getDescription() { return description; }
}
