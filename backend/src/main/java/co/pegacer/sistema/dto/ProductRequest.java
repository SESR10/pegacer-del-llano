package co.pegacer.sistema.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Crear o editar un producto. El stock no se edita aquí: solo cambia con movimientos de inventario.
 * initialStock solo se usa al crear (genera un movimiento INICIAL en el kardex).
 */
public record ProductRequest(
        @NotBlank(message = "El código es obligatorio.") @Size(max = 20, message = "El código admite máximo 20 caracteres.")
        String code,
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 120, message = "El nombre admite máximo 120 caracteres.")
        String name,
        @NotBlank(message = "La categoría es obligatoria.") String category,
        @NotBlank(message = "La unidad de medida es obligatoria.") String unit,
        @NotNull(message = "El stock mínimo es obligatorio.") @PositiveOrZero(message = "El stock mínimo no puede ser negativo.")
        BigDecimal minStock,
        @PositiveOrZero(message = "El costo unitario no puede ser negativo.") BigDecimal unitCost,
        @PositiveOrZero(message = "El stock inicial no puede ser negativo.") BigDecimal initialStock) {
}
