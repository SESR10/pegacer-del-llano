package co.pegacer.sistema.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

/** Desperdicio: material perdido por daño, derrame o defecto. Se descuenta del inventario. */
public record WasteRequest(
        @NotNull(message = "Seleccione el producto.") Long productId,
        @NotNull(message = "Escriba la cantidad.") @Positive(message = "La cantidad debe ser mayor que cero.")
        @Digits(integer = 9, fraction = 3, message = "La cantidad admite máximo 3 decimales.") BigDecimal quantity,
        @NotBlank(message = "Escriba el motivo.") @Size(max = 120, message = "El motivo admite máximo 120 caracteres.") String reason,
        @Size(max = 500, message = "Las observaciones admiten máximo 500 caracteres.") String notes,
        Long batchId,
        Instant recordedAt) {
}
