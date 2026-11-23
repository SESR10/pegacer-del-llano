package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Alert;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    @EntityGraph(attributePaths = {"product", "batch"})
    @Query("SELECT a FROM Alert a WHERE (:resolved IS NULL OR a.resolved = :resolved) ORDER BY a.createdAt DESC, a.id DESC")
    List<Alert> search(@Param("resolved") Boolean resolved);

    @EntityGraph(attributePaths = {"product", "batch", "resolvedBy"})
    @Query("SELECT a FROM Alert a WHERE a.resolved = TRUE ORDER BY a.resolvedAt DESC NULLS LAST, a.id DESC")
    List<Alert> recentlyResolved(org.springframework.data.domain.Pageable page);

    List<Alert> findByProductIdAndAlertTypeInAndResolvedFalse(Long productId, Collection<String> types);

    void deleteByProductId(Long productId);
}
