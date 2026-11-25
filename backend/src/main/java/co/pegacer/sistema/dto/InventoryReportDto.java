package co.pegacer.sistema.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Fase 14: movimiento del inventario en un periodo. Por producto: saldo al inicio, entradas y salidas por tipo y saldo al final.
 * movements tiene una clave por tipo de movimiento (ENTRADA_COMPRA, CONSUMO_COCHADA, AJUSTE_POS, ...).
 */
public record InventoryReportDto(Instant from, Instant to, List<Row> rows) {
    public record Row(Long productId, String code, String name, String category, String unit, BigDecimal unitCost,
                      BigDecimal opening, BigDecimal entries, BigDecimal exits, BigDecimal closing,
                      Map<String, BigDecimal> movements) { }
}
