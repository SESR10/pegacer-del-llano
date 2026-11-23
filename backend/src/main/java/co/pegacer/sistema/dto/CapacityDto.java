package co.pegacer.sistema.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Capacidad de producción con el inventario actual (sección 15 del prompt maestro):
 * cuántas cochadas alcanzan con cada material, cuál es el recurso limitante y cuántas bolsas se obtendrían.
 */
public record CapacityDto(Long formulaId, String formulaName, String productName, int batches,
                          BigDecimal estimatedBags, String limitingProduct, List<Material> materials) {
    public record Material(Long productId, String code, String name, String unit, BigDecimal stock,
                           BigDecimal perBatch, int batches, boolean limiting) { }
}
