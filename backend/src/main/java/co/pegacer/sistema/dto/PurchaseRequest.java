package co.pegacer.sistema.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Compra a un proveedor con uno o varios productos. purchasedAt opcional (por defecto, ahora). */
public record PurchaseRequest(
        @NotNull(message = "Seleccione el proveedor.") Long supplierId,
        @Size(max = 40, message = "El número de factura admite máximo 40 caracteres.") String invoiceNumber,
        Instant purchasedAt,
        @NotEmpty(message = "Agregue al menos un producto a la compra.") List<@Valid Item> items) {

    public record Item(
            @NotNull(message = "Seleccione el producto.") Long productId,
            @NotNull(message = "Escriba la cantidad.") @Positive(message = "La cantidad debe ser mayor que cero.")
            @Digits(integer = 9, fraction = 3, message = "La cantidad admite máximo 3 decimales.") BigDecimal quantity,
            @PositiveOrZero(message = "El costo no puede ser negativo.")
            @Digits(integer = 12, fraction = 2, message = "El costo admite máximo 2 decimales.") BigDecimal unitCost) { }
}
