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

    List<Alert> findByProductIdAndAlertTypeInAndResolvedFalse(Long productId, Collection<String> types);

    void deleteByProductId(Long productId);
}
