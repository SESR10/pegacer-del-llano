package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.MovementType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** Ajuste manual de inventario (AJUSTE_POS o AJUSTE_NEG). Siempre exige el motivo. */
public record MovementRequest(
        @NotNull(message = "Seleccione el producto.") Long productId,
        @NotNull(message = "Seleccione el tipo de ajuste.") MovementType type,
        @NotNull(message = "La cantidad es obligatoria.") @Positive(message = "La cantidad debe ser mayor que cero.")
        BigDecimal quantity,
        @NotBlank(message = "Escriba el motivo del ajuste.") @Size(max = 500, message = "El motivo admite máximo 500 caracteres.")
        String notes) {
}
