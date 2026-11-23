package co.pegacer.sistema.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Nueva fórmula o nueva versión de la fórmula de un producto terminado (Fase 9).
 * Las fórmulas no se sobrescriben: cada cambio crea una versión nueva y desactiva la anterior,
 * así las cochadas ya registradas conservan la receta con la que se hicieron.
 */
public record FormulaRequest(
        @NotNull(message = "Seleccione el producto terminado.") Long productId,
        @NotBlank(message = "Escriba el nombre de la fórmula.") @Size(max = 120, message = "El nombre admite máximo 120 caracteres.")
        String name,
        @NotNull(message = "Escriba las bolsas esperadas por cochada.") @Positive(message = "Las bolsas esperadas deben ser mayores que cero.")
        @Digits(integer = 6, fraction = 2, message = "Las bolsas admiten máximo 2 decimales.") BigDecimal expectedBags,
        @NotNull(message = "Escriba el mínimo de bolsas por cochada.") @Positive(message = "El mínimo de bolsas debe ser mayor que cero.")
        @Digits(integer = 6, fraction = 2, message = "Las bolsas admiten máximo 2 decimales.") BigDecimal minBags,
        @NotNull(message = "Escriba el máximo de bolsas por cochada.") @Positive(message = "El máximo de bolsas debe ser mayor que cero.")
        @Digits(integer = 6, fraction = 2, message = "Las bolsas admiten máximo 2 decimales.") BigDecimal maxBags,
        @NotNull(message = "Escriba el peso por bolsa.") @Positive(message = "El peso por bolsa debe ser mayor que cero.")
        @Digits(integer = 4, fraction = 2, message = "El peso admite máximo 2 decimales.") BigDecimal bagWeightKg,
        @NotEmpty(message = "Agregue al menos un material a la fórmula.") List<@Valid Item> items) {

    public record Item(
            @NotNull(message = "Seleccione el material.") Long productId,
            @NotNull(message = "Escriba la cantidad de cada material.") @Positive(message = "La cantidad de cada material debe ser mayor que cero.")
            @Digits(integer = 9, fraction = 3, message = "Las cantidades admiten máximo 3 decimales.") BigDecimal quantity) { }
}
