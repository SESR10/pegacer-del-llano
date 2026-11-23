package co.pegacer.sistema.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Despacho (salida de producto terminado) con uno o varios productos. dispatchedAt opcional (por defecto, ahora). */
public record DispatchRequest(
        @NotBlank(message = "Escriba el cliente o destino.") @Size(max = 120, message = "El cliente admite máximo 120 caracteres.")
        String customerName,
        Instant dispatchedAt,
        @NotEmpty(message = "Agregue al menos un producto al despacho.") List<@Valid Item> items) {

    public record Item(
            @NotNull(message = "Seleccione el producto.") Long productId,
            @NotNull(message = "Escriba la cantidad.") @Positive(message = "La cantidad debe ser mayor que cero.")
            @Digits(integer = 9, fraction = 3, message = "La cantidad admite máximo 3 decimales.") BigDecimal quantity) { }
}
