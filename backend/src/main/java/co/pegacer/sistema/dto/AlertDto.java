package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Alert;

import java.time.Instant;

public record AlertDto(Long id, String type, String severity, Long productId, String productName,
                       Long batchId, String batchCode, String message, boolean resolved, Instant createdAt) {
    public static AlertDto of(Alert a) {
        return new AlertDto(a.getId(), a.getAlertType(), a.getSeverity(),
                a.getProduct() == null ? null : a.getProduct().getId(),
                a.getProduct() == null ? null : a.getProduct().getName(),
                a.getBatch() == null ? null : a.getBatch().getId(),
                a.getBatch() == null ? null : a.getBatch().getCode(),
                a.getMessage(), a.isResolved(), a.getCreatedAt());
    }
}
