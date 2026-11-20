package co.pegacer.sistema.controller;

/** Límite de tamaño de página para que nadie pida un millón de filas de una vez. */
final class Pagination {
    static final int MAX = 200;
    static int size(int requested) { return Math.min(Math.max(requested, 1), MAX); }
    private Pagination() { }
}
