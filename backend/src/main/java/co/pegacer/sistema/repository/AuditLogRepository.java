package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @EntityGraph(attributePaths = {"user"})
    Page<AuditLog> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
}
