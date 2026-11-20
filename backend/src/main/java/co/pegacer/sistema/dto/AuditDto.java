package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.AuditLog;

import java.time.Instant;
import java.util.Map;

public record AuditDto(Long id, String user, String action, String entity, Long entityId,
                       Map<String, Object> details, Instant createdAt) {
    public static AuditDto of(AuditLog a) {
        return new AuditDto(a.getId(), a.getUser() == null ? null : a.getUser().getUsername(), a.getAction(),
                a.getEntity(), a.getEntityId(), a.getDetails(), a.getCreatedAt());
    }
}
