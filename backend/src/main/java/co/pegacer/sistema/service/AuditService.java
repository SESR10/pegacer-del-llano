package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.AuditDto;
import co.pegacer.sistema.dto.PageDto;
import co.pegacer.sistema.entity.AppUser;
import co.pegacer.sistema.entity.AuditLog;
import co.pegacer.sistema.repository.AuditLogRepository;
import co.pegacer.sistema.security.CurrentUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/** Registra quién realizó cada operación (sección 24 del prompt maestro). */
@Service
public class AuditService {
    private final AuditLogRepository repo;
    private final CurrentUser currentUser;

    public AuditService(AuditLogRepository repo, CurrentUser currentUser) {
        this.repo = repo;
        this.currentUser = currentUser;
    }

    /** Se guarda en la misma transacción de la operación: si la operación falla, no queda registro. */
    @Transactional
    public void log(String action, String entity, Long entityId, Map<String, Object> details) {
        repo.save(new AuditLog(currentUser.entityOrNull(), action, entity, entityId, details));
    }

    /** Para eventos sin sesión todavía (ej: inicio de sesión). */
    @Transactional
    public void log(AppUser user, String action, String entity, Long entityId, Map<String, Object> details) {
        repo.save(new AuditLog(user, action, entity, entityId, details));
    }

    @Transactional(readOnly = true)
    public PageDto<AuditDto> list(int page, int size) {
        return PageDto.of(repo.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(page, size)), AuditDto::of);
    }
}
