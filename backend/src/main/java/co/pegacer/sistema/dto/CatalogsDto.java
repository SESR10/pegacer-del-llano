package co.pegacer.sistema.dto;

import java.util.List;

/** Listas para llenar los selectores de los formularios. */
public record CatalogsDto(List<Item> categories, List<Item> units, List<Item> roles, List<String> adjustmentTypes) {
    public record Item(String code, String name) { }
}
