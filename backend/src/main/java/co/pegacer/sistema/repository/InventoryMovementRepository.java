package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.InventoryMovement;
import co.pegacer.sistema.entity.MovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    @EntityGraph(attributePaths = {"product", "product.unit", "user"})
    @Query("""
        SELECT m FROM InventoryMovement m
        WHERE (:productId IS NULL OR m.product.id = :productId)
          AND (:type IS NULL OR m.movementType = :type)
          AND m.createdAt >= COALESCE(:from, m.createdAt)
          AND m.createdAt <= COALESCE(:to, m.createdAt)
        ORDER BY m.createdAt DESC, m.id DESC""")
    Page<InventoryMovement> search(@Param("productId") Long productId, @Param("type") MovementType type,
                                   @Param("from") Instant from, @Param("to") Instant to, Pageable pageable);

    boolean existsByProductId(Long productId);
}
