package co.pegacer.sistema.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Registro de una cochada (Fase 10): fórmula usada, bolsas obtenidas y consumo real de cada material.
 * producedAt es opcional (por defecto, ahora).
 */
public record BatchRequest(
        @NotNull(message = "Seleccione la fórmula.") Long formulaId,
        @NotNull(message = "Escriba cuántas bolsas se produjeron.")
        @Positive(message = "Las bolsas producidas deben ser mayores que cero.")
        @Digits(integer = 6, fraction = 2, message = "Las bolsas producidas admiten máximo 2 decimales.")
        BigDecimal bagsProduced,
        Instant producedAt,
        @Size(max = 500, message = "Las observaciones admiten máximo 500 caracteres.") String notes,
        @NotEmpty(message = "Escriba el consumo real de los materiales.") List<@Valid Item> consumptions) {

    public record Item(
            @NotNull(message = "Falta el material.") Long productId,
            @NotNull(message = "Escriba el consumo real de cada material.")
            @Positive(message = "El consumo real debe ser mayor que cero.")
            @Digits(integer = 9, fraction = 3, message = "El consumo admite máximo 3 decimales.")
            BigDecimal realQty) { }
}
