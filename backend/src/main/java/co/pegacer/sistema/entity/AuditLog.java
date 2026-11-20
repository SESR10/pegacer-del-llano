package co.pegacer.sistema.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

/** Quién hizo qué y cuándo. Se escribe para cada operación que cambia datos. */
@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;
    @Column(nullable = false, length = 40)
    private String action;
    @Column(nullable = false, length = 40)
    private String entity;
    @Column(name = "entity_id")
    private Long entityId;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() { }

    public AuditLog(AppUser user, String action, String entity, Long entityId, Map<String, Object> details) {
        this.user = user;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.details = details;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public String getAction() { return action; }
    public String getEntity() { return entity; }
    public Long getEntityId() { return entityId; }
    public Map<String, Object> getDetails() { return details; }
    public Instant getCreatedAt() { return createdAt; }
}
