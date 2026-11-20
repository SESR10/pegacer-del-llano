package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.InventoryMovement;

import java.math.BigDecimal;
import java.time.Instant;

public record MovementDto(Long id, Long productId, String productCode, String productName, String unit,
                          String type, BigDecimal quantity, BigDecimal stockBefore, BigDecimal stockAfter,
                          String referenceType, Long referenceId, String user, String notes, Instant createdAt) {
    public static MovementDto of(InventoryMovement m) {
        return new MovementDto(m.getId(), m.getProduct().getId(), m.getProduct().getCode(), m.getProduct().getName(),
                m.getProduct().getUnit().getCode(), m.getMovementType().name(), m.getQuantity(), m.getStockBefore(),
                m.getStockAfter(), m.getReferenceType(), m.getReferenceId(),
                m.getUser() == null ? null : m.getUser().getFullName(), m.getNotes(), m.getCreatedAt());
    }
}
