package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Formula;

import java.math.BigDecimal;
import java.util.List;

public record FormulaDto(Long id, String name, int version, Long productId, String productName,
                         BigDecimal expectedBags, BigDecimal minBags, BigDecimal maxBags, BigDecimal bagWeightKg,
                         boolean active, java.time.Instant createdAt, List<Item> items) {
    public record Item(Long productId, String code, String name, String unit, BigDecimal quantity) { }

    public static FormulaDto of(Formula f) {
        return new FormulaDto(f.getId(), f.getName(), f.getVersion(), f.getProduct().getId(), f.getProduct().getName(),
                f.getExpectedBags(), f.getMinBags(), f.getMaxBags(), f.getBagWeightKg(), f.isActive(), f.getCreatedAt(),
                f.getItems().stream().map(i -> new Item(i.getProduct().getId(), i.getProduct().getCode(),
                        i.getProduct().getName(), i.getProduct().getUnit().getCode(), i.getQuantity())).toList());
    }
}
