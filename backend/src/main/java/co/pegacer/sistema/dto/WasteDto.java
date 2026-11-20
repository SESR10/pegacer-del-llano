package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Waste;

import java.math.BigDecimal;
import java.time.Instant;

public record WasteDto(Long id, Long productId, String productCode, String productName, String unit,
                       Long batchId, String batchCode, BigDecimal quantity, String reason, Instant recordedAt, String user) {
    public static WasteDto of(Waste w) {
        return new WasteDto(w.getId(), w.getProduct().getId(), w.getProduct().getCode(), w.getProduct().getName(),
                w.getProduct().getUnit().getCode(), w.getBatch() == null ? null : w.getBatch().getId(),
                w.getBatch() == null ? null : w.getBatch().getCode(), w.getQuantity(), w.getReason(), w.getRecordedAt(),
                w.getUser() == null ? null : w.getUser().getFullName());
    }
}
