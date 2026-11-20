package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Batch;
import co.pegacer.sistema.entity.BatchConsumption;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Cochada con sus consumos. inRange indica si las bolsas producidas están dentro del rango de la fórmula. */
public record BatchDto(Long id, String code, Long formulaId, String formulaName, String productName,
                       Instant producedAt, String operator, BigDecimal bagsProduced, BigDecimal minBags,
                       BigDecimal maxBags, boolean inRange, String status, String notes,
                       List<Consumption> consumptions) {
    public record Consumption(Long productId, String code, String name, String unit, BigDecimal theoretical,
                              BigDecimal real, BigDecimal variationQty, BigDecimal variationPct) {
        static Consumption of(BatchConsumption c) {
            return new Consumption(c.getProduct().getId(), c.getProduct().getCode(), c.getProduct().getName(),
                    c.getProduct().getUnit().getCode(), c.getTheoreticalQty(), c.getRealQty(),
                    c.getVariationQty(), c.getVariationPct());
        }
    }

    public static BatchDto of(Batch b, List<BatchConsumption> consumptions) {
        var f = b.getFormula();
        boolean inRange = b.getBagsProduced().compareTo(f.getMinBags()) >= 0
                && b.getBagsProduced().compareTo(f.getMaxBags()) <= 0;
        return new BatchDto(b.getId(), b.getCode(), f.getId(), f.getName(), f.getProduct().getName(),
                b.getProducedAt(), b.getOperator() == null ? null : b.getOperator().getFullName(),
                b.getBagsProduced(), f.getMinBags(), f.getMaxBags(), inRange, b.getStatus(), b.getNotes(),
                consumptions.stream().map(Consumption::of).toList());
    }
}
