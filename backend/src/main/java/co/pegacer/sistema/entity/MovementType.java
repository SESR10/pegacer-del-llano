package co.pegacer.sistema.entity;

/** Tipos de movimiento del kardex. Los de entrada suman al stock; los de salida restan. */
public enum MovementType {
    ENTRADA_COMPRA(true), PRODUCCION(true), AJUSTE_POS(true), INICIAL(true),
    CONSUMO_COCHADA(false), SALIDA_DESPACHO(false), DESPERDICIO(false), AJUSTE_NEG(false);

    private final boolean entry;
    MovementType(boolean entry) { this.entry = entry; }
    public boolean isEntry() { return entry; }
}
